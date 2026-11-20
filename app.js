const demoOrders = [];
const demoWorkers = [
  { name: "NAMUGA HELLEN", phone: "" },
  { name: "NAMUTEBI ANNET", phone: "" },
  { name: "NAKACHWA MIRIAM", phone: "" }
];
const demoInventory = [
  { id: "detergent", name: "Laundry detergent", quantity: 24, unit: "units", reorderAt: 10 },
  { id: "softener", name: "Fabric softener", quantity: 8, unit: "bottles", reorderAt: 10 },
  { id: "bags", name: "Protective garment bags", quantity: 12, unit: "bags", reorderAt: 15 }
];
const ownerName = "KYEYUNE CHARLES";
const adminName = "BUKENYA JOEL";
const state = {
  role: "owner",
  page: "Dashboard",
  orders: loadOrders(),
  workers: loadWorkers(),
  inventory: loadInventory(),
  currentWorker: "NAMUGA HELLEN",
  attendance: loadAttendance(),
  activeReceiptOrderId: null,
  editingOrderId: null
};

const navItems = [
  ["Dashboard", "▦"], ["Orders", "▤"], ["Customers", "♧"], ["Services", "♢"],
  ["Inventory", "▣"], ["Memberships", "♙"], ["Attendance", "◷"], ["Members", "♧"], ["Reports", "⌁"], ["Settings", "⚙"]
];

function loadOrders() {
  try {
    const saved = localStorage.getItem("freshstep-orders");
    return saved ? JSON.parse(saved) : demoOrders;
  } catch (error) {
    console.warn("Could not load saved FreshStep orders.", error);
    return demoOrders;
  }
}

function loadWorkers() {
  try {
    const saved = localStorage.getItem("freshstep-workers");
    return saved ? JSON.parse(saved) : demoWorkers;
  } catch (error) {
    console.warn("Could not load saved FreshStep workers.", error);
    return demoWorkers;
  }
}

function loadAttendance() {
  try {
    const saved = localStorage.getItem("freshstep-attendance");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("Could not load FreshStep attendance records.", error);
    return [];
  }
}

function loadInventory() {
  try {
    const saved = localStorage.getItem("freshstep-inventory");
    if (!saved) return demoInventory;
    const inventory = JSON.parse(saved);
    if (!Array.isArray(inventory)) throw new TypeError("Saved inventory must be a list.");
    return inventory;
  } catch (error) {
    console.warn("Could not load FreshStep inventory.", error);
    return demoInventory;
  }
}

function saveInventory() {
  try {
    localStorage.setItem("freshstep-inventory", JSON.stringify(state.inventory));
    return true;
  } catch (error) {
    console.error("Could not save FreshStep inventory.", error);
    showToast("Could not save inventory in browser storage");
    return false;
  }
}

function saveAttendance() {
  try {
    localStorage.setItem("freshstep-attendance", JSON.stringify(state.attendance));
    return true;
  } catch (error) {
    console.error("Could not save FreshStep attendance.", error);
    showToast("Could not save the attendance record");
    return false;
  }
}

function saveOrders() {
  try {
    localStorage.setItem("freshstep-orders", JSON.stringify(state.orders));
    return true;
  } catch (error) {
    console.error("Could not save FreshStep orders.", error);
    showToast("Could not save this order in browser storage");
    return false;
  }
}

function saveWorkers() {
  try {
    localStorage.setItem("freshstep-workers", JSON.stringify(state.workers));
    return true;
  } catch (error) {
    console.error("Could not save FreshStep workers.", error);
    showToast("Could not save this worker in browser storage");
    return false;
  }
}

function isManager() {
  return state.role === "owner" || state.role === "admin";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function formatUGX(amount) {
  return `UGX ${new Intl.NumberFormat("en-UG").format(amount)}`;
}

const priceBook = {
  basic: { name: "FreshStep Basic", price: 15000, unit: "kg", included: 5, extra: 2500 },
  premium: { name: "FreshStep Premium", price: 20000, unit: "kg", included: 5, extra: 3000 },
  executive: { name: "FreshStep Executive", price: 25000, unit: "kg", included: 5, extra: 3500 },
  shirt: { name: "Shirt / blouse", price: 3000, unit: "piece" },
  polo: { name: "Polo / T-shirt", price: 2500, unit: "piece" },
  trouser: { name: "Trouser / jeans", price: 4000, unit: "piece" },
  shorts: { name: "Shorts", price: 2500, unit: "piece" },
  skirt: { name: "Skirt", price: 3000, unit: "piece" },
  dress: { name: "Dress", price: 6000, unit: "piece" },
  jacket: { name: "Jacket", price: 8000, unit: "piece" },
  sweater: { name: "Sweater", price: 5000, unit: "piece" },
  hoodie: { name: "Hoodie", price: 6000, unit: "piece" },
  tie: { name: "Tie", price: 2000, unit: "piece" },
  "shoe-basic": { name: "Basic shoe cleaning", price: 10000, unit: "pair" },
  "shoe-deep": { name: "Deep shoe cleaning", price: 15000, unit: "pair" },
  luxury: { name: "Luxury shoe conditioning", price: 35000, unit: "pair" },
  "suit-2": { name: "Suit, 2-piece", price: 20000, unit: "set" },
  "suit-3": { name: "Suit, 3-piece", price: 25000, unit: "set" },
  "bedsheet-single": { name: "Bedsheet, single", price: 5000, unit: "piece" },
  "bedsheet-double": { name: "Bedsheet, double", price: 8000, unit: "piece" },
  "blanket-single": { name: "Blanket, single", price: 12000, unit: "piece" },
  "blanket-double": { name: "Blanket, double", price: 18000, unit: "piece" },
  "duvet-single": { name: "Duvet, single", price: 20000, unit: "piece" },
  "duvet-double": { name: "Duvet, double", price: 30000, unit: "piece" },
  "duvet-king": { name: "King duvet", price: 35000, unit: "piece" },
  curtains: { name: "Curtains", price: 10000, unit: "set" },
  carpet: { name: "Carpet cleaning", price: 8000, unit: "m²" },
  "student-plan": { name: "Student Plan", price: 50000, unit: "plan" },
  "couple-plan": { name: "Couple Plan", price: 100000, unit: "plan" },
  "family-plan": { name: "Family Plan", price: 150000, unit: "plan" },
  "business-plan": { name: "Business Plan", price: 0, unit: "plan" }
};
const addonPrices = { softener: 2000, perfume: 2000, packaging: 3000, express: 10000 };
let selectedPhotos = new WeakMap();

function calculateItemTotal(item) {
  const serviceId = item.querySelector('select[name="service"]').value;
  const service = priceBook[serviceId];
  const quantity = Math.max(1, Number(item.querySelector('input[name="quantity"]').value) || 1);
  const customPrice = Number(item.querySelector('input[name="customPrice"]').value) || 0;
  const total = serviceId === "business-plan" ? customPrice : service.unit === "kg"
    ? service.price + Math.max(0, quantity - service.included) * service.extra
    : service.price * quantity;
  item.querySelector("[data-item-total]").textContent = formatUGX(total);
  return total;
}

function calculateOrderTotal() {
  const form = document.getElementById("orderForm");
  let total = [...document.querySelectorAll("#orderItems .order-item")].reduce((sum, item) => sum + calculateItemTotal(item), 0);
  for (const addon of form.querySelectorAll('input[name="addons"]:checked')) {
    if (addon.value !== "delivery") total += addonPrices[addon.value];
  }
  if (form.querySelector('input[name="addons"][value="delivery"]:checked') && total <= 50000) total += 8000;
  document.getElementById("orderTotal").textContent = formatUGX(total);
  return total;
}

function updateServiceQuantity(item) {
  const serviceId = item.querySelector('select[name="service"]').value;
  const service = priceBook[serviceId];
  const isWeight = service.unit === "kg";
  const input = item.querySelector('input[name="quantity"]');
  item.querySelector(".quantity-caption").textContent = isWeight ? "Weight (kg)" : `Quantity (${service.unit})`;
  input.min = isWeight ? String(service.included) : "1";
  input.step = isWeight ? "0.5" : service.unit === "m²" ? "0.1" : "1";
  input.value = isWeight ? String(Math.max(service.included, Number(input.value) || service.included)) : "1";
  const isBusinessPlan = serviceId === "business-plan";
  item.querySelector(".custom-price-label").hidden = !isBusinessPlan;
  item.querySelector('input[name="customPrice"]').required = isBusinessPlan;
  item.querySelector(".quantity-label").hidden = isBusinessPlan;
  calculateOrderTotal();
}

function addOrderItem() {
  const item = document.getElementById("orderItemTemplate").content.firstElementChild.cloneNode(true);
  document.getElementById("orderItems").appendChild(item);
  updateOrderItemHeadings();
  updateServiceQuantity(item);
  return item;
}

function updateOrderItemHeadings() {
  const items = [...document.querySelectorAll("#orderItems .order-item")];
  items.forEach((item, index) => {
    item.querySelector(".order-item-heading strong").textContent = `Item ${index + 1}`;
    item.querySelector(".remove-order-item").hidden = items.length === 1;
  });
}

function resetOrderItems() {
  selectedPhotos = new WeakMap();
  document.getElementById("orderItems").innerHTML = "";
  addOrderItem();
  calculateOrderTotal();
}

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Image must be 12MB or smaller."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read the selected photo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not open the selected photo."));
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Photo preview is unavailable in this browser."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function renderNav() {
  const allowed = isManager() ? navItems : navItems.filter(([label]) => ["Dashboard", "Orders"].includes(label));
  document.getElementById("mainNav").innerHTML = allowed.map(([label, icon]) =>
    `<button class="nav-item ${state.page === label ? "active" : ""}" data-page="${label}"><span>${icon}</span><span>${label}</span></button>`
  ).join("");
  document.querySelectorAll(".nav-item").forEach(button => button.addEventListener("click", () => {
    state.page = button.dataset.page;
    document.querySelector(".sidebar").classList.remove("open");
    render();
  }));
}

function updateWorkerOptions() {
  const select = document.getElementById("assignedWorker");
  const selected = select.value;
  select.innerHTML = state.workers.map(worker =>
    `<option value="${escapeHtml(worker.name)}">${escapeHtml(worker.name)}</option>`
  ).join("");
  if (state.workers.some(worker => worker.name === selected)) select.value = selected;
  const signInSelect = document.getElementById("workerSignInSelect");
  signInSelect.innerHTML = state.workers.map(worker =>
    `<option value="${escapeHtml(worker.name)}">${escapeHtml(worker.name)}</option>`
  ).join("");
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatExactTime(iso) {
  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium", timeStyle: "medium"
  }).format(new Date(iso));
}

function arrivalRecord(workerName) {
  return state.attendance.find(record => record.worker === workerName && record.date === localDateKey());
}

function attendanceCard() {
  const record = arrivalRecord(state.currentWorker);
  if (!record) {
    return `<article class="panel attendance-clock"><h2>Welcome, ${escapeHtml(state.currentWorker)}</h2><p>Clock in to record your exact arrival time.</p><button class="primary-button" id="clockInButton">Clock in now</button></article>`;
  }
  const alertText = `FreshStep attendance: ${record.worker} reported at ${formatExactTime(record.arrivedAt)}.`;
  const encoded = encodeURIComponent(alertText);
  return `<article class="panel attendance-clock"><p class="eyebrow">Today’s arrival</p><h2>${escapeHtml(record.worker)}</h2><time>${escapeHtml(formatExactTime(record.arrivedAt))}</time>
    <p>Arrival saved on this device. Tap each link to open WhatsApp with a ready-to-send alert; WhatsApp still requires you to press Send.</p>
    <div class="arrival-alert"><a class="secondary-button" target="_blank" rel="noopener" href="https://wa.me/256702634159?text=${encoded}">Notify admin · BUKENYA JOEL</a><a class="secondary-button" target="_blank" rel="noopener" href="https://wa.me/971523275995?text=${encoded}">Notify owner · KYEYUNE CHARLES</a></div>
  </article>`;
}

function statCards() {
  if (!isManager()) {
    const assigned = state.orders.filter(order => order.assignedTo === state.currentWorker);
    const due = assigned.filter(order => order.status !== "Completed").length;
    return `<div class="stats-grid">${statCard("My assigned orders", String(assigned.length), "Read-only staff view", "▤")}${statCard("Due for action", String(due), "Ask a manager to update status", "◷")}</div>`;
  }
  const revenue = state.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const ready = state.orders.filter(order => order.status === "Ready").length;
  const unpaid = state.orders.filter(order => order.payment === "Unpaid").length;
  return `
    <div class="stats-grid">
      ${statCard("Order value", formatUGX(revenue), "From saved business orders", "UGX")}
      ${statCard("Orders", String(state.orders.length), "In this workspace", "▤")}
      ${statCard("Ready for pickup", String(ready), "Awaiting collection", "✓")}
      ${statCard("Unpaid orders", String(unpaid), "Check before handover", "♧")}
    </div>`;
}

function statCard(label, value, trend, icon) {
  return `<article class="stat-card"><div class="stat-card-head"><span>${label}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-trend">${trend}</div></article>`;
}

function dashboard() {
  if (!isManager()) {
    return `${attendanceCard()}${statCards()}<div class="role-notice">You may advance the status of your assigned orders. Only the owner or admin can edit other business records.</div>${ordersTable("My assigned orders")}`;
  }
  const bars = [48,72,58,82,66,94,78];
  const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return `
    ${statCards()}
    <div class="dashboard-grid">
      <article class="panel">
        <div class="section-heading"><h2>Revenue overview</h2><button>Sample trend</button></div>
        <div class="chart-area"><div class="chart-wrap">${bars.map((height,i)=>`<div class="bar-group"><div class="bar" style="height:${height}%"></div><span class="bar-label">${labels[i]}</span></div>`).join("")}</div></div>
      </article>
      <article class="panel">
        <div class="section-heading"><h2>Order status</h2><button>View all</button></div>
        <div class="status-list">
          ${statusRow("◷","Received","Awaiting processing",String(state.orders.filter(order => order.status === "Received").length))}
          ${statusRow("◉","In process","At the cleaners",String(state.orders.filter(order => order.status === "Processing").length))}
          ${statusRow("✓","Ready","Awaiting pickup",String(state.orders.filter(order => order.status === "Ready").length))}
          ${statusRow("▣","Completed","Collected",String(state.orders.filter(order => order.status === "Completed").length))}
        </div>
      </article>
    </div>
    ${ordersTable("Recent orders")}`;
}

function statusRow(icon,title,subtitle,count) {
  return `<div class="status-row"><span class="status-icon">${icon}</span><span><strong>${title}</strong><small>${subtitle}</small></span><span class="status-count">${count}</span></div>`;
}

function ordersTable(title) {
  const worker = !isManager();
  return `<article class="panel table-panel">
    <div class="table-toolbar"><h2 style="margin:0;font-size:16px">${title}</h2><input class="search-input" id="orderSearch" placeholder="Search orders..." /></div>
    <div class="table-wrap"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>SERVICE</th>${worker ? "" : "<th>AMOUNT</th><th>PAYMENT</th>"}<th>DUE</th><th>STATUS</th><th>ACTION</th></tr></thead>
    <tbody id="ordersBody">${orderRows()}</tbody></table></div>
  </article>`;
}

function orderServiceSummary(order) {
  if (!Array.isArray(order.items) || !order.items.length) return order.service || "Laundry service";
  return `${order.items.length} items · ${order.items.map(item => item.service).join(", ")}`;
}

function isOrderOverdue(order) {
  if (order.status === "Completed") return false;
  if (order.due === "Yesterday") return true;
  if (order.due === "Today" || order.due === "Tomorrow") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(order.due || "") && order.due < localDateKey();
}

function orderRows(query="") {
  const available = isManager() ? state.orders : state.orders.filter(order => order.assignedTo === state.currentWorker);
  const filtered = available.filter(order => [order.id, order.customer, orderServiceSummary(order), order.status, order.due].join(" ").toLowerCase().includes(query.toLowerCase()));
  return filtered.map(order => `<tr>
    <td><strong>${escapeHtml(order.id)}</strong></td><td>${escapeHtml(order.customer)}</td><td>${escapeHtml(orderServiceSummary(order))}</td>${isManager() ? `<td>${formatUGX(order.amount)}</td><td>${escapeHtml(order.payment || "Unpaid")}</td>` : ""}<td>${escapeHtml(order.due)}</td>
    <td><span class="badge ${order.status.toLowerCase().replace(/\s+/g,"-")}">${escapeHtml(order.status)}</span></td><td class="order-actions">
      <button class="table-action" data-details="${escapeHtml(order.id)}">Details</button>
      ${isManager() && Array.isArray(order.items) && order.items.length ? `<button class="table-action" data-edit-order="${escapeHtml(order.id)}">Edit</button>` : ""}
      ${(isManager() || order.assignedTo === state.currentWorker) && order.status !== "Completed" ? `<button class="table-action" data-advance="${escapeHtml(order.id)}">Next status</button>` : ""}
      ${(isManager() || order.assignedTo === state.currentWorker) && ["Ready","Out for delivery","Completed"].includes(order.status) ? `<button class="table-action" data-notify="${escapeHtml(order.id)}">Notify</button>` : ""}
      ${isManager() ? `<button class="table-action" data-receipt="${escapeHtml(order.id)}">Receipt</button>` : ""}
    </td>
  </tr>`).join("") || `<tr><td colspan="${isManager() ? 8 : 6}" class="empty-state">No orders found.</td></tr>`;
}

function servicesPage() {
  const groups = [
    ["Laundry packages", [["FreshStep Basic","5kg · Wash, dry and fold","UGX 15,000 · +UGX 2,500/kg"],["FreshStep Premium","5kg · Wash, dry, iron and fold","UGX 20,000 · +UGX 3,000/kg"],["FreshStep Executive","5kg · Premium detergent, fabric softener, premium fragrance, protective packaging and priority service","UGX 25,000 · +UGX 3,500/kg"]]],
    ["Individual garments", [["Shirt / blouse","","UGX 3,000"],["Polo / T-shirt","","UGX 2,500"],["Trouser / jeans","","UGX 4,000"],["Shorts","","UGX 2,500"],["Skirt","","UGX 3,000"],["Dress","","UGX 6,000"]]],
    ["Shoe care & clothing", [["Suit, 2-piece","","UGX 20,000"],["Suit, 3-piece","","UGX 25,000"],["Jacket","","UGX 8,000"],["Sweater","","UGX 5,000"],["Hoodie","","UGX 6,000"],["Tie","","UGX 2,000"],["Basic shoe cleaning","","UGX 10,000"],["Deep shoe cleaning","","UGX 15,000"],["Luxury shoe conditioning","","From UGX 35,000"]]],
    ["Home & bulky", [["Bedsheet, single","","UGX 5,000"],["Bedsheet, double","","UGX 8,000"],["Blanket, single","","UGX 12,000"],["Blanket, double","","UGX 18,000"],["Duvet, single","","UGX 20,000"],["Duvet, double","","UGX 30,000"],["King duvet","","UGX 35,000"],["Curtains","","UGX 10,000"],["Carpet cleaning","","UGX 8,000 per m²"]]],
    ["Extra services", [["Express service","6 hours","Add UGX 10,000"],["Fabric softener","","Add UGX 2,000"],["Premium perfume","","Add UGX 2,000"],["Protective packaging","","Add UGX 3,000"],["Pickup & delivery","Within 5km","UGX 8,000 · Free above UGX 50,000"]]]
  ];
  const sections = groups.map(([title,items]) => `<section class="service-group"><div class="section-heading"><h2>${title}</h2></div><div class="catalog-grid">${items.map(([name,detail,price])=>`<article class="service-card"><h3>${name}</h3>${detail ? `<p>${detail}</p>` : ""}<div class="service-price">${price}</div></article>`).join("")}</div></section>`).join("");
  return `${sections}<section class="service-group"><div class="section-heading"><h2>Memberships & rewards</h2></div><div class="catalog-grid">
    ${membershipCard("Student Plan","4 loads · up to 20kg/month","UGX 50,000")}
    ${membershipCard("Couple Plan","8 loads · up to 40kg/month","UGX 100,000")}
    ${membershipCard("Family Plan","12 loads · up to 60kg/month","UGX 150,000")}
    ${membershipCard("Business Plan","For offices, Airbnbs, guest houses, restaurants and clinics","Custom pricing")}
    <article class="service-card loyalty-card"><h3>FreshStep Rewards</h3><p>Wash 10 times and receive your 11th wash free.</p></article>
    </div><p class="delivery-note">Accepted payments: MTN MoMo, Airtel Money, Cash and Visa.</p></section>`;
}

function membershipCard(name,detail,price) {
  return `<article class="service-card"><h3>${name}</h3><p>${detail}</p><div class="service-price">${price}</div></article>`;
}

function inventoryPage() {
  const rows = state.inventory.map(item => {
    const low = Number(item.quantity) <= Number(item.reorderAt);
    return `<tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</td>
      <td><span class="badge ${low ? "overdue" : "ready"}">${low ? "Low stock" : "In stock"}</span><small class="inventory-reorder">Reorder at ${escapeHtml(item.reorderAt)} ${escapeHtml(item.unit)}</small></td>
      <td><button class="table-action" data-inventory-edit="${escapeHtml(item.id)}">Update stock</button></td>
    </tr>`;
  }).join("");
  return `<article class="panel table-panel">
    <div class="table-toolbar"><div><h2 style="margin:0 0 4px">Inventory</h2><p class="eyebrow">Saved on this device · low-stock alerts use reorder levels</p></div><button class="primary-button" id="inventoryAddButton">＋ Add item</button></div>
    <div class="table-wrap"><table><thead><tr><th>SUPPLY</th><th>ON HAND</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${rows || `<tr><td colspan="4" class="empty-state">No inventory items yet.</td></tr>`}</tbody></table></div>
  </article>`;
}

function openInventoryModal(itemId = "") {
  if (!isManager()) {
    showToast("Only the owner or admin can update inventory");
    return;
  }
  const item = itemId ? state.inventory.find(record => record.id === itemId) : null;
  if (itemId && !item) {
    showToast("That inventory item could not be found");
    return;
  }
  const form = document.getElementById("inventoryForm");
  form.reset();
  document.getElementById("inventoryItemId").value = item ? item.id : "";
  form.elements.name.value = item ? item.name : "";
  form.elements.quantity.value = item ? item.quantity : 0;
  form.elements.unit.value = item ? item.unit : "units";
  form.elements.reorderAt.value = item ? item.reorderAt : 5;
  document.getElementById("inventoryModalTitle").textContent = item ? "Update inventory" : "Add inventory item";
  const modal = document.getElementById("inventoryModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function genericPage(title) {
  if (!isManager()) return `<div class="role-notice">This section is limited to the business owner and admin.</div>`;
  if (title === "Memberships") {
    return `<section class="service-group"><div class="section-heading"><h2>Membership plans</h2></div><div class="catalog-grid">
      ${membershipCard("Student Plan","4 loads · up to 20kg/month","UGX 50,000")}
      ${membershipCard("Couple Plan","8 loads · up to 40kg/month","UGX 100,000")}
      ${membershipCard("Family Plan","12 loads · up to 60kg/month","UGX 150,000")}
      ${membershipCard("Business Plan","Offices, Airbnbs, guest houses, restaurants and clinics","Custom pricing")}
      <article class="service-card loyalty-card"><h3>FreshStep Rewards</h3><p>Wash 10 times and receive your 11th wash free.</p></article>
    </div></section>`;
  }
  if (title === "Customers") {
    const customers = [...new Map(state.orders.map(order => [order.phone || order.customer, order])).values()];
    return `<article class="panel table-panel"><div class="section-heading"><h2>Customers</h2><span class="eyebrow">${customers.length} saved records</span></div><div class="table-wrap"><table><thead><tr><th>NAME</th><th>PHONE</th><th>ORDERS</th><th>LATEST ORDER</th></tr></thead><tbody>${customers.map(customer=>`<tr><td>${escapeHtml(customer.customer)}</td><td>${escapeHtml(customer.phone || "—")}</td><td>${state.orders.filter(order=>order.phone && order.phone===customer.phone).length || 1}</td><td>${escapeHtml(customer.id)}</td></tr>`).join("")}</tbody></table></div></article>`;
  }
  if (title === "Members") {
    return `<article class="panel"><div class="team-toolbar"><div><h2 style="margin:0">Workers</h2><p class="eyebrow">Only owners and admins can manage the team</p></div><button class="primary-button" id="addWorkerButton">＋ Add worker</button></div><div class="table-wrap"><table><thead><tr><th>TEAM MEMBER</th><th>PHONE</th><th>ROLE</th><th>ACCESS</th><th>ACTION</th></tr></thead><tbody>
      ${state.workers.map(worker=>`<tr><td>${escapeHtml(worker.name)}</td><td>${escapeHtml(worker.phone)}</td><td>Worker</td><td>Assigned work · read-only</td><td><button class="table-action" data-deactivate-worker="${escapeHtml(worker.name)}">Deactivate</button></td></tr>`).join("")}
      <tr><td>${ownerName}</td><td>—</td><td>Owner</td><td>All business data and settings</td><td>Protected account</td></tr>
      <tr><td>${adminName}</td><td>—</td><td>Admin</td><td>All business data and settings</td><td>Protected account</td></tr>
    </tbody></table></div></article>`;
  }
  if (title === "Attendance") {
    const records = [...state.attendance].sort((a,b) => b.arrivedAt.localeCompare(a.arrivedAt));
    return `<article class="panel table-panel"><div class="section-heading"><h2>Staff attendance</h2><span class="eyebrow">Arrival times recorded on this device</span></div><div class="table-wrap"><table><thead><tr><th>WORKER</th><th>DATE</th><th>ARRIVAL TIME</th></tr></thead><tbody>${records.map(record=>`<tr><td>${escapeHtml(record.worker)}</td><td>${escapeHtml(record.date)}</td><td>${escapeHtml(formatExactTime(record.arrivedAt))}</td></tr>`).join("") || `<tr><td colspan="3" class="empty-state">No clock-ins recorded yet.</td></tr>`}</tbody></table></div></article>`;
  }
  if (title === "Inventory") {
    return inventoryPage();
  }
  if (title === "Reports") {
    const revenue = state.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const paid = state.orders.filter(order => order.payment && order.payment !== "Unpaid").reduce((sum, order) => sum + Number(order.amount || 0), 0);
    return `<div class="stats-grid">${statCard("Order value",formatUGX(revenue),"Saved orders","UGX")}${statCard("Recorded as paid",formatUGX(paid),"Payment method selected at intake","✓")}${statCard("Orders",String(state.orders.length),"All saved orders","▤")}</div><div class="role-notice">Figures reflect saved POS records. Connect financial statements and tax reporting before formal accounting use.</div>`;
  }
  if (title === "Settings") {
    return `<article class="panel"><h2>Business profile</h2><p>Namasuba, Entebbe Road, opposite Sip Lounge</p><p>0755 217 588 · 0795 311 913</p><p>Website: www.freshstep.ug</p><p>Payments: MTN MoMo, Airtel Money, Cash and Visa</p><p>Free pickup and delivery above UGX 50,000 within 5km.</p></article>`;
  }
  const descriptions = {
    Orders: ["All active and historical garment orders","Create order"]
  };
  const [description, action] = descriptions[title] || ["Manage this section", "Add New"];
  return `<article class="panel"><div class="table-toolbar"><div><h2 style="margin:0 0 4px">${title}</h2><p style="margin:0;color:var(--muted);font-size:12px">${description}</p></div><button class="primary-button" id="genericAction">${action}</button></div></article>${title === "Orders" ? ordersTable("Live orders") : ""}`;
}

function roleNotice() {
  return state.role === "worker" ? `<div class="role-notice">Worker view: only assigned orders are shown. You may update their status; ask the owner or admin for other changes.</div>` : "";
}

function render() {
  if (!isManager() && !["Dashboard", "Orders"].includes(state.page)) state.page = "Dashboard";
  renderNav();
  updateWorkerOptions();
  document.getElementById("newOrderButton").hidden = !isManager();
  document.getElementById("workerSignInButton").hidden = true;
  document.getElementById("workerSignOutButton").hidden = isManager();
  document.getElementById("pageTitle").textContent =
    state.page === "Dashboard"
      ? (state.role === "owner" ? `Good morning, ${ownerName}` : state.role === "admin" ? `Admin dashboard` : state.role === "worker" ? `Worker dashboard` : "FreshStep POS")
      : state.page;
  document.getElementById("content").innerHTML =
    state.page === "Dashboard" ? dashboard() :
    state.page === "Services" ? servicesPage() :
    state.page === "Orders" ? genericPage("Orders") :
    genericPage(state.page);

  const search = document.getElementById("orderSearch");
  if (search) search.addEventListener("input", event => document.getElementById("ordersBody").innerHTML = orderRows(event.target.value));
  const action = document.getElementById("genericAction");
  if (action) action.addEventListener("click", () => {
    if (!isManager()) {
      showToast("Only the owner or an admin can make changes");
      return;
    }
    if (state.page === "Orders") openOrderModal();
    else showToast("This section is a preview and is not connected yet");
  });
  document.querySelectorAll("[data-advance]").forEach(button => button.addEventListener("click", () => {
    advanceOrder(button.dataset.advance);
  }));
  document.querySelectorAll("[data-details]").forEach(button => button.addEventListener("click", () => openOrderDetails(button.dataset.details)));
  document.querySelectorAll("[data-edit-order]").forEach(button => button.addEventListener("click", () => openOrderModal(button.dataset.editOrder)));
  document.querySelectorAll("[data-notify]").forEach(button => button.addEventListener("click", () => notifyCustomer(button.dataset.notify)));
  document.querySelectorAll("[data-receipt]").forEach(button => button.addEventListener("click", () => openReceipt(button.dataset.receipt)));
  const orderPageNew = document.getElementById("orderPageNew");
  if (orderPageNew) orderPageNew.addEventListener("click", () => openOrderModal());
  const addWorkerButton = document.getElementById("addWorkerButton");
  if (addWorkerButton) addWorkerButton.addEventListener("click", openWorkerModal);
  const inventoryAddButton = document.getElementById("inventoryAddButton");
  if (inventoryAddButton) inventoryAddButton.addEventListener("click", () => openInventoryModal());
  document.querySelectorAll("[data-inventory-edit]").forEach(button => button.addEventListener("click", () => openInventoryModal(button.dataset.inventoryEdit)));
  document.querySelectorAll("[data-deactivate-worker]").forEach(button => button.addEventListener("click", async () => {
    if (!window.confirm(`Deactivate ${button.dataset.deactivateWorker}?`)) return;
    try {
      await apiRequest(`/api/workers/${encodeURIComponent(button.dataset.deactivateWorker)}`, { method: "DELETE", body: "{}" });
      state.workers = state.workers.filter(worker => worker.name !== button.dataset.deactivateWorker);
      saveWorkers();
      render();
      showToast(`${button.dataset.deactivateWorker} deactivated`);
    } catch (error) {
      showToast(error.message);
    }
  }));
  const clockInButton = document.getElementById("clockInButton");
  if (clockInButton) clockInButton.addEventListener("click", () => clockIn(state.currentWorker));
}

function advanceOrder(orderId) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order) return;
  if (!isManager() && (state.role !== "worker" || order.assignedTo !== state.currentWorker)) {
    showToast("You can only update orders assigned to you");
    return;
  }
  const transitions = {
    Received: "Processing",
    Processing: "Ready",
    Ready: Array.isArray(order.addons) && order.addons.includes("delivery") ? "Out for delivery" : "Completed",
    "Out for delivery": "Completed"
  };
  const next = transitions[order.status];
  if (!next) return;
  const previous = order.status;
  order.status = next;
  if (!saveOrders()) {
    order.status = previous;
    return;
  }
  syncOrderWithServer(order, "PUT");
  render();
  showToast(`${order.id} moved to ${next}`);
}

function notifyCustomer(orderId) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order || (!isManager() && order.assignedTo !== state.currentWorker)) {
    showToast("You can only notify customers for orders assigned to you");
    return;
  }
  const number = String(order.phone || "").replace(/\D/g, "").replace(/^0/, "256");
  if (!number) {
    showToast("Add a customer phone number before sending a notification");
    return;
  }
  let update = "has been completed";
  if (order.status === "Ready") update = "is ready for pickup or delivery";
  if (order.status === "Out for delivery") update = "is out for delivery";
  const message = `Hello ${order.customer}, your FreshStep order ${order.id} ${update}. Thank you for choosing FreshStep Laundry, Garment & Shoe Care — Cleaning Made Effortless!`;
  apiRequest(`/api/notifications/order/${encodeURIComponent(order.id)}`, { method: "POST", body: "{}" })
    .then(result => {
      if (result.whatsapp?.enabled && result.whatsapp.ok !== false) {
        showToast("Customer WhatsApp notification sent");
      } else {
        const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        window.open(link, "_blank", "noopener,noreferrer");
        showToast("Automatic sending is not configured. WhatsApp opened for manual Send.");
      }
    })
    .catch(() => {
      const link = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      window.open(link, "_blank", "noopener,noreferrer");
      showToast("WhatsApp opened with a ready-to-send message.");
    });
}

function openReceipt(orderId) {
  if (!isManager()) {
    showToast("Only the owner or admin can print receipts");
    return;
  }
  const order = state.orders.find(item => item.id === orderId);
  if (!order) return;
  state.activeReceiptOrderId = order.id;
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : [{ service: order.service, quantity: order.quantity || 1, unit: "item", amount: order.amount, color: "", description: "", care: [] }];
  const created = order.createdAt ? formatExactTime(order.createdAt) : formatExactTime(new Date().toISOString());
  const addons = (order.addons || []).map(addon => ({
    softener: "Fabric softener", perfume: "Premium perfume", packaging: "Protective packaging",
    express: "Express service", delivery: "Pickup & delivery"
  }[addon] || addon));
  document.getElementById("receiptContent").innerHTML = `
    <header class="receipt-brand">
      <img src="freshstep-logo.jpg" alt="FreshStep logo" />
      <h2>FRESHSTEP LAUNDRY, GARMENT & SHOE CARE</h2>
      <p>Cleaning Made Effortless</p>
      <p>Namasuba, Entebbe Road · Opposite Sip Lounge</p>
      <p>0755 217 588 · 0795 311 913 · www.freshstep.ug</p>
    </header>
    <div class="receipt-meta"><strong>Receipt</strong><strong>${escapeHtml(order.id)}</strong></div>
    <div class="receipt-meta"><span>Customer</span><span>${escapeHtml(order.customer)}</span></div>
    <div class="receipt-meta"><span>Phone</span><span>${escapeHtml(order.phone || "—")}</span></div>
    <div class="receipt-meta"><span>Date</span><span>${escapeHtml(created)}</span></div>
    <div class="receipt-lines">${items.map(item => `<div class="receipt-line"><strong>${escapeHtml(item.service)}</strong><span>${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "item")} · ${formatUGX(item.amount || 0)}</span>${item.color ? `<small>Color: ${escapeHtml(item.color)}</small>` : ""}${item.description ? `<small>${escapeHtml(item.description)}</small>` : ""}${item.care?.length ? `<small>Care: ${escapeHtml(item.care.join(", "))}</small>` : ""}</div>`).join("")}</div>
    ${addons.length ? `<p>Extras: ${escapeHtml(addons.join(", "))}</p>` : ""}
    ${order.notes ? `<p>Order notes: ${escapeHtml(order.notes)}</p>` : ""}
    <div class="receipt-meta"><span>Payment</span><span>${escapeHtml(order.payment || "Unpaid")}</span></div>
    <div class="receipt-total"><span>Total</span><strong>${formatUGX(order.amount)}</strong></div>
    <div class="receipt-thanks"><strong>Thank you for choosing FreshStep!</strong><p>We appreciate your trust in FreshStep Laundry, Garment & Shoe Care.</p><p>Warm regards,<br />The FreshStep Team</p><p>Cleaning Made Effortless!</p><small>All garments are professionally inspected, tagged and handled with care. Terms apply.</small></div>`;
  const receiptModal = document.getElementById("receiptModal");
  receiptModal.classList.add("open");
  receiptModal.setAttribute("aria-hidden", "false");
}

function shareReceiptOnWhatsApp(orderId) {
  if (!isManager()) {
    showToast("Only the owner or admin can share receipts");
    return;
  }
  const order = state.orders.find(item => item.id === orderId);
  if (!order) {
    showToast("This receipt is no longer available");
    return;
  }
  const number = String(order.phone || "").replace(/\D/g, "").replace(/^0/, "256");
  if (!number) {
    showToast("Add a customer phone number before sharing this receipt");
    return;
  }
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : [{ service: order.service || "Laundry service", quantity: order.quantity || 1, unit: "item", amount: order.amount }];
  const lines = items.map(item =>
    `• ${item.service} — ${item.quantity} ${item.unit || "item"}: ${formatUGX(item.amount || 0)}`
  );
  const extras = Array.isArray(order.addons) && order.addons.length
    ? `\nExtras: ${order.addons.join(", ")}`
    : "";
  const message = [
    "FRESHSTEP LAUNDRY, GARMENT & SHOE CARE",
    "Cleaning Made Effortless!",
    `Receipt: ${order.id}`,
    `Customer: ${order.customer}`,
    `Phone: ${order.phone}`,
    ...lines,
    extras,
    `Payment: ${order.payment || "Unpaid"}`,
    `TOTAL: ${formatUGX(order.amount)}`,
    "",
    "Thank you for choosing FreshStep!",
    "Warm regards, The FreshStep Team"
  ].filter(Boolean).join("\n");
  apiRequest(`/api/notifications/receipt/${encodeURIComponent(order.id)}`, { method: "POST", body: "{}" })
    .then(result => {
      if (result.whatsapp?.enabled && result.whatsapp.ok !== false) {
        showToast("Receipt sent to the customer on WhatsApp");
      } else {
        window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        showToast("Automatic sending is not configured. WhatsApp opened for manual Send.");
      }
    })
    .catch(() => {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      showToast("WhatsApp opened with the text receipt. Press Send.");
    });
}

function openOrderDetails(orderId) {
  const order = state.orders.find(item => item.id === orderId);
  if (!order || (!isManager() && order.assignedTo !== state.currentWorker)) {
    showToast("You can only view orders assigned to you");
    return;
  }
  const items = Array.isArray(order.items) ? order.items : [];
  document.getElementById("orderDetailsTitle").textContent = `${order.id} · ${order.status}`;
  document.getElementById("orderDetailsContent").innerHTML = items.length ? items.map((item, index) => {
    const photo = typeof item.photo === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(item.photo)
      ? item.photo
      : "";
    return `
    <article class="order-detail-item">
      <h3>Item ${index + 1}: ${escapeHtml(item.service)}</h3>
      <p>Quantity: ${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "item")}</p>
      ${item.color ? `<p>Color: ${escapeHtml(item.color)}</p>` : ""}
      ${item.description ? `<p>Description: ${escapeHtml(item.description)}</p>` : ""}
      ${item.care?.length ? `<p>Requested care: ${escapeHtml(item.care.join(", "))}</p>` : ""}
      ${photo ? `<img class="garment-photo" src="${photo}" alt="Condition photo for ${escapeHtml(item.service)}" />` : `<p class="delivery-note">No condition photo attached.</p>`}
    </article>`;
  }).join("") : `<p class="delivery-note">This sample order does not have garment-level details.</p>`;
  const detailsModal = document.getElementById("orderDetailsModal");
  detailsModal.classList.add("open");
  detailsModal.setAttribute("aria-hidden", "false");
}

document.querySelectorAll("[data-close-details]").forEach(button => button.addEventListener("click", () => {
  const detailsModal = document.getElementById("orderDetailsModal");
  detailsModal.classList.remove("open");
  detailsModal.setAttribute("aria-hidden", "true");
}));

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}

function openWorkerModal() {
  if (!isManager()) {
    showToast("Only the owner or admin can add workers");
    return;
  }
  document.getElementById("workerModal").classList.add("open");
}

document.querySelectorAll("[data-close-worker-modal]").forEach(button => button.addEventListener("click", () => {
  document.getElementById("workerModal").classList.remove("open");
}));
document.querySelectorAll("[data-close-change-pin]").forEach(button => button.addEventListener("click", () => {
  const modal = document.getElementById("changePinModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}));
document.querySelectorAll("[data-close-inventory]").forEach(button => button.addEventListener("click", () => {
  const inventoryModal = document.getElementById("inventoryModal");
  inventoryModal.classList.remove("open");
  inventoryModal.setAttribute("aria-hidden", "true");
}));
document.querySelectorAll("[data-close-worker-sign-in]").forEach(button => button.addEventListener("click", () => {
  document.getElementById("workerSignInModal").classList.remove("open");
}));
document.getElementById("workerSignInButton").addEventListener("click", () => {
  if (!isManager()) return;
  updateWorkerOptions();
  document.getElementById("workerSignInModal").classList.add("open");
});
document.getElementById("workerForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!isManager()) {
    showToast("Only the owner or admin can add workers");
    return;
  }
  const data = new FormData(event.target);
  const name = data.get("name").trim();
  const phone = data.get("phone").trim();
  const pin = data.get("pin").trim();
  if (state.workers.some(worker => worker.name.toLowerCase() === name.toLowerCase())) {
    showToast("A worker with that name already exists");
    return;
  }
  state.workers.push({ name, phone });
  if (!saveWorkers()) {
    state.workers.pop();
    return;
  }
  apiRequest("/api/workers", {
    method: "POST",
    body: JSON.stringify({ name, phone, pin })
  }).catch(error => showToast(error.message));
  event.target.reset();
  document.getElementById("workerModal").classList.remove("open");
  updateWorkerOptions();
  render();
  showToast(`${name} added as a worker`);
});

document.getElementById("inventoryForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!isManager()) {
    showToast("Only the owner or admin can update inventory");
    return;
  }
  const form = event.target;
  const id = document.getElementById("inventoryItemId").value;
  const name = form.elements.name.value.trim();
  const unit = form.elements.unit.value.trim();
  const quantity = Number(form.elements.quantity.value);
  const reorderAt = Number(form.elements.reorderAt.value);
  if (!name || !unit || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(reorderAt) || reorderAt < 0) {
    showToast("Enter a valid name, quantity, unit and reorder level");
    return;
  }
  if (state.inventory.some(item => item.name.toLowerCase() === name.toLowerCase() && item.id !== id)) {
    showToast("An inventory item with that name already exists");
    return;
  }
  const updated = { id: id || `stock-${Date.now()}`, name, quantity, unit, reorderAt };
  const index = state.inventory.findIndex(item => item.id === id);
  const previous = index >= 0 ? state.inventory[index] : null;
  if (index >= 0) state.inventory[index] = updated;
  else state.inventory.push(updated);
  if (!saveInventory()) {
    if (previous) state.inventory[index] = previous;
    else state.inventory.pop();
    return;
  }
  apiRequest("/api/inventory", {
    method: "POST",
    body: JSON.stringify(updated)
  }).catch(error => showToast(error.message));
  const modal = document.getElementById("inventoryModal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  render();
  showToast(`${name} inventory saved`);
});

function clockIn(workerName) {
  const worker = state.workers.find(item => item.name === workerName);
  if (!worker) {
    showToast("Choose a worker registered by the owner or admin");
    return false;
  }
  const today = localDateKey();
  let record = arrivalRecord(workerName);
  if (!record) {
    record = { worker: workerName, date: today, arrivedAt: new Date().toISOString() };
    state.attendance.unshift(record);
    if (!saveAttendance()) {
      state.attendance.shift();
      return false;
    }
  }
  apiRequest("/api/attendance", { method: "POST", body: "{}" })
    .then(result => {
      if (result.whatsapp && result.whatsapp.enabled) showToast("Arrival sent to configured WhatsApp recipients");
    })
    .catch(error => console.warn("Server attendance sync failed.", error));
  state.currentWorker = workerName;
  state.role = "worker";
  state.page = "Dashboard";
  document.getElementById("workerSignInModal").classList.remove("open");
  document.getElementById("profileName").textContent = worker.name;
  document.getElementById("profileRole").textContent = "Worker";
  document.querySelector(".avatar").textContent = worker.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2);
  render();
  showToast(`${worker.name} signed in at ${formatExactTime(record.arrivedAt)}`);
  return true;
}

document.getElementById("workerSignInForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!isManager()) return;
  const workerName = new FormData(event.target).get("workerName");
  clockIn(workerName);
});
document.getElementById("workerSignInSelect").addEventListener("change", () => updateWorkerOptions());

document.getElementById("todayDate").textContent = new Intl.DateTimeFormat("en-UG",{weekday:"long",month:"long",day:"numeric"}).format(new Date());
document.getElementById("mobileMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));

const modal = document.getElementById("orderModal");
function openOrderModal(orderId = "") {
  if (!isManager()) {
    showToast("Only the owner or an admin can create an order");
    return;
  }
  const order = orderId ? state.orders.find(item => item.id === orderId) : null;
  if (orderId && (!order || !Array.isArray(order.items) || !order.items.length)) {
    showToast("This sample order does not contain editable item details");
    return;
  }
  const form = document.getElementById("orderForm");
  state.editingOrderId = order ? order.id : null;
  form.reset();
  resetOrderItems();
  const due = new Date();
  due.setDate(due.getDate() + 2);
  const localDueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
  form.elements.due.value = localDueDate;
  updateWorkerOptions();
  if (order) {
    document.getElementById("orderModalTitle").textContent = `Edit order ${order.id}`;
    document.getElementById("submitOrderButton").textContent = "Save changes";
    form.elements.customer.value = order.customer || "";
    form.elements.phone.value = order.phone || "";
    form.elements.due.value = /^\d{4}-\d{2}-\d{2}$/.test(order.due || "") ? order.due : localDueDate;
    form.elements.payment.value = order.payment || "Unpaid";
    if (state.workers.some(worker => worker.name === order.assignedTo)) form.elements.assignedTo.value = order.assignedTo;
    form.elements.notes.value = order.notes || "";
    form.querySelectorAll('input[name="addons"]').forEach(input => {
      input.checked = Array.isArray(order.addons) && order.addons.includes(input.value);
    });
    document.getElementById("orderItems").innerHTML = "";
    order.items.forEach(savedItem => {
      const item = addOrderItem();
      const serviceId = priceBook[savedItem.serviceId] ? savedItem.serviceId : "basic";
      item.querySelector('select[name="service"]').value = serviceId;
      updateServiceQuantity(item);
      item.querySelector('input[name="quantity"]').value = savedItem.quantity;
      item.querySelector('input[name="color"]').value = savedItem.color || "";
      item.querySelector('input[name="description"]').value = savedItem.description || "";
      item.querySelectorAll('input[name="care"]').forEach(input => {
        input.checked = Array.isArray(savedItem.care) && savedItem.care.includes(input.value);
      });
      if (serviceId === "business-plan") {
        item.querySelector('input[name="customPrice"]').value = savedItem.customPrice || savedItem.amount || "";
      }
      if (typeof savedItem.photo === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(savedItem.photo)) {
        selectedPhotos.set(item, savedItem.photo);
        item.querySelector(".photo-preview img").src = savedItem.photo;
        item.querySelector(".photo-preview").hidden = false;
      }
    });
    updateOrderItemHeadings();
    calculateOrderTotal();
  } else {
    document.getElementById("orderModalTitle").textContent = "Create new order";
    document.getElementById("submitOrderButton").textContent = "Create order";
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}
document.getElementById("newOrderButton").addEventListener("click", () => openOrderModal());
function closeOrderModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.getElementById("orderForm").reset();
  resetOrderItems();
  state.editingOrderId = null;
  document.getElementById("orderModalTitle").textContent = "Create new order";
  document.getElementById("submitOrderButton").textContent = "Create order";
}
document.querySelectorAll("[data-close-modal]").forEach(button=>button.addEventListener("click",closeOrderModal));
document.getElementById("addOrderItem").addEventListener("click",addOrderItem);
document.getElementById("orderItems").addEventListener("click", event => {
  const removeItem = event.target.closest(".remove-order-item");
  const removePhoto = event.target.closest(".remove-photo");
  if (removeItem) {
    removeItem.closest(".order-item").remove();
    updateOrderItemHeadings();
    calculateOrderTotal();
  }
  if (removePhoto) {
    const item = removePhoto.closest(".order-item");
    selectedPhotos.delete(item);
    item.querySelector(".photo-preview").hidden = true;
    item.querySelector(".photo-preview img").removeAttribute("src");
    item.querySelector('input[type="file"]').value = "";
  }
});
document.getElementById("orderItems").addEventListener("change", event => {
  const item = event.target.closest(".order-item");
  if (!item) return;
  if (event.target.name === "service") updateServiceQuantity(item);
  if (event.target.matches('input[type="file"]') && event.target.files[0]) {
    const file = event.target.files[0];
    compressPhoto(file).then(dataUrl => {
      selectedPhotos.set(item, dataUrl);
      item.querySelector(".photo-preview img").src = dataUrl;
      item.querySelector(".photo-preview").hidden = false;
    }).catch(error => {
      console.warn("Could not attach the garment photo.", error);
      showToast(error.message);
      event.target.value = "";
    });
  }
  calculateOrderTotal();
});
document.getElementById("orderForm").addEventListener("input", event => {
  if (event.target.closest(".order-item") || event.target.name === "addons") calculateOrderTotal();
});
document.getElementById("orderForm").addEventListener("change", calculateOrderTotal);
document.getElementById("orderForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!isManager()) {
    showToast("Only the owner or an admin can create an order");
    return;
  }
  const data = new FormData(event.target);
  const lineItems = [...document.querySelectorAll("#orderItems .order-item")].map(item => {
    const serviceId = item.querySelector('select[name="service"]').value;
    const service = priceBook[serviceId];
    return {
      service: service.name,
      serviceId,
      quantity: Number(item.querySelector('input[name="quantity"]').value) || 1,
      unit: service.unit,
      amount: calculateItemTotal(item),
      customPrice: Number(item.querySelector('input[name="customPrice"]').value) || 0,
      color: item.querySelector('input[name="color"]').value.trim(),
      description: item.querySelector('input[name="description"]').value.trim(),
      care: [...item.querySelectorAll('input[name="care"]:checked')].map(input => input.value),
      photo: selectedPhotos.get(item) || null
    };
  });
  const addons = data.getAll("addons");
  const amount = calculateOrderTotal();
  if (lineItems.some(item => item.serviceId === "business-plan" && item.customPrice < 1)) {
    showToast("Enter the agreed Business Plan quote first");
    return;
  }
  const existingIndex = state.orders.findIndex(order => order.id === state.editingOrderId);
  const previous = existingIndex >= 0 ? state.orders[existingIndex] : null;
  if (state.editingOrderId && !previous) {
    showToast("This order could not be found");
    return;
  }
  const maxId = previous ? null : state.orders.reduce((max, order) => Math.max(max, Number(String(order.id).replace(/\D/g,"")) || 0), 1048);
  const order = {
    id: previous ? previous.id : `FS-${maxId + 1}`,
    customer: data.get("customer").trim(),
    phone: data.get("phone").trim(),
    service: lineItems.map(item => item.service).join(", "),
    items: lineItems,
    amount,
    status: previous ? previous.status : "Received",
    due: data.get("due"),
    payment: data.get("payment"),
    assignedTo: data.get("assignedTo"),
    addons,
    notes: data.get("notes").trim(),
    createdAt: previous ? previous.createdAt : new Date().toISOString()
  };
  if (previous) state.orders[existingIndex] = order;
  else state.orders.unshift(order);
  if (!saveOrders()) {
    if (previous) state.orders[existingIndex] = previous;
    else state.orders.shift();
    return;
  }
  syncOrderWithServer(order, "POST");
  closeOrderModal();
  state.page = "Orders";
  render();
  showToast(`${order.id} ${previous ? "updated" : "created"} · ${formatUGX(order.amount)}`);
});

document.querySelectorAll("[data-close-receipt]").forEach(button => button.addEventListener("click", () => {
  const receiptModal = document.getElementById("receiptModal");
  receiptModal.classList.remove("open");
  receiptModal.setAttribute("aria-hidden", "true");
}));
document.getElementById("printReceipt").addEventListener("click", () => window.print());
document.getElementById("shareReceiptWhatsApp").addEventListener("click", () => {
  shareReceiptOnWhatsApp(state.activeReceiptOrderId);
});

const bot = document.getElementById("freshbotPanel");
document.getElementById("supportFreshbot").addEventListener("click",()=>{bot.classList.add("open");bot.setAttribute("aria-hidden","false");});
document.getElementById("closeBot").addEventListener("click",()=>bot.classList.remove("open"));
function sendBotMessage(text) {
  if (!text.trim()) return;
  const messages = document.getElementById("botMessages");
  messages.insertAdjacentHTML("beforeend",`<div class="user-message">${escapeHtml(text)}</div>`);
  setTimeout(()=> {
    let answer = "I’m FreshBot. Ask about sales, orders, or inventory.";
    if (/sales|revenue/i.test(text)) {
      answer = isManager()
        ? `Saved order value: ${formatUGX(state.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0))} across ${state.orders.length} orders.`
        : "Sales and revenue are only visible to the owner and admin.";
    }
    if (/overdue|order/i.test(text)) {
      const orders = isManager() ? state.orders : state.orders.filter(order => order.assignedTo === state.currentWorker);
      const overdue = orders.filter(isOrderOverdue);
      answer = overdue.length
        ? `${overdue.length} overdue order${overdue.length === 1 ? "" : "s"}: ${overdue.map(order => order.id).join(", ")}.`
        : "There are no overdue orders in your visible order list.";
    }
    if (/inventory|stock/i.test(text)) {
      if (!isManager()) answer = "Inventory access is limited to the owner and admin.";
      else {
        const lowStock = state.inventory.filter(item => Number(item.quantity) <= Number(item.reorderAt));
        answer = lowStock.length
          ? `Low stock: ${lowStock.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(", ")}.`
          : "All saved inventory items are above their reorder levels.";
      }
    }
    messages.insertAdjacentHTML("beforeend",`<div class="bot-message">${escapeHtml(answer)}</div>`);
    messages.scrollTop = messages.scrollHeight;
  },350);
}
document.getElementById("botForm").addEventListener("submit",event=>{event.preventDefault();const input=document.getElementById("botInput");sendBotMessage(input.value);input.value="";});
document.querySelectorAll("[data-prompt]").forEach(button=>button.addEventListener("click",()=>sendBotMessage(button.dataset.prompt)));

async function apiRequest(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The server request failed");
  return data;
}

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  try {
    const result = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ name: data.get("name"), pin: data.get("pin") })
    });
    applyServerSession(result.user);
  } catch (error) {
    showToast(error.message);
  }
});

function applyServerSession(user) {
  if (!user) return;
  document.getElementById("appShell").hidden = false;
  state.role = user.role;
  state.currentWorker = user.role === "worker" ? user.name : state.currentWorker;
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileRole").textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.querySelector(".avatar").textContent = user.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2);
  document.getElementById("loginModal").classList.remove("open");
  document.getElementById("loginModal").setAttribute("aria-hidden", "true");
  hydrateServerData();
  render();
  showToast(`Signed in as ${user.name}`);
}

async function restoreServerSession() {
  try {
    const result = await apiRequest("/api/session");
    if (result.authenticated) {
      applyServerSession(result.user);
      return;
    }
  } catch (error) {
    console.warn("Could not restore server session.", error);
  }
  document.getElementById("appShell").hidden = true;
  state.role = "";
  const loginModal = document.getElementById("loginModal");
  loginModal.classList.add("open");
  loginModal.setAttribute("aria-hidden", "false");
  render();
}

async function hydrateServerData() {
  try {
    const orders = await apiRequest("/api/orders");
    state.orders = orders.orders.map(order => ({
      ...order,
      assignedTo: order.assigned_to,
      createdAt: order.created_at,
      items: order.items,
      addons: order.addons
    }));
    saveOrders();
  } catch (error) {
    console.warn("Could not hydrate server orders.", error);
  }
  try {
    const attendance = await apiRequest("/api/attendance");
    state.attendance = attendance.attendance.map(record => ({
      worker: record.worker,
      date: record.date,
      arrivedAt: record.arrived_at
    }));
    saveAttendance();
  } catch (error) {
    console.warn("Could not hydrate server attendance.", error);
  }
  if (isManager()) {
    try {
      const [workers, inventory] = await Promise.all([apiRequest("/api/workers"), apiRequest("/api/inventory")]);
      state.workers = workers.workers.map(worker => ({ name: worker.name, phone: worker.phone || "" }));
      state.inventory = inventory.inventory;
      saveWorkers();
      saveInventory();
      const loginSelect = document.querySelector('#loginForm [name="name"]');
      const managerOptions = [
        ["KYEYUNE CHARLES", "Owner"],
        ["BUKENYA JOEL", "Admin"]
      ];
      loginSelect.innerHTML = [
        ...managerOptions.map(([name, role]) => `<option value="${escapeHtml(name)}">${escapeHtml(name)} · ${role}</option>`),
        ...workers.workers.filter(worker => worker.active !== 0).map(worker => `<option value="${escapeHtml(worker.name)}">${escapeHtml(worker.name)} · Worker</option>`)
      ].join("");
    } catch (error) {
      console.warn("Could not hydrate server team or inventory.", error);
    }
  }
  render();
}

async function syncOrderWithServer(order, method = "POST") {
  try {
    await apiRequest(method === "POST" ? "/api/orders" : `/api/orders/${encodeURIComponent(order.id)}`, {
      method,
      body: JSON.stringify(method === "POST" ? order : { status: order.status })
    });
  } catch (error) {
    console.warn("Server order sync failed.", error);
  }
}

document.getElementById("workerSignOutButton").addEventListener("click", async () => {
  try {
    await apiRequest("/api/logout", { method: "POST", body: "{}" });
  } catch (error) {
    console.warn("Server logout failed.", error);
  }
  state.role = "";
  restoreServerSession();
});

document.getElementById("changePinForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const newPin = data.get("newPin").trim();
  const confirmPin = data.get("confirmPin").trim();
  if (newPin !== confirmPin) {
    showToast("New PIN entries do not match");
    return;
  }
  try {
    await apiRequest("/api/change-pin", {
      method: "POST",
      body: JSON.stringify({ currentPin: data.get("currentPin").trim(), newPin })
    });
    event.target.reset();
    document.getElementById("changePinModal").classList.remove("open");
    showToast("PIN changed successfully");
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById("profileButton").addEventListener("click", () => {
  if (!state.role) return;
  document.getElementById("changePinModal").classList.add("open");
  document.getElementById("changePinModal").setAttribute("aria-hidden", "false");
});

restoreServerSession();
