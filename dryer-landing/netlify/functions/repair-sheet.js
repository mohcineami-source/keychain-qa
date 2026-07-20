/* =============================================================
   نَدى (Nada) — Netlify Function: inspect / repair the orders sheet.

   Why this exists: spreadsheets.values.append picks its insert point from the
   detected "table" extent, which can include the data-validation + banding we
   applied down to row 2000 — so new orders could land in a gap far below the
   real data. This tool reports exactly where every order row physically sits,
   and (only when asked) rewrites them compactly, newest first.

   POST {"mode":"inspect"}  -> read-only report (default)
   POST {"mode":"apply"}    -> compact + reorder newest-first
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
  const auth = new google.auth.JWT({
    email: email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: auth });
}

function pad(row) {
  const out = (row || []).slice(0, 8);
  while (out.length < 8) out.push("");
  return out;
}
function isEmpty(row) {
  return pad(row).every(function (c) {
    return String(c === null || c === undefined ? "" : c).trim() === "";
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { ok: false, error: "invalid_json" });
  }
  const mode = body.mode === "apply" ? "apply" : "inspect";

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  try {
    const sheets = getSheetsClient();

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: SHEET_TAB + "!A1:H5000",
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "FORMATTED_STRING",
    });
    const rows = res.data.values || [];

    // Map every non-empty row below the header to its physical sheet row number.
    const found = [];
    for (let i = 1; i < rows.length; i++) {
      if (!isEmpty(rows[i])) found.push({ sheetRow: i + 1, values: pad(rows[i]) });
    }

    const report = {
      ok: true,
      mode: mode,
      totalRowsScanned: rows.length,
      orderRows: found.length,
      firstOrderAtRow: found.length ? found[0].sheetRow : null,
      lastOrderAtRow: found.length ? found[found.length - 1].sheetRow : null,
      // A gap means append landed past the formatted range instead of row 2.
      gapDetected: found.length ? found[0].sheetRow > 2 : false,
      rowNumbers: found.map(function (f) {
        return f.sheetRow;
      }),
      sample: found.map(function (f) {
        return f.values;
      }),
    };

    if (mode === "inspect") return json(200, report);

    // --- apply: newest first, compacted directly under the header ---
    // Optional narrow deletion: drop rows whose customer_name matches exactly.
    const dropName = typeof body.dropExactName === "string" ? body.dropExactName : null;
    const sorted = found
      .map(function (f) {
        return f.values;
      })
      .filter(function (r) {
        return dropName === null || String(r[1]) !== dropName;
      })
      .sort(function (a, b) {
        return String(b[0]).localeCompare(String(a[0])); // ISO timestamps: desc
      });

    // Clear the old block, then write the compacted one back.
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: SHEET_TAB + "!A2:H5000",
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: SHEET_TAB + "!A1:H1",
      valueInputOption: "RAW",
      requestBody: { values: [HEADER] },
    });
    if (sorted.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: SHEET_TAB + "!A2:H" + (sorted.length + 1),
        valueInputOption: "USER_ENTERED",
        requestBody: { values: sorted },
      });
    }

    report.repaired = true;
    report.rewrittenRows = sorted.length;
    return json(200, report);
  } catch (err) {
    console.error("[نَدى] repair-sheet failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "repair_error", detail: err && err.message ? err.message : String(err) });
  }
};
