// Google Apps Script Web App URL — set REACT_APP_SCRIPT_URL in .env
const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL || "";

async function apiFetch(action, sheet) {
  if (!SCRIPT_URL) return null;
  try {
    const url = `${SCRIPT_URL}?action=${action}${sheet ? `&sheet=${encodeURIComponent(sheet)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.error ? null : data;
  } catch (e) {
    console.warn("[Tansha API] fetch failed:", e.message);
    return null;
  }
}

async function apiPost(action, sheet, data, rowIndex) {
  if (!SCRIPT_URL) return null;
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action, sheet, data, rowIndex }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.warn("[Tansha API] post failed:", e.message);
    return null;
  }
}

// ─── Field mappers (sheet row → React state) ─────────────────

const mapTask = r => ({
  id: r.ID || r._rowIndex,
  _rowIndex: r._rowIndex,
  title: r.Title || "",
  to: r.Assignee || "",
  by: r.By || "",
  due: r.DueDate || "",
  pri: r.Priority || "Medium",
  status: r.Status || "Pending",
  type: r.Type || "Task",
  notes: r.Notes || "",
});

const taskRow = t => ({
  Title: t.title,
  Assignee: t.to || "",
  By: t.by || "",
  Priority: t.pri || "Medium",
  Status: t.status || "Pending",
  Type: t.type || "Task",
  DueDate: t.due || "",
  Notes: t.notes || "",
});

const mapDispatch = r => ({
  id: r.ID || r._rowIndex,
  _rowIndex: r._rowIndex,
  client: r.Client || "",
  qty: r.Qty !== "" && r.Qty != null ? Number(r.Qty) : null,
  unit: r.Unit || "Ctn",
  transport: r.Driver || "",
  lr: r.LR === "Yes" || r.LR === true,
  status: r.Status || "Pending",
  date: r.Date || "",
  location: r.Location || "Bhiwandi",
});

const dispatchRow = (d, loc) => ({
  Location: loc || d.location || "Bhiwandi",
  Client: d.client || "",
  Qty: d.qty != null ? d.qty : "",
  Unit: d.unit || "Ctn",
  Driver: d.transport || "",
  LR: d.lr ? "Yes" : "No",
  Status: d.status || "Pending",
  Date: d.date || new Date().toISOString().split("T")[0],
  Notes: d.notes || "",
});

const mapStock = r => ({
  id: r._rowIndex,
  _rowIndex: r._rowIndex,
  code: r.SKU || "",
  name: r.ProductName || "",
  category: r.Category || "Ocean",
  k2d: Number(r.K2Down) || 0,
  k1f: Number(r.K1) || 0,
  k2f: Number(r.K2_2nd) || 0,
  re: Number(r.MinLevel) || 30,
  cmrp: Number(r.CostPrice) || 0,
  mrp: Number(r.MRP) || 0,
});

const stockRow = s => ({
  SKU: s.code || "",
  ProductName: s.name || "",
  Category: s.category || "Ocean",
  K1: s.k1f || 0,
  K2Down: s.k2d || 0,
  K2_2nd: s.k2f || 0,
  MinLevel: s.re || 30,
  CostPrice: s.cmrp || 0,
  MRP: s.mrp || 0,
});

const mapPayment = r => ({
  id: r.ID || r._rowIndex,
  _rowIndex: r._rowIndex,
  client: r.Client || "",
  month: r.Month || "",
  totalBal: Number(r.Amount) || 0,
  currBal: r.Balance !== undefined && r.Balance !== "" ? Number(r.Balance) : Number(r.Amount) || 0,
  assignee: r.Assignee || "",
  followUpDate: r.DueDate || "",
  notes: r.Notes || "",
  status: r.Status || "Pending",
});

const paymentRow = p => ({
  Client: p.client || "",
  Month: p.month || "",
  Amount: p.totalBal || 0,
  Balance: p.currBal !== undefined ? p.currBal : (p.totalBal || 0),
  DueDate: p.followUpDate || "",
  Assignee: p.assignee || "",
  Status: p.status || "Pending",
  Notes: p.notes || "",
});

const mapSale = r => ({
  id: r.ID || r._rowIndex,
  _rowIndex: r._rowIndex,
  date: r.Date || "",
  client: r.Client || "",
  city: r.City || "",
  invNo: r.InvoiceNo || r.Invoice || "",
  amount: Number(r.Amount) || 0,
  team: r.Team || r.Category || "Ocean",
});

const saleRow = (s, team) => ({
  Team: team || s.team || "Ocean",
  Date: s.date || "",
  Client: s.client || "",
  City: s.city || "",
  InvoiceNo: s.invNo || "",
  Amount: s.amount || 0,
});

// ─── Public API ───────────────────────────────────────────────

export const api = {
  // Tasks
  getTasks: () => apiFetch("getAll", "Tasks").then(d => d?.map(mapTask) || null),
  addTask:    t          => apiPost("addRow",    "Tasks", taskRow(t)),
  updateTask: (ri, t)    => apiPost("updateRow", "Tasks", taskRow(t), ri),
  deleteTask: ri         => apiPost("deleteRow", "Tasks", null, ri),

  // Dispatch
  getDispatch: () => apiFetch("getAll", "Dispatch").then(d => d?.map(mapDispatch) || null),
  addDispatch:    (d, loc)   => apiPost("addRow",    "Dispatch", dispatchRow(d, loc)),
  updateDispatch: (ri, d)    => apiPost("updateRow", "Dispatch", dispatchRow(d), ri),

  // Stocks
  getStocks: () => apiFetch("getAll", "Stocks").then(d => d?.map(mapStock) || null),
  updateStock: (ri, s) => apiPost("updateRow", "Stocks", stockRow(s), ri),

  // Payments
  getPayments: () => apiFetch("getAll", "Payments").then(d => d?.map(mapPayment) || null),
  updatePayment: (ri, p) => apiPost("updateRow", "Payments", paymentRow(p), ri),

  // Sales
  getSales: () => apiFetch("getAll", "Sales").then(d => d?.map(mapSale) || null),
  addSale:    (s, team)      => apiPost("addRow",    "Sales", saleRow(s, team)),
  updateSale: (ri, s, team)  => apiPost("updateRow", "Sales", saleRow(s, team), ri),
  deleteSale: ri             => apiPost("deleteRow", "Sales", null, ri),

  // Dashboard
  getDashboard: () => apiFetch("getDashboard"),
};
