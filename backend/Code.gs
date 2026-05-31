// ============================================================
// TANSHA HOSPITALITY — Google Apps Script Backend
// Paste this in: Extensions > Apps Script > Code.gs
// Then click Deploy > New Deployment > Web App
// Set: Execute as = Me, Who has access = Anyone
// Copy the Web App URL and paste in the React app .env:
//   REACT_APP_SCRIPT_URL=<your-deployed-web-app-url>
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ─── CORS HELPER ─────────────────────────────────────────────
function setCORSHeaders(output) {
  return output
    .setHeader("Access-Control-Allow-Origin", "*")
    .setHeader("Access-Control-Allow-Methods", "GET, POST")
    .setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── MAIN ROUTER ─────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet;
  let result;

  try {
    switch (action) {
      case "getAll":       result = getAllRows(sheet); break;
      case "getDashboard": result = getDashboardData(); break;
      default:             result = { error: "Unknown action" };
    }
  } catch (err) {
    result = { error: err.message };
  }

  const output = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  return setCORSHeaders(output);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { action, sheet, data, rowIndex } = body;
  let result;

  try {
    switch (action) {
      case "addRow":    result = addRow(sheet, data); break;
      case "updateRow": result = updateRow(sheet, rowIndex, data); break;
      case "deleteRow": result = deleteRow(sheet, rowIndex); break;
      default:          result = { error: "Unknown action" };
    }
  } catch (err) {
    result = { error: err.message };
  }

  const output = ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
  return setCORSHeaders(output);
}

// ─── SHEET HELPERS ────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error("Sheet not found: " + name);
  return sheet;
}

function getAllRows(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map((row, i) => {
    const obj = { _rowIndex: i + 2 }; // 1-based, row 1 = header
    headers.forEach((h, j) => obj[h] = row[j]);
    return obj;
  });
}

function addRow(sheetName, data) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  const lastRow = sheet.getLastRow();
  if (headers.includes("ID")) row[headers.indexOf("ID")] = lastRow;
  if (headers.includes("CreatedAt")) row[headers.indexOf("CreatedAt")] = new Date().toLocaleString("en-IN");
  sheet.appendRow(row);
  return { success: true, message: "Row added" };
}

function updateRow(sheetName, rowIndex, data) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((h, j) => {
    if (data[h] !== undefined) sheet.getRange(rowIndex, j + 1).setValue(data[h]);
  });
  if (headers.includes("UpdatedAt")) {
    sheet.getRange(rowIndex, headers.indexOf("UpdatedAt") + 1).setValue(new Date().toLocaleString("en-IN"));
  }
  return { success: true, message: "Row updated" };
}

function deleteRow(sheetName, rowIndex) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowIndex);
  return { success: true, message: "Row deleted" };
}

// ─── DASHBOARD SUMMARY ────────────────────────────────────────
function getDashboardData() {
  const tasks    = getAllRows("Tasks");
  const dispatch = getAllRows("Dispatch");
  const payments = getAllRows("Payments");
  const stocks   = getAllRows("Stocks");

  const pendingTasks = tasks.filter(t => t.Status !== "Done").length;
  const overdueTasks = tasks.filter(t =>
    t.Status !== "Done" && t.DueDate && new Date(t.DueDate) < new Date()
  ).length;

  const todayDispatch = dispatch.filter(d => {
    const today = new Date().toLocaleDateString("en-IN");
    return d.Date === today;
  }).length;
  const inTransit = dispatch.filter(d => d.Status === "In Transit").length;

  const overdueAmt = payments
    .filter(p => p.Status === "Overdue")
    .reduce((sum, p) => sum + Number(p.Amount || 0), 0);
  const pendingAmt = payments
    .filter(p => p.Status === "Pending")
    .reduce((sum, p) => sum + Number(p.Balance || p.Amount || 0), 0);

  const lowStock = stocks.filter(s =>
    Number(s.K1 || 0) + Number(s.K2Down || 0) + Number(s.K2_2nd || 0) < 30
  ).length;

  return { pendingTasks, overdueTasks, todayDispatch, inTransit, overdueAmt, pendingAmt, lowStock };
}

// ─── NOTIFICATION TRIGGER (runs every 30 min via Time Trigger) ─
function checkAndNotify() {
  const tasks    = getAllRows("Tasks");
  const payments = getAllRows("Payments");
  const stocks   = getAllRows("Stocks");
  const notifLog = getSheet("NotifLog");
  const today    = new Date();

  tasks.filter(t => t.Status !== "Done" && t.DueDate && new Date(t.DueDate) < today).forEach(t => {
    logNotif(notifLog, "task", `Task Overdue: ${t.Title}`, t.Assignee);
  });
  payments.filter(p => p.Status === "Overdue").forEach(p => {
    logNotif(notifLog, "payment", `Payment Overdue: ${p.Client} – ₹${Number(p.Amount).toLocaleString("en-IN")}`, "Owner");
  });
  stocks.filter(s => Number(s.K1 || 0) + Number(s.K2Down || 0) + Number(s.K2_2nd || 0) < 30).forEach(s => {
    logNotif(notifLog, "stock", `Low Stock: ${s.ProductName}`, "Warehouse");
  });
}

function logNotif(sheet, type, message, assignee) {
  sheet.appendRow([new Date().toLocaleString("en-IN"), type, message, assignee, "unread"]);
}

// ─── SETUP FUNCTION — Run Once to Create All Sheets ──────────
function setupTanshaSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheets = {
    // Added: By, Type, Notes
    Tasks: ["ID", "Title", "Assignee", "By", "Priority", "Status", "Type", "DueDate", "Notes", "CreatedAt", "UpdatedAt"],

    // Added: Location, Unit, LR
    Dispatch: ["ID", "Date", "Location", "Client", "Items", "Qty", "Unit", "Driver", "LR", "Status", "Notes", "CreatedAt", "UpdatedAt"],

    // Added: CostPrice, MRP (for value calculations)
    Stocks: ["SKU", "ProductName", "Category", "K1", "K2Down", "K2_2nd", "MinLevel", "CostPrice", "MRP", "UpdatedAt"],

    // Added: Month, Balance (current outstanding), Assignee
    Payments: ["ID", "Client", "Month", "Invoice", "Amount", "Balance", "DueDate", "PaidDate", "Assignee", "Status", "Notes", "CreatedAt", "UpdatedAt"],

    // Added: Team, City, InvoiceNo
    Sales: ["ID", "Date", "Team", "Client", "City", "InvoiceNo", "Product", "Qty", "Rate", "Amount", "GST", "Total", "CreatedAt"],

    Quotations: ["ID", "Client", "Date", "Items", "Total", "Status", "Notes", "CreatedAt"],
    RouteSheet: ["ID", "Date", "Driver", "Stops", "Status", "Notes", "CreatedAt"],
    Operations: ["ID", "Date", "Type", "Description", "AssignedTo", "Status", "CreatedAt"],
    Team:       ["Name", "Role", "Phone", "Email", "Active"],
    NotifLog:   ["Timestamp", "Type", "Message", "Assignee", "Status"],
  };

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });

  const teamSheet = ss.getSheetByName("Team");
  if (teamSheet.getLastRow() === 1) {
    const team = [
      ["Saud Bhai",    "Manager",   "", "", "Yes"],
      ["Zaid Bhai",    "Sales",     "", "", "Yes"],
      ["Saeed Bhai",   "Sales",     "", "", "Yes"],
      ["Sufiyan Bhai", "Sales",     "", "", "Yes"],
      ["Asif Bhai",    "Sales",     "", "", "Yes"],
      ["Noor Bhai",    "Warehouse", "", "", "Yes"],
      ["Tayyab Bhai",  "Warehouse", "", "", "Yes"],
      ["Prakash Bhai", "Warehouse", "", "", "Yes"],
      ["Kaif Bhai",    "Warehouse", "", "", "Yes"],
      ["Jitu Bhai",    "Warehouse", "", "", "Yes"],
      ["Akash Bhai",   "Warehouse", "", "", "Yes"],
      ["Nafees Bhai",  "Warehouse", "", "", "Yes"],
      ["Faisal Bhai",  "Warehouse", "", "", "Yes"],
      ["Javed Bhai",   "Warehouse", "", "", "Yes"],
      ["Sabajit Bhai", "Warehouse", "", "", "Yes"],
      ["Ashfaq Bhai",  "Warehouse", "", "", "Yes"],
    ];
    team.forEach(row => teamSheet.appendRow(row));
  }

  SpreadsheetApp.getUi().alert("✅ Tansha sheets setup complete! All tabs created.");
}
