/* =============================================================
   mixsoon Qatar — Netlify Function: style + repair the orders Google Sheet.
   Idempotent, POST-only, dependency-free.

   ⚠ CRITICAL LESSON (2026-07-19): applying BOOLEAN data validation to a big
   empty range (rows 2..2000) WRITES `FALSE` into every one of those cells.
   Google's values.append then treats row 2000 as the last used row and appends
   new orders at row 2001 — invisible below a wall of blank-looking rows. Two
   real customer orders were buried this way.
   So: validation is applied ONLY to rows that actually contain an order, and
   this function also COMPACTS the sheet (deletes empty rows above the last
   order) to repair a sheet that already got into that state.

   Trigger:  curl -X POST https://<site>/.netlify/functions/format-sheet
   ============================================================= */
const crypto = require("crypto");

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const HEADER = ["timestamp", "customer_name", "phone", "package", "sets", "total_qar", "address", "confirmed", "delivered"];
const COLS = HEADER.length;      // A..I ; confirmed = H (idx 7), delivered = I (idx 8)
const GRID_ROWS = 2000;          // visual grid size (empty rows are fine — they hold no values)

const OLIVE = { red: 0.4353, green: 0.4784, blue: 0.2471 }; // #6f7a3f
const WHITE = { red: 1, green: 1, blue: 1 };
const BAND2 = { red: 0.9686, green: 0.9490, blue: 0.9176 };
const AMBER = { red: 0.9882, green: 0.9059, blue: 0.7765 };
const GREEN = { red: 0.8471, green: 0.9412, blue: 0.8667 };

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
    iat: now, exp: now + 3600,
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

async function api(token, path, opts) {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + path, {
    method: (opts && opts.method) || "GET",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error("sheets_" + res.status + ": " + JSON.stringify((data.error && data.error.message) || data).slice(0, 300));
  return data;
}
const col = (a, b, sheetId, px) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: "COLUMNS", startIndex: a, endIndex: b },
    properties: { pixelSize: px }, fields: "pixelSize",
  },
});

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  try {
    const token = await getAccessToken();
    const metaFields = encodeURIComponent("sheets(properties(sheetId,title),bandedRanges(bandedRangeId),conditionalFormats)");

    let meta = await api(token, spreadsheetId + "?fields=" + metaFields);
    let sheet = (meta.sheets || []).find(s => s.properties && s.properties.title === SHEET_TAB);
    if (!sheet) {
      await api(token, spreadsheetId + ":batchUpdate", {
        method: "POST", body: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
      });
      meta = await api(token, spreadsheetId + "?fields=" + metaFields);
      sheet = (meta.sheets || []).find(s => s.properties && s.properties.title === SHEET_TAB);
    }
    const sheetId = sheet.properties.sheetId;

    /* ---------- 1) REPAIR: compact away empty rows sitting above real orders ---------- */
    const vals = await api(token, spreadsheetId + "/values/" + encodeURIComponent(SHEET_TAB + "!A1:I"));
    const rows = vals.values || [];
    const dataRows = [];                       // 1-based sheet row numbers that hold an order
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i] && rows[i][0] ? String(rows[i][0]).trim() : "";
      if (a) dataRows.push(i + 1);
    }
    const lastData = dataRows.length ? dataRows[dataRows.length - 1] : 1;
    const dataSet = new Set(dataRows);
    const gaps = [];                           // contiguous [start,end] empty ranges above the last order
    let run = null;
    for (let r = 2; r <= lastData; r++) {
      if (!dataSet.has(r)) { if (!run) run = [r, r]; else run[1] = r; }
      else if (run) { gaps.push(run); run = null; }
    }
    if (run) gaps.push(run);

    const deleteReqs = gaps.slice().reverse().map(([s, e]) => ({   // bottom-up so indices stay valid
      deleteDimension: { range: { sheetId, dimension: "ROWS", startIndex: s - 1, endIndex: e } },
    }));
    if (deleteReqs.length) {
      await api(token, spreadsheetId + ":batchUpdate", { method: "POST", body: { requests: deleteReqs } });
    }
    const orderCount = dataRows.length;
    const lastRowAfter = 1 + orderCount;       // data now occupies rows 2..lastRowAfter

    /* ---------- 2) header ---------- */
    await api(token, spreadsheetId + "/values/" + encodeURIComponent(SHEET_TAB + "!A1:I1") + "?valueInputOption=RAW", {
      method: "PUT", body: { values: [HEADER] },
    });

    /* ---------- 3) formatting (re-read meta: banding ids change after deletes) ---------- */
    meta = await api(token, spreadsheetId + "?fields=" + metaFields);
    sheet = (meta.sheets || []).find(s => s.properties && s.properties.title === SHEET_TAB);
    const requests = [];

    requests.push({
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { rowCount: GRID_ROWS, frozenRowCount: 1 }, tabColor: OLIVE },
        fields: "gridProperties(rowCount,frozenRowCount),tabColor",
      },
    });
    (sheet.bandedRanges || []).forEach(b => requests.push({ deleteBanding: { bandedRangeId: b.bandedRangeId } }));
    for (let i = 0; i < (sheet.conditionalFormats || []).length; i++) {
      requests.push({ deleteConditionalFormatRule: { sheetId, index: 0 } });
    }

    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: COLS },
        cell: { userEnteredFormat: {
          backgroundColor: OLIVE, horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE",
          textFormat: { bold: true, fontSize: 11, foregroundColor: WHITE },
        } },
        fields: "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)",
      },
    });
    requests.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 44 }, fields: "pixelSize",
      },
    });

    [[0,1,180],[1,2,170],[2,3,140],[3,4,210],[4,5,70],[5,6,120],[6,7,300],[7,8,110],[8,9,110]]
      .forEach(([a,b,px]) => requests.push(col(a,b,sheetId,px)));

    requests.push({
      addBanding: {
        bandedRange: {
          range: { sheetId, startRowIndex: 1, endRowIndex: GRID_ROWS, startColumnIndex: 0, endColumnIndex: COLS },
          rowProperties: { firstBandColor: WHITE, secondBandColor: BAND2 },
        },
      },
    });
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: GRID_ROWS, startColumnIndex: 4, endColumnIndex: 5 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: GRID_ROWS, startColumnIndex: 5, endColumnIndex: 6 },
        cell: { userEnteredFormat: {
          horizontalAlignment: "CENTER", textFormat: { bold: true },
          numberFormat: { type: "NUMBER", pattern: '#,##0" QAR"' },
        } },
        fields: "userEnteredFormat(horizontalAlignment,textFormat,numberFormat)",
      },
    });
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: GRID_ROWS, startColumnIndex: 7, endColumnIndex: 9 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    });

    /* checkbox validation: ONLY on rows that hold an order (never on empty rows —
       that is exactly what buried the orders). Also strip any stale validation below. */
    if (orderCount > 0) {
      requests.push({
        setDataValidation: {
          range: { sheetId, startRowIndex: 1, endRowIndex: lastRowAfter, startColumnIndex: 7, endColumnIndex: 9 },
          rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
        },
      });
    }
    requests.push({   // clear validation on every empty row below the data
      setDataValidation: {
        range: { sheetId, startRowIndex: lastRowAfter, endRowIndex: GRID_ROWS, startColumnIndex: 7, endColumnIndex: 9 },
      },
    });
    requests.push({   // and clear any FALSE values those rows may already hold
      updateCells: {
        range: { sheetId, startRowIndex: lastRowAfter, endRowIndex: GRID_ROWS, startColumnIndex: 7, endColumnIndex: 9 },
        fields: "userEnteredValue",
      },
    });

    const rowRange = { sheetId, startRowIndex: 1, endRowIndex: GRID_ROWS, startColumnIndex: 0, endColumnIndex: COLS };
    requests.push({ addConditionalFormatRule: { index: 0, rule: { ranges: [rowRange], booleanRule: {
      condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$I2=TRUE" }] }, format: { backgroundColor: GREEN } } } } });
    requests.push({ addConditionalFormatRule: { index: 1, rule: { ranges: [rowRange], booleanRule: {
      condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=$H2=TRUE" }] }, format: { backgroundColor: AMBER } } } } });

    await api(token, spreadsheetId + ":batchUpdate", { method: "POST", body: { requests } });

    return json(200, { ok: true, sheetId, orders: orderCount, emptyRowsRemoved: gaps.reduce((n,[s,e]) => n + (e - s + 1), 0) });
  } catch (err) {
    console.error("[mixsoon] format failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "format_error", detail: err && err.message ? err.message : String(err) });
  }
};
