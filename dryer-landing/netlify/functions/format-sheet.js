/* =============================================================
   نَدى (Nada) — Netlify Function: style the orders Google Sheet.
   One-time / idempotent. Applies a clean brand design and adds two
   clickable checkbox columns ("confirmed", "delivered") with
   color-coded rows. Safe to re-run: it clears its own banding +
   conditional-format rules before re-adding them.
   Trigger once with:  curl -X POST https://<site>/.netlify/functions/format-sheet
   ============================================================= */
const { google } = require("googleapis");

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const HEADER = [
  "timestamp",
  "customer_name",
  "phone",
  "address",
  "quantity",
  "total_qar",
  "confirmed",
  "delivered",
];
const LAST_ROW = 2000; // format this many rows so future orders inherit the design

// --- brand palette (0..1 floats) -----------------------------------------
const BRAND = { red: 0.7608, green: 0.3843, blue: 0.1804 }; // #C2622E terracotta
const WHITE = { red: 1, green: 1, blue: 1 };
const BAND2 = { red: 0.9647, green: 0.9333, blue: 0.9059 }; // #F6EEE7 warm tint
const AMBER = { red: 0.9882, green: 0.9059, blue: 0.7765 }; // #FCE7C6 confirmed
const GREEN = { red: 0.8471, green: 0.9412, blue: 0.8667 }; // #D8F0DD delivered

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}
function json(statusCode, body) {
  return { statusCode: statusCode, headers: corsHeaders(), body: JSON.stringify(body) };
}

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY env vars");
  }
  const key = rawKey.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: email,
    key: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: auth });
}

function col(startIndex, endIndex, sheetId, pixelSize) {
  return {
    updateDimensionProperties: {
      range: { sheetId: sheetId, dimension: "COLUMNS", startIndex: startIndex, endIndex: endIndex },
      properties: { pixelSize: pixelSize },
      fields: "pixelSize",
    },
  };
}

async function ensureTabExists(sheets, spreadsheetId, meta) {
  const found = (meta.data.sheets || []).find(function (s) {
    return s.properties && s.properties.title === SHEET_TAB;
  });
  if (found) return found;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
  });
  const meta2 = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
    fields: "sheets(properties(sheetId,title),bandedRanges(bandedRangeId),conditionalFormats)",
  });
  return (meta2.data.sheets || []).find(function (s) {
    return s.properties && s.properties.title === SHEET_TAB;
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  try {
    const sheets = getSheetsClient();

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: "sheets(properties(sheetId,title),bandedRanges(bandedRangeId),conditionalFormats)",
    });
    const sheet = await ensureTabExists(sheets, spreadsheetId, meta);
    const sheetId = sheet.properties.sheetId;
    const existingBandings = (sheet.bandedRanges || []).map(function (b) {
      return b.bandedRangeId;
    });
    const existingCondCount = (sheet.conditionalFormats || []).length;

    // 1) Write the full 8-column header (also upgrades the old 6-column header).
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: SHEET_TAB + "!A1:H1",
      valueInputOption: "RAW",
      requestBody: { values: [HEADER] },
    });

    const requests = [];

    // 2) Grid size, frozen header row, brand tab color.
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: { rowCount: LAST_ROW, frozenRowCount: 1 },
          tabColor: BRAND,
        },
        fields: "gridProperties(rowCount,frozenRowCount),tabColor",
      },
    });

    // 3) Clear anything we previously added so this stays idempotent.
    existingBandings.forEach(function (id) {
      requests.push({ deleteBanding: { bandedRangeId: id } });
    });
    for (let i = 0; i < existingCondCount; i++) {
      requests.push({ deleteConditionalFormatRule: { sheetId: sheetId, index: 0 } });
    }

    // 4) Header styling: brand background, bold white centered text.
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: {
          userEnteredFormat: {
            backgroundColor: BRAND,
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 11, foregroundColor: WHITE },
          },
        },
        fields: "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)",
      },
    });
    // Taller header row.
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 44 },
        fields: "pixelSize",
      },
    });

    // 5) Column widths.
    requests.push(col(0, 1, sheetId, 180)); // timestamp
    requests.push(col(1, 2, sheetId, 160)); // customer_name
    requests.push(col(2, 3, sheetId, 140)); // phone
    requests.push(col(3, 4, sheetId, 280)); // address
    requests.push(col(4, 5, sheetId, 90)); // quantity
    requests.push(col(5, 6, sheetId, 120)); // total_qar
    requests.push(col(6, 7, sheetId, 120)); // confirmed
    requests.push(col(7, 8, sheetId, 120)); // delivered

    // 6) Zebra banding on the data rows only (header keeps its brand style).
    requests.push({
      addBanding: {
        bandedRange: {
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 0, endColumnIndex: 8 },
          rowProperties: { firstBandColor: WHITE, secondBandColor: BAND2 },
        },
      },
    });

    // 7) Center quantity.
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 4, endColumnIndex: 5 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });
    // 8) total_qar: bold, centered, "1,234 QAR".
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 5, endColumnIndex: 6 },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            textFormat: { bold: true },
            numberFormat: { type: "NUMBER", pattern: '#,##0" QAR"' },
          },
        },
        fields: "userEnteredFormat(horizontalAlignment,textFormat,numberFormat)",
      },
    });
    // 9) Center the two checkbox columns.
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 6, endColumnIndex: 8 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });

    // 10) Checkbox ("button") validation on confirmed + delivered.
    requests.push({
      setDataValidation: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 6, endColumnIndex: 8 },
        rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
      },
    });

    // 11) Row highlight. First matching rule wins, so Delivered (green)
    //     is added before Confirmed (amber): a delivered+confirmed row shows green.
    const rowRange = { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 0, endColumnIndex: 8 };
    requests.push({
      addConditionalFormatRule: {
        index: 0,
        rule: {
          ranges: [rowRange],
          booleanRule: {
            condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$H2=TRUE" }] },
            format: { backgroundColor: GREEN },
          },
        },
      },
    });
    requests.push({
      addConditionalFormatRule: {
        index: 1,
        rule: {
          ranges: [rowRange],
          booleanRule: {
            condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$G2=TRUE" }] },
            format: { backgroundColor: AMBER },
          },
        },
      },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests: requests },
    });

    return json(200, { ok: true, sheetId: sheetId, applied: requests.length });
  } catch (err) {
    console.error("[نَدى] Google Sheets format failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "format_error", detail: err && err.message ? err.message : String(err) });
  }
};
