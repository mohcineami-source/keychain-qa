/* =============================================================
   نَدى (Nada) — Netlify Function: append each order to a Google Sheet.
   Auth: a Google service account (credentials stay server-side only).
   This endpoint is called fire-and-forget from script.js AFTER the
   WhatsApp handoff — a failure here must NEVER block or delay the order.
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

// Cached across warm invocations — the numeric sheetId never changes.
let cachedSheetId = null;

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
  // Netlify env vars store the key as one line with literal "\n" — restore real newlines.
  const key = rawKey.replace(/\\n/g, "\n");
  // Object-style constructor — the old positional-args JWT(email, null, key, scopes) form
  // silently fails to attach credentials on current googleapis/google-auth-library versions,
  // producing "Method doesn't allow unregistered callers" instead of a clear auth error.
  const auth = new google.auth.JWT({
    email: email,
    key: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: auth });
}

async function findSheetId(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });
  const sheet = (meta.data.sheets || []).find(function (s) {
    return s.properties && s.properties.title === SHEET_TAB;
  });
  return sheet ? sheet.properties.sheetId : null;
}

async function ensureTabAndHeader(sheets, spreadsheetId) {
  let sheetId = await findSheetId(sheets, spreadsheetId);
  if (sheetId === null) {
    const created = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
    });
    sheetId = created.data.replies[0].addSheet.properties.sheetId;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: SHEET_TAB + "!A1:H1",
    valueInputOption: "RAW",
    requestBody: { values: [HEADER] },
  });
  return sheetId;
}

function cell(value) {
  if (typeof value === "number") return { userEnteredValue: { numberValue: value } };
  if (typeof value === "boolean") return { userEnteredValue: { boolValue: value } };
  return { userEnteredValue: { stringValue: String(value) } };
}

/* Insert the order as a NEW ROW 2, directly under the header, so the newest
   lead is always the first thing you see. This also avoids values.append,
   whose table detection could place rows far below the real data (it counts
   the validation/banding we apply down the sheet as part of the table).
   insertDimension + updateCells go in ONE batchUpdate so a partial failure
   can never leave an empty row behind. inheritFromBefore:false makes the new
   row copy the data row below it (checkbox validation, banding) instead of
   the header's styling. */
async function insertOrderRow(sheets, spreadsheetId, sheetId, row) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId,
    requestBody: {
      requests: [
        {
          insertDimension: {
            range: { sheetId: sheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 },
            inheritFromBefore: false,
          },
        },
        {
          updateCells: {
            start: { sheetId: sheetId, rowIndex: 1, columnIndex: 0 },
            rows: [{ values: row.map(cell) }],
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const name = String(data.name || "").trim().slice(0, 200);
  const phone = String(data.phone || "").trim().slice(0, 30);
  const address = String(data.address || "").trim().slice(0, 500);
  const qty = Math.max(1, Math.min(50, Number(data.qty) || 1));
  const total = Math.max(0, Number(data.total) || 0);

  if (!name || !phone || !address) return json(400, { ok: false, error: "missing_fields" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  // confirmed + delivered start unchecked so the new row renders its checkboxes.
  const row = [new Date().toISOString(), name, phone, address, qty, total, false, false];

  try {
    const sheets = getSheetsClient();
    try {
      if (cachedSheetId === null) cachedSheetId = await findSheetId(sheets, spreadsheetId);
      if (cachedSheetId === null) throw new Error("tab_missing");
      await insertOrderRow(sheets, spreadsheetId, cachedSheetId, row);
    } catch (firstErr) {
      // Tab missing/renamed, or a stale cached id. Rebuild it once, then retry.
      cachedSheetId = await ensureTabAndHeader(sheets, spreadsheetId);
      await insertOrderRow(sheets, spreadsheetId, cachedSheetId, row);
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error("[نَدى] Google Sheets append failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "sheets_error" });
  }
};
