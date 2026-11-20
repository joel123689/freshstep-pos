import hashlib
import json
import os
import secrets
import sqlite3
import urllib.request
import zipfile
import io
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / "freshstep.db"
STATIC_FILES = {"/", "/index.html", "/styles.css", "/app.js", "/freshstep-logo.jpg", "/manifest.webmanifest", "/sw.js"}
sessions = {}


def connect_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with connect_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE,
                role TEXT NOT NULL,
                phone TEXT,
                pin_hash TEXT,
                active INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                customer TEXT NOT NULL,
                phone TEXT,
                service TEXT,
                items TEXT NOT NULL,
                amount INTEGER NOT NULL,
                status TEXT NOT NULL,
                due TEXT,
                payment TEXT,
                assigned_to TEXT,
                addons TEXT,
                notes TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                worker TEXT NOT NULL,
                date TEXT NOT NULL,
                arrived_at TEXT NOT NULL,
                UNIQUE(worker, date)
            );
            CREATE TABLE IF NOT EXISTS inventory (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                reorder_at REAL NOT NULL
            );
            """
        )
        users = db.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if users == 0:
            owner_pin = os.environ.get("FRESHSTEP_OWNER_PIN", "ChangeMe-Owner")
            admin_pin = os.environ.get("FRESHSTEP_ADMIN_PIN", "ChangeMe-Admin")
            db.executemany(
                "INSERT INTO users(name, role, phone, pin_hash) VALUES (?, ?, ?, ?)",
                [
                    ("KYEYUNE CHARLES", "owner", "+971523275995", hash_pin(owner_pin)),
                    ("BUKENYA JOEL", "admin", "256702634159", hash_pin(admin_pin)),
                    ("NAMUGA HELLEN", "worker", "", None),
                    ("NAMUTEBI ANNET", "worker", "", None),
                    ("NAKACHWA MIRIAM", "worker", "", None),
                ],
            )
        inventory = db.execute("SELECT COUNT(*) AS count FROM inventory").fetchone()["count"]
        if inventory == 0:
            db.executemany(
                "INSERT INTO inventory(id, name, quantity, unit, reorder_at) VALUES (?, ?, ?, ?, ?)",
                [
                    ("detergent", "Laundry detergent", 24, "units", 10),
                    ("softener", "Fabric softener", 8, "bottles", 10),
                    ("bags", "Protective garment bags", 12, "bags", 15),
                ],
            )
        temporary_worker_pin = hash_pin("2055")
        db.execute(
            "UPDATE users SET pin_hash=? WHERE role='worker' AND (pin_hash IS NULL OR pin_hash='')",
            (temporary_worker_pin,),
        )


def hash_pin(pin):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt.encode("ascii"), 200_000)
    return f"pbkdf2${salt}${digest.hex()}"


def verify_pin(pin, stored):
    if stored.startswith("pbkdf2$"):
        parts = stored.split("$")
        if len(parts) != 3:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), parts[1].encode("ascii"), 200_000).hex()
        return secrets.compare_digest(digest, parts[2])
    return secrets.compare_digest(hashlib.sha256(pin.encode("utf-8")).hexdigest(), stored)


def get_session(handler):
    cookie = handler.headers.get("Cookie", "")
    token = next((part.strip().split("=", 1)[1] for part in cookie.split(";") if part.strip().startswith("session=")), "")
    return sessions.get(token)


def send_whatsapp(server, message):
    token = os.environ.get("META_WHATSAPP_TOKEN")
    phone_id = os.environ.get("META_WHATSAPP_PHONE_ID")
    recipients = [
        os.environ.get("FRESHSTEP_ADMIN_PHONE", "256702634159"),
        os.environ.get("FRESHSTEP_OWNER_PHONE", "971523275995"),
    ]
    if not token or not phone_id:
        return {"enabled": False, "reason": "META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID are not configured"}
    results = []
    for recipient in recipients:
        payload = json.dumps({
            "messaging_product": "whatsapp",
            "to": recipient,
            "type": "text",
            "text": {"body": message},
        }).encode("utf-8")
        request = urllib.request.Request(
            f"https://graph.facebook.com/v21.0/{phone_id}/messages",
            data=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                results.append({"recipient": recipient, "ok": 200 <= response.status < 300})
        except Exception as error:
            results.append({"recipient": recipient, "ok": False, "error": str(error)})
    return {"enabled": True, "results": results}


def send_customer_whatsapp(recipient, message):
    token = os.environ.get("META_WHATSAPP_TOKEN")
    phone_id = os.environ.get("META_WHATSAPP_PHONE_ID")
    if not token or not phone_id:
        return {"enabled": False, "reason": "META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_ID are not configured"}
    payload = json.dumps({
        "messaging_product": "whatsapp",
        "to": recipient,
        "type": "text",
        "text": {"body": message},
    }).encode("utf-8")
    request = urllib.request.Request(
        f"https://graph.facebook.com/v21.0/{phone_id}/messages",
        data=payload,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return {"enabled": True, "ok": 200 <= response.status < 300}
    except Exception as error:
        return {"enabled": True, "ok": False, "error": str(error)}


class Handler(BaseHTTPRequestHandler):
    server_version = "FreshStepPOS/1.0"

    def send_json(self, status, payload, extra_headers=None):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        if extra_headers:
            for name, value in extra_headers.items():
                self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path):
        file_path = ROOT / path.lstrip("/")
        if path == "/":
            file_path = ROOT / "index.html"
        if not file_path.is_file() or ROOT not in file_path.parents:
            self.send_error(404)
            return
        content = file_path.read_bytes()
        mime = (
            "text/html" if file_path.suffix == ".html"
            else "text/css" if file_path.suffix == ".css"
            else "image/jpeg" if file_path.suffix == ".jpg"
            else "application/manifest+json" if file_path.suffix == ".webmanifest"
            else "text/javascript" if file_path.suffix == ".js"
            else "application/octet-stream"
        )
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def require_role(self, roles):
        session = get_session(self)
        if not session or session["role"] not in roles:
            return None
        return session

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/download":
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
                for file_path in ROOT.iterdir():
                    if not file_path.is_file():
                        continue
                    if file_path.name in {".env", "freshstep.db"} or file_path.suffix in {".pyc"}:
                        continue
                    if file_path.name.startswith("."):
                        if file_path.name not in {".env.example", ".gitignore"}:
                            continue
                    archive.write(file_path, file_path.name)
            content = buffer.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="FreshStepPOS.zip"')
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        if path in STATIC_FILES:
            self.send_file(path)
            return
        if path == "/api/session":
            session = get_session(self)
            self.send_json(200, {"authenticated": bool(session), "user": session})
            return
        if path == "/api/orders":
            session = get_session(self)
            if not session:
                self.send_json(401, {"error": "Authentication required"})
                return
            with connect_db() as db:
                rows = db.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
                orders = []
                for row in rows:
                    order = dict(row)
                    order["items"] = json.loads(order["items"] or "[]")
                    order["addons"] = json.loads(order["addons"] or "[]")
                    if session["role"] == "worker" and order["assigned_to"] != session["name"]:
                        continue
                    orders.append(order)
            self.send_json(200, {"orders": orders})
            return
        if path == "/api/workers":
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            with connect_db() as db:
                rows = db.execute("SELECT name, phone, role, active FROM users WHERE role='worker'").fetchall()
            self.send_json(200, {"workers": [dict(row) for row in rows]})
            return
        if path == "/api/attendance":
            session = get_session(self)
            if not session:
                self.send_json(401, {"error": "Authentication required"})
                return
            with connect_db() as db:
                if session["role"] == "worker":
                    rows = db.execute("SELECT * FROM attendance WHERE worker=? ORDER BY arrived_at DESC", (session["name"],)).fetchall()
                else:
                    rows = db.execute("SELECT * FROM attendance ORDER BY arrived_at DESC").fetchall()
            self.send_json(200, {"attendance": [dict(row) for row in rows]})
            return
        if path == "/api/inventory":
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            with connect_db() as db:
                rows = db.execute("SELECT * FROM inventory ORDER BY name").fetchall()
            self.send_json(200, {"inventory": [dict(row) for row in rows]})
            return
        self.send_error(404)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
        except Exception:
            self.send_json(400, {"error": "Invalid JSON"})
            return
        if path == "/api/login":
            name = str(data.get("name", "")).strip()
            pin = str(data.get("pin", ""))
            with connect_db() as db:
                user = db.execute("SELECT * FROM users WHERE name=? AND active=1", (name,)).fetchone()
            if not user:
                self.send_json(401, {"error": "Unknown user"})
                return
            if not user["pin_hash"]:
                self.send_json(401, {"error": "A PIN has not been assigned to this account"})
                return
            if not verify_pin(pin, user["pin_hash"]):
                self.send_json(401, {"error": "Invalid PIN"})
                return
            if user["role"] == "worker" and not pin:
                self.send_json(401, {"error": "PIN required"})
                return
            token = secrets.token_urlsafe(32)
            session = {"name": user["name"], "role": user["role"], "phone": user["phone"]}
            sessions[token] = session
            whatsapp = {"enabled": False, "reason": "Automatic attendance alerts are only enabled for workers"}
            if user["role"] == "worker":
                from datetime import datetime
                now = datetime.now().astimezone().isoformat()
                date = now[:10]
                with connect_db() as db:
                    db.execute(
                        "INSERT INTO attendance(worker, date, arrived_at) VALUES (?, ?, ?) ON CONFLICT(worker, date) DO NOTHING",
                        (session["name"], date, now),
                    )
                    record = db.execute(
                        "SELECT * FROM attendance WHERE worker=? AND date=?",
                        (session["name"], date),
                    ).fetchone()
                whatsapp = send_whatsapp(
                    self.server,
                    f"FreshStep attendance: {session['name']} reported at {record['arrived_at']}.",
                )
            self.send_json(
                200,
                {"authenticated": True, "user": session, "whatsapp": whatsapp},
                {"Set-Cookie": f"session={token}; HttpOnly; SameSite=Strict; Path=/"},
            )
            return
        if path == "/api/logout":
            cookie = self.headers.get("Cookie", "")
            token = next((part.strip().split("=", 1)[1] for part in cookie.split(";") if part.strip().startswith("session=")), "")
            sessions.pop(token, None)
            self.send_json(200, {"authenticated": False}, {"Set-Cookie": "session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"})
            return
        if path == "/api/change-pin":
            session = get_session(self)
            if not session:
                self.send_json(401, {"error": "Authentication required"})
                return
            current_pin = str(data.get("currentPin", "")).strip()
            new_pin = str(data.get("newPin", "")).strip()
            if len(new_pin) < 4:
                self.send_json(400, {"error": "New PIN must contain at least 4 characters"})
                return
            with connect_db() as db:
                user = db.execute("SELECT pin_hash FROM users WHERE name=? AND active=1", (session["name"],)).fetchone()
                if not user or not verify_pin(current_pin, user["pin_hash"]):
                    self.send_json(401, {"error": "Current PIN is incorrect"})
                    return
                db.execute("UPDATE users SET pin_hash=? WHERE name=?", (hash_pin(new_pin), session["name"]))
            self.send_json(200, {"changed": True})
            return
        if path == "/api/orders":
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            order_id = str(data["id"])
            with connect_db() as db:
                db.execute(
                    """INSERT INTO orders(id, customer, phone, service, items, amount, status, due, payment, assigned_to, addons, notes, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       ON CONFLICT(id) DO UPDATE SET
                       customer=excluded.customer, phone=excluded.phone, service=excluded.service, items=excluded.items,
                       amount=excluded.amount, status=excluded.status, due=excluded.due, payment=excluded.payment,
                       assigned_to=excluded.assigned_to, addons=excluded.addons, notes=excluded.notes""",
                    (
                        order_id, data["customer"], data.get("phone", ""), data.get("service", ""),
                        json.dumps(data.get("items", [])), int(data["amount"]), data.get("status", "Received"),
                        data.get("due", ""), data.get("payment", "Unpaid"), data.get("assignedTo", ""),
                        json.dumps(data.get("addons", [])), data.get("notes", ""), data["createdAt"],
                    ),
                )
            self.send_json(200, {"orderId": order_id})
            return
        if path == "/api/attendance":
            session = get_session(self)
            if not session or session["role"] != "worker":
                self.send_json(403, {"error": "Worker authentication required"})
                return
            from datetime import datetime
            now = datetime.now().astimezone().isoformat()
            date = now[:10]
            with connect_db() as db:
                db.execute(
                    "INSERT INTO attendance(worker, date, arrived_at) VALUES (?, ?, ?) ON CONFLICT(worker, date) DO NOTHING",
                    (session["name"], date, now),
                )
                record = db.execute("SELECT * FROM attendance WHERE worker=? AND date=?", (session["name"], date)).fetchone()
            message = f"FreshStep attendance: {session['name']} reported at {record['arrived_at']}."
            whatsapp = send_whatsapp(self.server, message)
            self.send_json(200, {"record": dict(record), "whatsapp": whatsapp})
            return
        if path == "/api/workers":
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            name = str(data.get("name", "")).strip()
            phone = str(data.get("phone", "")).strip()
            pin = str(data.get("pin", "")).strip()
            if not name or len(pin) < 4:
                self.send_json(400, {"error": "Worker name and a 4-character PIN are required"})
                return
            with connect_db() as db:
                db.execute(
                    "INSERT INTO users(name, role, phone, pin_hash) VALUES (?, 'worker', ?, ?) "
                    "ON CONFLICT(name) DO UPDATE SET phone=excluded.phone, pin_hash=excluded.pin_hash, active=1",
                    (name, phone, hash_pin(pin)),
                )
            self.send_json(200, {"name": name})
            return
        if path == "/api/inventory":
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            with connect_db() as db:
                db.execute(
                    "INSERT INTO inventory(id, name, quantity, unit, reorder_at) VALUES (?, ?, ?, ?, ?) "
                    "ON CONFLICT(id) DO UPDATE SET name=excluded.name, quantity=excluded.quantity, unit=excluded.unit, reorder_at=excluded.reorder_at",
                    (str(data["id"]), str(data["name"]), float(data["quantity"]), str(data["unit"]), float(data["reorderAt"])),
                )
            self.send_json(200, {"id": data["id"]})
            return
        if path.startswith("/api/notifications/order/"):
            session = get_session(self)
            if not session:
                self.send_json(401, {"error": "Authentication required"})
                return
            order_id = path.rsplit("/", 1)[1]
            with connect_db() as db:
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
            if not order:
                self.send_json(404, {"error": "Order not found"})
                return
            if session["role"] == "worker" and order["assigned_to"] != session["name"]:
                self.send_json(403, {"error": "This order is not assigned to you"})
                return
            recipient = str(order["phone"] or "").replace(" ", "").replace("-", "")
            if recipient.startswith("0"):
                recipient = "256" + recipient[1:]
            if not recipient:
                self.send_json(400, {"error": "Customer phone number is missing"})
                return
            status = str(order["status"])
            update = "has been completed"
            if status == "Ready":
                update = "is ready for pickup or delivery"
            elif status == "Out for delivery":
                update = "is out for delivery"
            message = (
                f"Hello {order['customer']}, your FreshStep order {order_id} {update}. "
                "Thank you for choosing FreshStep Laundry, Garment & Shoe Care — Cleaning Made Effortless!"
            )
            whatsapp = send_customer_whatsapp(recipient, message)
            self.send_json(200, {"recipient": recipient, "whatsapp": whatsapp})
            return
        if path.startswith("/api/notifications/receipt/"):
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            order_id = path.rsplit("/", 1)[1]
            with connect_db() as db:
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
            if not order:
                self.send_json(404, {"error": "Order not found"})
                return
            recipient = str(order["phone"] or "").replace(" ", "").replace("-", "")
            if recipient.startswith("0"):
                recipient = "256" + recipient[1:]
            if not recipient:
                self.send_json(400, {"error": "Customer phone number is missing"})
                return
            items = json.loads(order["items"] or "[]")
            lines = [
                f"- {item.get('service', 'Item')} — {item.get('quantity', 1)} "
                f"{item.get('unit', 'item')}: UGX {int(item.get('amount', 0)):,.0f}"
                for item in items
            ]
            message = "\n".join([
                "FRESHSTEP LAUNDRY, GARMENT & SHOE CARE",
                "Cleaning Made Effortless!",
                f"Receipt: {order_id}",
                f"Customer: {order['customer']}",
                f"Phone: {order['phone']}",
                *lines,
                f"Payment: {order['payment'] or 'Unpaid'}",
                f"TOTAL: UGX {int(order['amount']):,.0f}",
                "",
                "Thank you for choosing FreshStep!",
                "Warm regards, The FreshStep Team",
            ])
            whatsapp = send_customer_whatsapp(recipient, message)
            self.send_json(200, {"recipient": recipient, "whatsapp": whatsapp})
            return
        self.send_error(404)

    def do_PUT(self):
        path = urlparse(self.path).path
        if path.startswith("/api/orders/"):
            session = get_session(self)
            if not session:
                self.send_json(401, {"error": "Authentication required"})
                return
            data = self.read_json()
            order_id = path.rsplit("/", 1)[1]
            with connect_db() as db:
                order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
                if not order:
                    self.send_json(404, {"error": "Order not found"})
                    return
                if session["role"] == "worker" and order["assigned_to"] != session["name"]:
                    self.send_json(403, {"error": "This order is not assigned to you"})
                    return
                db.execute("UPDATE orders SET status=? WHERE id=?", (str(data["status"]), order_id))
            self.send_json(200, {"id": order_id, "status": data["status"]})
            return
        self.send_error(404)

    def do_DELETE(self):
        path = urlparse(self.path).path
        if path.startswith("/api/workers/"):
            session = self.require_role(("owner", "admin"))
            if not session:
                self.send_json(403, {"error": "Owner or admin access required"})
                return
            name = path.rsplit("/", 1)[1]
            from urllib.parse import unquote
            name = unquote(name)
            with connect_db() as db:
                db.execute("UPDATE users SET active=0 WHERE name=? AND role='worker'", (name,))
            self.send_json(200, {"name": name, "active": False})
            return
        self.send_error(404)

    def log_message(self, format, *args):
        print(f"{self.address_string()} - {format % args}")


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"FreshStep POS running at http://localhost:{port}")
    server.serve_forever()
