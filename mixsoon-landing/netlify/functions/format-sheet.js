/* =============================================================
   mixsoon Qatar — Netlify Function: style the orders Google Sheet.
   One-time / idempotent (same tool as the نَدى project, ported to the
   mixsoon column layout + olive brand, and DEPENDENCY-FREE so it works
   without npm installs). Applies the brand design and turns the
   "confirmed" / "delivered" columns into clickable checkboxes with
   color-coded rows (amber = confirmed, green = delivered).
   Safe to re-run: clears its own banding + conditional rules first.
   Trigger once:  curl -X POST https://<site>/.netlify/functions/format-sheet
   ============================================================= */
const crypto = require("crypto");

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const HEADER = ["timestamp", "customer_name", "phone", "package", "sets", "total_qar", "address", "confirmed", "delivered"];
const COLS = HEADER.length;      // 9 (A..I); confirmed = H (7), delivered = I (8)
const LAST_ROW = 2000;           // format ahead so future orders inherit the design

/* --- brand palette (0..1 floats) --- */
const OLIVE = { red: 0.4353, green: 0.4784, blue: 0.2471 }; // #6f7a3f
const WHITE = { red: 1, green: 1, blue: 1 };
const BAND2 = { red: 0.9686, green: 0.9490, blue: 0.9176 }; // #f7f2ea cream tint
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
function b64url(input) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY env vars");
  const key = rawKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(header + "." + claims);
  const signature = signer.sign(key).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
          "&assertion=" + encodeURIComponent(header + "." + claims + "." + signature),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error("token_error: " + (data.error_description || data.error || res.status));
  return data.access_token;
}

async function sheetsFetch(token, path, opts) {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + path, {
    method: (opts && opts.method) || "GET",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error("sheets_" + res.status + ": " + JSON.stringify(data.error && data.error.message || data).slice(0, 300));
  return data;
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

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  try {
    const token = await getAccessToken();

    /* find (or create) the Orders tab; collect what we previously added */
    let meta = await sheetsFetch(token, spreadsheetId + "?fields=" + encodeURIComponent("sheets(properties(sheetId,title),bandedRanges(bandedRangeId),conditionalFormats)"));
    let sheet = (meta.sheets || []).find(function (s) { return s.properties && s.properties.title === SHEET_TAB; });
    if (!sheet) {
      await sheetsFetch(token, spreadsheetId + ":batchUpdate", {
        method: "POST",
        body: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
      });
      meta = await sheetsFetch(token, spreadsheetId + "?fields=" + encodeURIComponent("sheets(properties(sheetId,title),bandedRanges(bandedRangeId),conditionalFormats)"));
      sheet = (meta.sheets || []).find(function (s) { return s.properties && s.properties.title === SHEET_TAB; });
    }
    const sheetId = sheet.properties.sheetId;
    const existingBandings = (sheet.bandedRanges || []).map(function (b) { return b.bandedRangeId; });
    const existingCondCount = (sheet.conditionalFormats || []).length;

    /* 1) (re)write the header row */
    await sheetsFetch(token, spreadsheetId + "/values/" + encodeURIComponent(SHEET_TAB + "!A1:I1") + "?valueInputOption=RAW", {
      method: "PUT",
      body: { values: [HEADER] },
    });

    const requests = [];

    /* 2) grid size, frozen header, olive tab color */
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: sheetId, gridProperties: { rowCount: LAST_ROW, frozenRowCount: 1 }, tabColor: OLIVE },
        fields: "gridProperties(rowCount,frozenRowCount),tabColor",
      },
    });

    /* 3) idempotency: clear our previous banding + conditional rules */
    existingBandings.forEach(function (id) { requests.push({ deleteBanding: { bandedRangeId: id } }); });
    for (let i = 0; i < existingCondCount; i++) {
      requests.push({ deleteConditionalFormatRule: { sheetId: sheetId, index: 0 } });
    }

    /* 4) header: olive, bold white, centered, taller */
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: COLS },
        cell: {
          userEnteredFormat: {
            backgroundColor: OLIVE,
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 11, foregroundColor: WHITE },
          },
        },
        fields: "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)",
      },
    });
    requests.push({
      updateDimensionProperties: {
        range: { sheetId: sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 44 },
        fields: "pixelSize",
      },
    });

    /* 5) column widths (A..I) */
    requests.push(col(0, 1, sheetId, 180)); // timestamp
    requests.push(col(1, 2, sheetId, 170)); // customer_name
    requests.push(col(2, 3, sheetId, 140)); // phone
    requests.push(col(3, 4, sheetId, 210)); // package
    requests.push(col(4, 5, sheetId, 70));  // sets
    requests.push(col(5, 6, sheetId, 120)); // total_qar
    requests.push(col(6, 7, sheetId, 300)); // address
    requests.push(col(7, 8, sheetId, 110)); // confirmed
    requests.push(col(8, 9, sheetId, 110)); // delivered

    /* 6) cream zebra banding on data rows */
    requests.push({
      addBanding: {
        bandedRange: {
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 0, endColumnIndex: COLS },
          rowProperties: { firstBandColor: WHITE, secondBandColor: BAND2 },
        },
      },
    });

    /* 7) center sets */
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 4, endColumnIndex: 5 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });

    /* 8) total_qar: bold, centered, "1,234 QAR" */
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

    /* 9) center the checkbox columns */
    requests.push({
      repeatCell: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 7, endColumnIndex: 9 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });

    /* 10) checkbox validation on confirmed (H) + delivered (I) */
    requests.push({
      setDataValidation: {
        range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 7, endColumnIndex: 9 },
        rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
      },
    });

    /* 11) row highlight — delivered (green) wins over confirmed (amber) */
    const rowRange = { sheetId: sheetId, startRowIndex: 1, endRowIndex: LAST_ROW, startColumnIndex: 0, endColumnIndex: COLS };
    requests.push({
      addConditionalFormatRule: {
        index: 0,
        rule: {
          ranges: [rowRange],
          booleanRule: {
            condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$I2=TRUE" }] },
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
            condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$H2=TRUE" }] },
            format: { backgroundColor: AMBER },
          },
        },
      },
    });

    const result = await sheetsFetch(token, spreadsheetId + ":batchUpdate", {
      method: "POST",
      body: { requests: requests },
    });

    return json(200, { ok: true, sheetId: sheetId, applied: requests.length });
  } catch (err) {
    console.error("[mixsoon] Sheets format failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "format_error", detail: err && err.message ? err.message : String(err) });
  }
};
