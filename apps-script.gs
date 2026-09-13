/**
 * Institute of Sleep Science, Kolkata
 * "Role of Guided, Individualized, and Tailored Mask Fitting in PAP Therapy Adherence"
 * Clinical Data Entry — Google Apps Script backend
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *         → Web app → Execute as: Me → Who has access: Anyone → copy /exec URL
 *         → paste into config.js as SCRIPT_URL
 *
 * Sheet: one tab, auto-created on first submission, named TAB_NAME below.
 * Row model: one row per patient. Enrollment appends a row. Each follow-up
 * visit and the outcomes form UPDATE that same row in place (matched on
 * Patient ID in column A) rather than appending a new row.
 */

var TAB_NAME = 'Mask Fitting Study';

// Exact column order written to the sheet. Index 0 = column A.
var HEADERS = [
  'Patient ID', 'Name', 'Age', 'Sex', 'BMI',
  'PSG - AHI', 'PSG - ODI', 'LSAT (%)', 'T90 - Time SpO2 ≤88% (hrs)', 'STOP-BANG', 'EPSS',
  'AI-guided mask selection (MyMask)', 'Number of masks tried', 'Mask fitting position', 'Total mask-fitting time (hrs)', 'Pressure trial during fitting',
  'Wears glasses in bed', 'Sensitive nostrils', 'Tosses and turns at night', 'Claustrophobic', 'Preferred sleeping position', 'Trouble gripping/holding things', 'Frequent nasal congestion',
  'AI 1st choice mask type', 'AI 2nd choice mask type', 'AI 3rd choice mask type', 'Frontal facial scan performed', 'Nasal scan performed', 'AI-suggested mask size', 'Manual sizer cross-check performed', 'Manual sizer match with AI',
  'Patient-reported most comfortable mask type', 'Comfortable mask match with AI', 'Final mask selection (brand/model)', 'Device', 'Set pressure (cmH2O)',
  'Patient experience rating (0-10)',
  'FU 1wk - Mask changed', 'FU 1wk - Adherence ≥4h/night (%)', 'FU 1wk - Avg usage (hrs/night)', 'FU 1wk - Mask leak 95th pct (L/min)', 'FU 1wk - Residual AHI',
  'FU 1mo - Mask changed', 'FU 1mo - Adherence ≥4h/night (%)', 'FU 1mo - Avg usage (hrs/night)', 'FU 1mo - Mask leak 95th pct (L/min)', 'FU 1mo - Residual AHI',
  'FU 3mo - Mask changed', 'FU 3mo - Adherence ≥4h/night (%)', 'FU 3mo - Avg usage (hrs/night)', 'FU 3mo - Mask leak 95th pct (L/min)', 'FU 3mo - Residual AHI',
  'FU 6mo - Mask changed', 'FU 6mo - Adherence ≥4h/night (%)', 'FU 6mo - Avg usage (hrs/night)', 'FU 6mo - Mask leak 95th pct (L/min)', 'FU 6mo - Residual AHI',
  'FU 1yr - Mask changed', 'FU 1yr - Adherence ≥4h/night (%)', 'FU 1yr - Avg usage (hrs/night)', 'FU 1yr - Mask leak 95th pct (L/min)', 'FU 1yr - Residual AHI',
  'Overall patient satisfaction (0-10)', 'AI-suggested mask (MyMask)', 'Concordance: final mask vs AI',
  'Enrolled at', 'Last updated'
];

// 1-indexed starting column for each follow-up timepoint's 5-field block.
var FOLLOWUP_START_COL = {
  '1wk': 38, '1mo': 43, '3mo': 48, '6mo': 53, '1yr': 58
};

var OUTCOMES_START_COL = 63; // satisfaction, AI-suggested mask, concordance
var PATIENT_ID_COL = 1;
var LAST_UPDATED_COL = 67;

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TAB_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findPatientRow_(sheet, patientId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, PATIENT_ID_COL, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim().toUpperCase() === String(patientId).trim().toUpperCase()) {
      return i + 2; // sheet row number
    }
  }
  return -1;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    var now = new Date();

    if (body.action === 'enroll') {
      var row = new Array(HEADERS.length).fill('');
      row[0] = body.patientId;
      row[1] = body.name;
      row[2] = body.age;
      row[3] = body.sex;
      row[4] = body.bmi;
      row[5] = body.ahi;
      row[6] = body.odi;
      row[7] = body.lsat;
      row[8] = body.t90;
      row[9] = body.stopbang;
      row[10] = body.epss;
      row[11] = body.aiGuided;
      row[12] = body.masksTried;
      row[13] = body.fittingPosition;
      row[14] = body.fittingTime;
      row[15] = body.pressureTrial;
      row[16] = body.glassesBed;
      row[17] = body.sensitiveNostrils;
      row[18] = body.tossTurn;
      row[19] = body.claustrophobic;
      row[20] = body.sleepPosition;
      row[21] = body.gripTrouble;
      row[22] = body.nasalCongestion;
      row[23] = body.aiChoice1;
      row[24] = body.aiChoice2;
      row[25] = body.aiChoice3;
      row[26] = body.frontalScan;
      row[27] = body.nasalScan;
      row[28] = body.aiSize;
      row[29] = body.manualCheck;
      row[30] = body.manualMatch;
      row[31] = body.comfortableType;
      row[32] = body.comfortableMatch;
      row[33] = body.finalMask;
      row[34] = body.device;
      row[35] = body.setPressure;
      row[36] = body.experienceRating;
      row[65] = now; // Enrolled at
      row[66] = now; // Last updated
      sheet.appendRow(row);

    } else if (body.action === 'followup') {
      var r = findPatientRow_(sheet, body.patientId);
      if (r === -1) throw new Error('Patient ID not found: ' + body.patientId);
      var startCol = FOLLOWUP_START_COL[body.timepoint];
      if (!startCol) throw new Error('Unknown timepoint: ' + body.timepoint);
      var values = [body.maskChanged, body.adherencePct, body.avgUsage, body.maskLeak, body.residualAhi];
      sheet.getRange(r, startCol, 1, 5).setValues([values]);
      sheet.getRange(r, LAST_UPDATED_COL).setValue(now);

    } else if (body.action === 'outcomes') {
      var r2 = findPatientRow_(sheet, body.patientId);
      if (r2 === -1) throw new Error('Patient ID not found: ' + body.patientId);
      var values2 = [body.satisfaction, body.aiSuggestedMask, body.concordance];
      sheet.getRange(r2, OUTCOMES_START_COL, 1, 3).setValues([values2]);
      sheet.getRange(r2, LAST_UPDATED_COL).setValue(now);

    } else {
      throw new Error('Unknown action: ' + body.action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = e.parameter.action;
  var sheet = getSheet_();

  if (action === 'exists') {
    var r = findPatientRow_(sheet, e.parameter.patientId);
    return ContentService
      .createTextOutput(JSON.stringify({ exists: r !== -1 }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'lookup') {
    var r2 = findPatientRow_(sheet, e.parameter.patientId);
    if (r2 === -1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'not_found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var rowVals = sheet.getRange(r2, 1, 1, HEADERS.length).getValues()[0];
    var fields = {};
    for (var i = 0; i < HEADERS.length; i++) fields[HEADERS[i]] = rowVals[i];
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'found',
        name: rowVals[1],
        age: rowVals[2],
        sex: rowVals[3],
        fields: fields
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready', message: 'PAP Mask Fitting Study collector is active.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
