# FreshStep POS

This workspace contains a local full-stack POS demo with a static frontend, SQLite database, PIN sign-in, role controls, orders, inventory, attendance, and optional Meta WhatsApp Cloud API delivery.

## Start locally

```powershell
cd C:\Users\LENOVO\Documents\FreshStepPOS
$env:FRESHSTEP_OWNER_PIN = "use-a-private-owner-pin"
$env:FRESHSTEP_ADMIN_PIN = "use-a-private-admin-pin"
python server.py
```

Open `http://localhost:8080`.

Default temporary worker PIN: `2055`. Change it through a production account-management flow before real staff use.

## Environment variables

- `FRESHSTEP_OWNER_PIN`
- `FRESHSTEP_ADMIN_PIN`
- `META_WHATSAPP_TOKEN`
- `META_WHATSAPP_PHONE_ID`
- `FRESHSTEP_ADMIN_PHONE`
- `FRESHSTEP_OWNER_PHONE`
- `PORT`

The WhatsApp variables are optional. Without them, attendance is saved locally and the API reports that WhatsApp delivery is disabled.

## Security status

This version uses server-side SQLite and cookie sessions with owner/admin/worker roles. It is suitable for local or controlled deployment. Before internet exposure, add HTTPS, secure PIN hashing/rotation, CSRF protection, rate limits, backup, audit logs, and WebAuthn. The supplied PIN fields are not face recognition or a production biometric identity system.

## GitHub Codespaces

1. Open this repository in GitHub Codespaces.
2. Set repository Codespaces secrets for `FRESHSTEP_OWNER_PIN`, `FRESHSTEP_ADMIN_PIN`, and any Meta WhatsApp variables.
3. Codespaces forwards port `8080`.
4. Set port `8080` visibility to `Public` only if the POS should be reachable outside the Codespace; otherwise keep it `Private`.
