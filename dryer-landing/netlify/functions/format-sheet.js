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
/* Spare rows kept below the data, fully styled (stripes + checkboxes) so the
   table looks ready for incoming orders instead of stopping at a blank void.
   Safe now that orders INSERT at row 2 — pre-styled rows can no longer affect
   where a new order lands, which was the whole original bug. */
const READY_ROWS = 50;

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

function r1(range) {
  // 0-indexed half-open API range -> readable 1-indexed inclusive rows.
  if (!range) return null;
  const start = (range.startRowIndex || 0) + 1;
  const end = range.endRowIndex || 0;
  return "rows " + start + "-" + end;
}

/* Structure-only report: proves the checkbox validation, banding and row
   highlighting actually cover the live data rows. Returns no cell contents. */
async function inspect(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
    ranges: [SHEET_TAB + "!G2:H2"],
    includeGridData: true,
    fields:
      "sheets(properties(sheetId,title,gridProperties(rowCount)),bandedRanges(range),conditionalFormats(ranges),data(rowData(values(dataValidation(condition(type))))))",
  });
  const sheet = (meta.data.sheets || [])[0] || {};
  const props = sheet.properties || {};
  const cells =
    ((((sheet.data || [])[0] || {}).rowData || [])[0] || {}).values || [];

  return {
    ok: true,
    mode: "inspect",
    gridRowCount: (props.gridProperties || {}).rowCount || null,
    // Does the NEXT order's row (row 2) already carry real checkboxes?
    row2Checkboxes: cells.map(function (c) {
      return c && c.dataValidation && c.dataValidation.condition
        ? c.dataValidation.condition.type
        : null;
    }),
    bandingCovers: (sheet.bandedRanges || []).map(function (b) {
      return r1(b.range);
    }),
    highlightCovers: (sheet.conditionalFormats || []).reduce(function (acc, cf) {
      (cf.ranges || []).forEach(function (rg) {
        acc.push(r1(rg));
      });
      return acc;
    }, []),
  };
}

/* Remove leftover verification rows. Only touches customer_name values that
   start with "TEST-", and reports counts only. */
async function dropTestRows(sheets, spreadsheetId) {
  const sheetId = await (async function () {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: "sheets(properties(sheetId,title))",
    });
    const s = (meta.data.sheets || []).find(function (x) {
      return x.properties && x.properties.title === SHEET_TAB;
    });
    return s ? s.properties.sheetId : null;
  })();
  if (sheetId === null) return { ok: false, error: "tab_missing" };

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: SHEET_TAB + "!B1:B",
  });
  const names = res.data.values || [];
  const victims = [];
  for (let i = 1; i < names.length; i++) {
    const name = String((names[i] || [])[0] || "");
    if (name.indexOf("TEST-") === 0) victims.push(i); // 0-indexed sheet row
  }
  if (victims.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: victims
          .slice()
          .sort(function (a, b) {
            return b - a; // delete bottom-up so indices stay valid
          })
          .map(function (idx) {
            return {
              deleteDimension: {
                range: { sheetId: sheetId, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 },
              },
            };
          }),
      },
    });
  }
  return { ok: true, mode: "dropTestRows", deleted: victims.length };
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) return json(500, { ok: false, error: "sheet_not_configured" });

  let body = {};
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    body = {};
  }

  try {
    const sheets = getSheetsClient();

    /* mode:"inspect" — structure only. Deliberately returns NO cell values, so
       this endpoint can never leak customer names/phones/addresses. */
    if (body.mode === "inspect") return json(200, await inspect(sheets, spreadsheetId));

    /* dropTestRows — deletes rows whose customer_name starts with "TEST-".
       Hard-limited to that prefix so it can never remove a real order. */
    if (body.dropTestRows === true) return json(200, await dropTestRows(sheets, spreadsheetId));

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
    // Grid ends right after the styled ready-rows, so there is no blank tail.
    const newRowCount = lastDataRow + READY_ROWS;
    const endRow = newRowCount; // style the data rows AND the ready rows
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

    /* 3) Grid size FIRST — later requests style rows that may not exist yet,
       and a range past the grid is an error. Also sets the frozen header
       row and the brand tab colour. */
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: { rowCount: newRowCount, frozenRowCount: 1 },
          tabColor: BRAND,
        },
        fields: "gridProperties(rowCount,frozenRowCount),tabColor",
      },
    });

    /* Reset checkbox validation across the whole styled area (a rule with no
       condition removes it) before re-applying it below. endRowIndex must not
       exceed the grid size we just set, or the request is out of range. */
    requests.push({
      setDataValidation: {
        range: {
          sheetId: sheetId,
          startRowIndex: 1,
          endRowIndex: newRowCount,
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
    {
      /* 6) Zebra striping is a CONDITIONAL RULE, not banding. A real banded
         range is silently destroyed when a row is inserted at its first row —
         which is exactly what every new order does. Conditional ranges survive
         and auto-expand, so striping stays correct forever. Added last (lowest
         priority) so the confirmed/delivered colors win over it. */

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
      // Zebra stripe, lowest priority — only paints rows no status colour claimed.
      requests.push({
        addConditionalFormatRule: {
          index: 2,
          rule: {
            ranges: [rowRange],
            booleanRule: {
              condition: { type: "CUSTOM_FORMULA", values: [{ userEnteredValue: "=ISEVEN(ROW())" }] },
              format: { backgroundColor: BAND2 },
            },
          },
        },
      });
    }


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
      styledThroughRow: endRow,
      readyRows: READY_ROWS,
      newRowCount: newRowCount,
    });
  } catch (err) {
    console.error("[نَدى] Google Sheets format failed:", err && err.message ? err.message : err);
    return json(500, { ok: false, error: "format_error", detail: err && err.message ? err.message : String(err) });
  }
};
