/*
 * MiCurriculum · exports the CV to PDF with the print window of the browser.
 *
 * The print styles (app.css, @media print) leave only the A4 sheet, at real
 * size. Before printing, the fonts are waited for, the user confirms when
 * the content does not fit on one page, and the page title becomes
 * CV_NOMBRE_AAAAMMDD, so the browser proposes that name for the PDF.
 *
 * pdfTitle() and shouldExport() do not need the browser and are tested in Node.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* In Node, the name rule comes from storage.js; in the browser it is already loaded. */
var exportNameRule = typeof cvBaseName === "function" ? cvBaseName : require("./storage.js").cvBaseName;

/** CV_NOMBRE_AAAAMMDD: the same rule as the name of the copies, without ".json". */
function pdfTitle(name, date) {
  return exportNameRule(name, date);
}

/**
 * True when the PDF can be made: always when the content fits; when it
 * does not, only if confirm() says yes.
 */
function shouldExport(overflowing, confirm) {
  if (!overflowing) return true;
  return Boolean(confirm());
}

/* ---------- Browser only ---------- */

/** True when the "does not fit" warning is showing, measured again now. */
function sheetOverflows(doc) {
  if (typeof checkOverflow === "function") checkOverflow(doc);
  var warning = doc.getElementById("sheet-warning");
  return Boolean(warning && !warning.hidden);
}

/**
 * Waits for the fonts, asks when the content does not fit, sets the title
 * and opens the print window. The usual title comes back afterwards.
 * Returns a promise with true when the print window was opened.
 */
function exportPdf(doc, win, state, texts) {
  var fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
  return fonts.then(function () {
    var ask = function () { return win.confirm(texts.pdfOverflowConfirm); };
    if (!shouldExport(sheetOverflows(doc), ask)) return false;

    var usualTitle = doc.title;
    var restore = function () {
      win.removeEventListener("afterprint", restore);
      doc.title = usualTitle;
      if (typeof fitSheet === "function") fitSheet(doc);
    };
    win.addEventListener("afterprint", restore);
    doc.title = pdfTitle(state.data && state.data.nombre, new Date());
    try {
      win.print();
    } finally {
      // print() waits for the window in Chrome and Firefox; afterprint covers the rest.
      restore();
    }
    return true;
  });
}

/** Adds the "Exportar PDF" button at the end of #actions. */
function buildExportAction(doc, win, state, texts) {
  var host = doc.getElementById("actions");
  if (!host) return;
  var old = doc.getElementById("export-pdf");
  if (old) old.remove();
  var button = doc.createElement("button");
  button.type = "button";
  button.id = "export-pdf";
  button.className = "button";
  button.textContent = texts.pdfExport;
  button.title = texts.pdfExportHelp;
  button.addEventListener("click", function () {
    hideNotice(doc);
    exportPdf(doc, win, state, texts);
  });
  host.appendChild(button);
}

if (typeof module !== "undefined") {
  module.exports = { pdfTitle: pdfTitle, shouldExport: shouldExport };
}
