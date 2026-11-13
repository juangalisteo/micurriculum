/*
 * MiCurriculum · fits the A4 sheet to the screen and warns when the CV
 * does not fit on one page.
 *
 * Only for the screen: the sheet keeps its real size in mm and is drawn
 * smaller (or back to real size) with a CSS transform. When printing, the
 * transform is not used and the sheet comes out at real size.
 *
 * computeSheetScale(), isOverflowing(), contentLimit() and columnsOverflow()
 * do not need the browser and are tested in Node with made-up sizes.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* Rounding of the browser: a column may be up to 1 px taller without overflowing. */
var OVERFLOW_TOLERANCE = 1;

/**
 * Scale that makes a sheet of sheetWidth fit in availableWidth, never
 * above its real size (1). Returns 1 when the sizes are not valid numbers.
 */
function computeSheetScale(availableWidth, sheetWidth) {
  var available = Number(availableWidth);
  var sheet = Number(sheetWidth);
  if (!isFinite(available) || !isFinite(sheet) || sheet <= 0) return 1;
  if (available <= 0) return 0;
  return Math.min(1, available / sheet);
}

/**
 * True when any of the content heights goes past the limit (plus a small
 * tolerance for rounding). The limit is the sheet height, or where the
 * content of a column must end (contentLimit). Numbers in px.
 */
function isOverflowing(sheetHeight, contentHeights) {
  var limit = Number(sheetHeight);
  if (!isFinite(limit) || limit <= 0 || !Array.isArray(contentHeights)) return false;
  return contentHeights.some(function (h) {
    var height = Number(h);
    return isFinite(height) && height > limit + OVERFLOW_TOLERANCE;
  });
}

/**
 * Where the content of a column may end: the top of the methodology box
 * when the column has one (the box is fixed at the bottom, so the sections
 * must stop before it), else the sheet height. Numbers in px from the top
 * of the sheet; a box top that is not a valid height inside the sheet is ignored.
 */
function contentLimit(sheetHeight, boxTop) {
  var limit = Number(sheetHeight);
  var box = Number(boxTop);
  if (isFinite(limit) && isFinite(box) && box > 0 && box < limit) return box;
  return limit;
}

/**
 * True when the content of any column ends past its own limit.
 * columns: [{ bottom, limit }], as measureColumns() returns them.
 */
function columnsOverflow(columns) {
  if (!Array.isArray(columns)) return false;
  return columns.some(function (column) {
    return !!column && isOverflowing(column.limit, [column.bottom]);
  });
}

/* ---------- Browser parts ---------- */

/** Width inside the preview area, without its padding. */
function getAvailableWidth(doc, preview) {
  var style = doc.defaultView.getComputedStyle(preview);
  return preview.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
}

/** Scales #sheet to the width of the preview and sizes its frame to match. */
function fitSheet(doc) {
  var preview = doc.getElementById("preview");
  var frame = doc.getElementById("sheet-frame");
  var sheet = doc.getElementById("sheet");
  if (!preview || !frame || !sheet) return;
  sheet.style.transform = "";
  var real = sheet.getBoundingClientRect();
  var scale = computeSheetScale(getAvailableWidth(doc, preview), real.width);
  if (scale !== 1) sheet.style.transform = "scale(" + scale + ")";
  frame.style.width = Math.floor(real.width * scale) + "px";
  frame.style.height = Math.floor(real.height * scale) + "px";
}

/**
 * For each column, where its content ends and where it may end, measured
 * from the top of the CV in px of the real-size sheet: { bottom, limit }.
 * The padding at the bottom of a column does not count: in the template
 * some content already uses part of it. In the main column the sections
 * (.apartados) must end before the methodology box, which is fixed below.
 */
function measureColumns(cv) {
  var top = cv.getBoundingClientRect().top;
  var scale = cv.offsetHeight ? cv.getBoundingClientRect().height / cv.offsetHeight : 1;
  var real = function (y) { return y / (scale || 1); };
  var columns = [];
  var nodes = cv.querySelectorAll(".lado, .main");
  for (var i = 0; i < nodes.length; i++) {
    var sections = nodes[i].querySelector(".apartados") || nodes[i];
    var method = nodes[i].querySelector(".meto");
    var bottom = 0;
    for (var j = 0; j < sections.children.length; j++) {
      var box = sections.children[j].getBoundingClientRect();
      if (box.height > 0) bottom = Math.max(bottom, box.bottom - top);
    }
    var boxTop = method ? real(method.getBoundingClientRect().top - top) : NaN;
    columns.push({ bottom: real(bottom), limit: contentLimit(cv.offsetHeight, boxTop) });
  }
  return columns;
}

/** Shows or hides the warning above the sheet. */
function checkOverflow(doc) {
  var warning = doc.getElementById("sheet-warning");
  var cv = doc.querySelector("#sheet .cv");
  if (!warning || !cv) return;
  warning.hidden = !columnsOverflow(measureColumns(cv));
}

/** Fits the sheet now and every time the preview area changes size. */
function watchSheetFit(doc) {
  var preview = doc.getElementById("preview");
  var view = doc.defaultView;
  var refit = function () { fitSheet(doc); };
  if (preview && view.ResizeObserver) new view.ResizeObserver(refit).observe(preview);
  view.addEventListener("resize", refit);
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(function () {
      refit();
      // With the real fonts the methodology texts measure differently (render.js).
      if (typeof fitMethodText === "function") fitMethodText(doc);
      checkOverflow(doc);
    });
  }
  refit();
}

if (typeof module !== "undefined") {
  module.exports = {
    OVERFLOW_TOLERANCE: OVERFLOW_TOLERANCE,
    computeSheetScale: computeSheetScale,
    isOverflowing: isOverflowing,
    contentLimit: contentLimit,
    columnsOverflow: columnsOverflow
  };
}
