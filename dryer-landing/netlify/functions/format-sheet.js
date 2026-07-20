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
/* Everything below the header is bounded to the ACTUAL data rows.
   Original bug: applying checkbox validation down to a fixed row 2000 put a
   FALSE value in every one of those cells, which extended the sheet's data
   range to row 2000 — so values.append dropped new orders below row 2000.
   New orders are now inserted at row 2, and inserting inside these ranges
   makes Sheets grow them automatically, so they stay in sync with the data. */
const ROW_BUFFER = 100; // spare grid rows kept under the data */

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
      fields:
        "sheets(properties(sheetId,title,gridProperties(rowCount)),bandedRanges(bandedRangeId),conditionalFormats)",
    });
    const sheet = await ensureTabExists(sheets, spreadsheetId, meta);
    const sheetId = sheet.properties.sheetId;
    const gridRows =
      (sheet.properties.gridProperties && sheet.properties.gridProperties.rowCount) || 1000;

    /* Find the last row holding a REAL order. Columns A-F only: G/H are the
       checkbox columns and read back as FALSE even when nothing was ticked,
       so counting them would re-create the phantom-rows bug. */
    const valsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: SHEET_TAB + "!A1:F" + gridRows,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = valsRes.data.values || [];
    let lastDataRow = 1; // header only
    for (let i = 1; i < vals.length; i++) {
      const row = vals[i] || [];
      const has = row.some(function (c) {
        return String(c === null || c === undefined ? "" : c).trim() !== "";
      });
      if (has) lastDataRow = i + 1;
    }
    const hasData = lastDataRow >= 2;
    const endRow = lastDataRow; // exclusive 0-indexed end == 1-indexed last row
    const newRowCount = Math.max(lastDataRow + ROW_BUFFER, 200);
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

    // 2) Wipe every value below the real data — this is what clears the phantom
    //    FALSE checkbox cells that made the sheet look 2000 rows long.
    if (gridRows > lastDataRow) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: SHEET_TAB + "!A" + (lastDataRow + 1) + ":H" + gridRows,
      });
    }

    const requests = [];

    // 3) Frozen header row and brand tab color.
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 }, tabColor: BRAND },
        fields: "gridProperties.frozenRowCount,tabColor",
      },
    });

    // Drop any leftover checkbox validation below the data (a rule with no
    // condition removes it), so those cells stop reporting FALSE.
    requests.push({
      setDataValidation: {
        range: {
          sheetId: sheetId,
          startRowIndex: 1,
          endRowIndex: gridRows,
          startColumnIndex: 6,
          endColumnIndex: 8,
        },
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

    /* Everything below is scoped to the real data rows. New orders are inserted
       at row 2, i.e. INSIDE these ranges, so Sheets extends them automatically
       and the design keeps applying without ever pre-filling empty rows. */
    if (hasData) {
      // 6) Zebra banding on the data rows only (header keeps its brand style).
      requests.push({
        addBanding: {
          bandedRange: {
            range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 0, endColumnIndex: 8 },
            rowProperties: { firstBandColor: WHITE, secondBandColor: BAND2 },
          },
        },
      });

      // 7) Center quantity.
      requests.push({
        repeatCell: {
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 4, endColumnIndex: 5 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat.horizontalAlignment",
        },
      });
      // 8) total_qar: bold, centered, "1,234 QAR".
      requests.push({
        repeatCell: {
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 5, endColumnIndex: 6 },
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
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 6, endColumnIndex: 8 },
          cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
          fields: "userEnteredFormat.horizontalAlignment",
        },
      });

      // 10) Checkbox ("button") validation on confirmed + delivered.
      requests.push({
        setDataValidation: {
          range: { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 6, endColumnIndex: 8 },
          rule: { condition: { type: "BOOLEAN" }, strict: true, showCustomUi: true },
        },
      });

      // 11) Row highlight. First matching rule wins, so Delivered (green)
      //     is added before Confirmed (amber): a delivered+confirmed row shows green.
      const rowRange = { sheetId: sheetId, startRowIndex: 1, endRowIndex: endRow, startColumnIndex: 0, endColumnIndex: 8 };
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
    }

    // 12) Trim the grid so Ctrl+End lands just past the real data.
    requests.push({
      updateSheetProperties: {
        properties: { sheetId: sheetId, gridProperties: { rowCount: newRowCount } },
        fields: "gridProperties.rowCount",
      },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: { requests: requests },
    });

    return json(200, {
      ok: true,
      sheetId: sheetId,
      applied: requests.length,
      lastDataRow: lastDataRow,
      orderRows: Math.max(0, lastDataRow - 1),
      clearedBelowRow: lastDataRow,
      newRowCount: newRowCount,
    });
  } catch (err) {
    console.error("[نَدى] Google Sheets format failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "format_error", detail: err && err.message ? err.message : String(err) });
  }
};
