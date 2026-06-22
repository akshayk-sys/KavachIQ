// ════════════════════════════════════════════════════════════════
// KavachIQ — Google Sheets Form Integration
// ════════════════════════════════════════════════════════════════
// HOW TO DEPLOY:
//  1. Open https://script.google.com (sign in with your Google account)
//  2. Create a new project → paste this entire file as Code.gs
//  3. Click "Deploy" → "New deployment" → Type: Web App
//  4. Set "Execute as": Me
//  5. Set "Who has access": Anyone
//  6. Click "Deploy" and COPY the Web App URL
//  7. Paste that URL into script.js where GOOGLE_SCRIPT_URL is defined
// ════════════════════════════════════════════════════════════════

const SPREADSHEET_NAME = "KavachIQ Leads";

const SHEETS = {
  contact:  "Contact Enquiries",
  booking:  "Booking Requests",
  popup:    "Free Report Requests"
};

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create(SPREADSHEET_NAME);
}

function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1a3a2a");
    headerRange.setFontColor("#39ff88");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function setCorsHeaders(output) {
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}

function doOptions(e) {
  return setCorsHeaders(
    ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT)
  );
}

function doGet(e) {
  const params = e.parameter;
  const formType = params.formType || "contact";
  const ts = new Date().toISOString();

  if (formType === "contact") {
    handleContact({ timestamp: ts, name: params.name || "", email: params.email || "",
      service: params.service || "", message: params.message || "", source: params.source || "GET test" });
  } else if (formType === "booking") {
    handleBooking({ timestamp: ts, bookingService: params.bookingService || "",
      bookingDate: params.bookingDate || "", bookingTime: params.bookingTime || "",
      bookingPhone: params.bookingPhone || "", source: params.source || "GET test" });
  } else if (formType === "popup") {
    handlePopup({ timestamp: ts, website: params.website || "",
      email: params.email || "", source: params.source || "GET test" });
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Row inserted via GET" }))
      .setMimeType(ContentService.MimeType.JSON)
  );
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid JSON" }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }

  data.timestamp = data.timestamp || new Date().toISOString();

  try {
    switch (data.formType) {
      case "contact":  handleContact(data);  break;
      case "booking":  handleBooking(data);  break;
      case "popup":    handlePopup(data);    break;
      default:         handleContact(data);  break;
    }
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ status: "ok", message: "Data saved successfully" }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

function handleContact(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEETS.contact, [
    "Timestamp", "Name", "Email", "Interested Service", "Message / Website", "Source"
  ]);
  sheet.appendRow([ data.timestamp, data.name || "", data.email || "",
    data.service || "", data.message || "", data.source || "website" ]);
}

function handleBooking(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEETS.booking, [
    "Timestamp", "Service", "Preferred Date", "Preferred Time", "Phone / WhatsApp", "Source"
  ]);
  sheet.appendRow([ data.timestamp, data.bookingService || "", data.bookingDate || "",
    data.bookingTime || "", data.bookingPhone || "", data.source || "website" ]);
}

function handlePopup(data) {
  const ss = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEETS.popup, [
    "Timestamp", "Website URL", "Email", "Source"
  ]);
  sheet.appendRow([ data.timestamp, data.website || "", data.email || "", data.source || "popup" ]);
}

// ── Run this manually from the Apps Script editor to test ────────
function testAllSheets() {
  handleContact({
    timestamp: new Date().toISOString(),
    name:      "Rahul Sharma",
    email:     "rahul@testbusiness.in",
    service:   "Website Security Health Check",
    message:   "https://testbusiness.in — please check for vulnerabilities",
    source:    "manual-test"
  });

  handleBooking({
    timestamp:      new Date().toISOString(),
    bookingService: "KavachIQ Protection Plan",
    bookingDate:    "2026-07-01",
    bookingTime:    "10:00 AM - 11:00 AM",
    bookingPhone:   "+91 98765 43210",
    source:         "manual-test"
  });

  handlePopup({
    timestamp: new Date().toISOString(),
    website:   "https://mybizkolkata.com",
    email:     "owner@mybizkolkata.com",
    source:    "manual-test"
  });

  Logger.log("testAllSheets complete — check the KavachIQ Leads spreadsheet in Google Drive.");
}
