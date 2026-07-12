/* =============================================================
   نَدى (Nada) — Netlify Function: append each order to a Google Sheet.
   Auth: a Google service account (credentials stay server-side only).
   This endpoint is called fire-and-forget from script.js AFTER the
   WhatsApp handoff — a failure here must NEVER block or delay the order.
   ============================================================= */
const { google } = require("googleapis");

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const HEADER = ["timestamp", "customer_name", "phone", "address", "quantity", "total_qar"];

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
  const auth = new google.auth.JWT(email, null, key, ["https://www.googleapis.com/auth/spreadsheets"]);
  return google.sheets({ version: "v4", auth });
}

async function ensureTabAndHeader(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId });
  const exists = (meta.data.sheets || []).some(function (s) {
    return s.properties && s.properties.title === SHEET_TAB;
  });
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: SHEET_TAB + "!A1:F1",
    valueInputOption: "RAW",
    requestBody: { values: [HEADER] },
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

  const row = [new Date().toISOString(), name, phone, address, qty, total];

  try {
    const sheets = getSheetsClient();
    try {
      // Fast path: the tab already exists — one API call.
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: SHEET_TAB + "!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] },
      });
    } catch (appendErr) {
      // Likely first run: the tab/header doesn't exist yet. Create it once, then retry.
      await ensureTabAndHeader(sheets, spreadsheetId);
      await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: SHEET_TAB + "!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] },
      });
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error("[نَدى] Google Sheets append failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "sheets_error" });
  }
};
