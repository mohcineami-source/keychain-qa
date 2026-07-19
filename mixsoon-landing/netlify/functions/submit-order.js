/* =============================================================
   mixsoon Qatar — Netlify Function: append each order to a Google Sheet.
   Same architecture as the نَدى (dryer) project, but DEPENDENCY-FREE
   (Node built-ins + fetch only) so it works with drag-and-drop deploys
   where npm packages are never installed.

   Auth: Google service account (credentials live ONLY in Netlify env vars).
   Called fire-and-forget from the page — a failure here must NEVER block
   or delay the WhatsApp handoff.

   Required env vars (Site settings → Environment variables):
     GOOGLE_SERVICE_ACCOUNT_EMAIL  e.g. xxx@project.iam.gserviceaccount.com
     GOOGLE_PRIVATE_KEY            one line, literal \n for newlines
     GOOGLE_SHEET_ID               the long id from the sheet URL
     GOOGLE_SHEET_TAB              optional, default "Orders"
   The sheet must be SHARED (Editor) with the service account email.
   ============================================================= */
const crypto = require("crypto");

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Orders";
const HEADER = ["timestamp", "customer_name", "phone", "package", "sets", "total_qar", "address", "confirmed", "delivered"];

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

/* --- mint a Google OAuth2 access token from the service account (RS256 JWT) --- */
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
  const assertion = header + "." + claims + "." + signature;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
          "&assertion=" + encodeURIComponent(assertion),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error("token_error: " + (data.error_description || data.error || res.status));
  }
  return data.access_token;
}

/* --- minimal Sheets API helpers over fetch --- */
async function sheetsFetch(token, path, opts) {
  const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + path, {
    method: (opts && opts.method) || "GET",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(function () { return {}; });
  return { ok: res.ok, status: res.status, data: data };
}

async function appendRow(token, spreadsheetId, row) {
  const range = encodeURIComponent(SHEET_TAB + "!A:I");
  return sheetsFetch(token, spreadsheetId + "/values/" + range + ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS", {
    method: "POST",
    body: { values: [row] },
  });
}

/* Give the newly appended row its confirmed/delivered checkboxes.
   NOTE: never pre-apply BOOLEAN validation to empty rows — it writes FALSE into
   them, which makes values.append skip past them and hides real orders. */
let _sheetIdCache = null;
async function addCheckboxesToRow(token, spreadsheetId, updatedRange) {
  const m = /!\w*?(\d+):/.exec(updatedRange || "");
  if (!m) return;
  const rowIndex = parseInt(m[1], 10) - 1; // 0-based
  if (!(rowIndex >= 1)) return;
  if (_sheetIdCache == null) {
    const meta = await sheetsFetch(token, spreadsheetId + "?fields=" + encodeURIComponent("sheets(properties(sheetId,title))"));
    const s = ((meta.data && meta.data.sheets) || []).find(function (x) {
      return x.properties && x.properties.title === SHEET_TAB;
    });
    if (!s) return;
    _sheetIdCache = s.properties.sheetId;
  }
  await sheetsFetch(token, spreadsheetId + ":batchUpdate", {
    method: "POST",
    body: { requests: [{ setDataValidation: {
      range: { sheetId: _sheetIdCache, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 7, endColumnIndex: 9 },
      rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
    } }] },
  });
}

async function ensureTabAndHeader(token, spreadsheetId) {
  const meta = await sheetsFetch(token, spreadsheetId + "?fields=sheets.properties.title");
  const exists = ((meta.data && meta.data.sheets) || []).some(function (s) {
    return s.properties && s.properties.title === SHEET_TAB;
  });
  if (!exists) {
    await sheetsFetch(token, spreadsheetId + ":batchUpdate", {
      method: "POST",
      body: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
    });
  }
  await sheetsFetch(token, spreadsheetId + "/values/" + encodeURIComponent(SHEET_TAB + "!A1:I1") + "?valueInputOption=RAW", {
    method: "PUT",
    body: { values: [HEADER] },
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  let data;
  try { data = JSON.parse(event.body || "{}"); }
  catch (e) { return json(400, { ok: false, error: "invalid_json" }); }

  const name = String(data.name || "").trim().slice(0, 200);
  const phone = String(data.phone || "").trim().slice(0, 30);
  const address = String(data.address || "").trim().slice(0, 500);
  const pack = String(data.package || "").trim().slice(0, 100);
  const sets = Math.max(1, Math.min(50, Number(data.sets) || 1));
  const total = Math.max(0, Number(data.total) || 0);
  if (!name || !phone || !address) return json(400, { ok: false, error: "missing_fields" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  const row = [new Date().toISOString(), name, phone, pack, sets, total, address, "", ""];

  try {
    const token = await getAccessToken();
    let res = await appendRow(token, spreadsheetId, row);
    if (!res.ok) {
      // Likely first run: tab/header missing. Create once, retry.
      await ensureTabAndHeader(token, spreadsheetId);
      res = await appendRow(token, spreadsheetId, row);
    }
    if (!res.ok) throw new Error("append_failed_" + res.status);
    /* best-effort: checkboxes on the new row. Must never fail the order. */
    try {
      await addCheckboxesToRow(token, spreadsheetId, res.data && res.data.updates && res.data.updates.updatedRange);
    } catch (e) {
      console.error("[mixsoon] checkbox decorate failed (order still saved):", e && e.message ? e.message : e);
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error("[mixsoon] Sheets append failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "sheets_error" });
  }
};
