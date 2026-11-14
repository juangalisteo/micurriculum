/*
 * MiCurriculum · fits the A4 sheet to the screen and warns when the CV
 * does not fit on one page.
 *
 * Only for the screen: the sheet keeps its real size in mm and is drawn
 * smaller (or back to real size) with a CSS transform. When printing, the
 * transform is not used and the sheet comes out at real size.
 *
 * It also keeps the content within the sheet: after every change of the
 * form the sheet is painted and measured, and a change that makes the
 * content go further past the limit than before is undone (state.js does
 * the undoing; here is the decision). When a column has no room for one
 * more row, the form disables its "add row" buttons.
 *
 * computeSheetScale(), isOverflowing(), contentLimit(), columnsOverflow(),
 * overflowAmount(), shouldUndo() and columnsFull() do not need the browser
 * and are tested in Node with made-up sizes.
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

/* A change that makes the content go past the limit by less than this (px) is not worse: rounding. */
var CHANGE_TOLERANCE = 0.5;

/* Room one more row needs (px), when the column has no row to measure it from: a gap and a line. */
var NEW_ROW_HEIGHT = { lado: 21, main: 35 };

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

/**
 * How far the content goes past its limit, in px: the sum of what every
 * column goes past its own limit (beyond the tolerance), 0 when everything
 * fits. columns: [{ bottom, limit }], as measureColumns() returns them.
 */
function overflowAmount(columns) {
  if (!Array.isArray(columns)) return 0;
  return columns.reduce(function (total, column) {
    if (!column) return total;
    var bottom = Number(column.bottom);
    var limit = Number(column.limit);
    if (!isFinite(bottom) || !isFinite(limit) || limit <= 0) return total;
    return total + Math.max(0, bottom - limit - OVERFLOW_TOLERANCE);
  }, 0);
}

/**
 * The decision of the content limit: true when a change must be undone,
 * because after it the content goes further past the limit than before
 * (overflowBefore and overflowAfter in px, from overflowAmount()). A change
 * that leaves the overflow as it was, or smaller, is always kept: removing
 * or shortening is never blocked, and when the sheet already did not fit
 * (a copy opened, another layout), changes that do not make it worse go in.
 */
function shouldUndo(overflowBefore, overflowAfter) {
  var before = Number(overflowBefore);
  var after = Number(overflowAfter);
  if (!isFinite(after) || after <= 0) return false;
  if (!isFinite(before) || before < 0) before = 0;
  return after > before + CHANGE_TOLERANCE;
}

/**
 * Which columns have no room for one more row: { lado, main }. A column is
 * full when its free space (free, px) is smaller than what a new row needs
 * (need, px, or NEW_ROW_HEIGHT of its name), or when it does not fit.
 * columns: [{ name, bottom, limit, free, need }], as measureColumns() returns them.
 */
function columnsFull(columns) {
  var full = { lado: false, main: false };
  if (!Array.isArray(columns)) return full;
  columns.forEach(function (column) {
    if (!column || !Object.prototype.hasOwnProperty.call(full, column.name)) return;
    var need = Number(column.need);
    if (!isFinite(need) || need <= 0) need = NEW_ROW_HEIGHT[column.name];
    var free = Number(column.free);
    if (!isFinite(free)) free = Number(column.limit) - Number(column.bottom);
    if (!isFinite(free) || free < need || isOverflowing(column.limit, [column.bottom])) full[column.name] = true;
  });
  return full;
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
 * from the top of the CV in px of the real-size sheet:
 * { name, bottom, limit, free, need }. name is "lado" or "main".
 * The padding at the bottom of a column does not count: in the template
 * some content already uses part of it. In the main column the sections
 * (.apartados) must end before the methodology box, which is fixed below.
 * free is the room left for more content and need what one more row (a gap
 * and a line like the ones already there) would take, for columnsFull().
 * In the side column of the two-column layouts the footer sits at the
 * bottom, so the room is what is left above it; in the single column the
 * side block is the header and takes its room from the main column.
 */
function measureColumns(cv) {
  var top = cv.getBoundingClientRect().top;
  var scale = cv.offsetHeight ? cv.getBoundingClientRect().height / cv.offsetHeight : 1;
  var real = function (y) { return y / (scale || 1); };
  var style = function (node) { return cv.ownerDocument.defaultView.getComputedStyle(node); };
  var gapOf = function (node) { return parseFloat(style(node).rowGap) || 0; };
  var columns = [];
  var nodes = cv.querySelectorAll(".lado, .main");
  for (var i = 0; i < nodes.length; i++) {
    var name = nodes[i].classList.contains("lado") ? "lado" : "main";
    var sections = nodes[i].querySelector(".apartados") || nodes[i];
    var method = nodes[i].querySelector(".meto");
    var footer = nodes[i].querySelector(".pie");
    var bottom = 0;
    var contentBottom = 0; // without the footer
    for (var j = 0; j < sections.children.length; j++) {
      var child = sections.children[j];
      var box = child.getBoundingClientRect();
      if (box.height <= 0) continue;
      bottom = Math.max(bottom, box.bottom - top);
      if (child !== footer) contentBottom = Math.max(contentBottom, box.bottom - top);
    }
    var boxTop = method ? real(method.getBoundingClientRect().top - top) : NaN;
    var limit = contentLimit(cv.offsetHeight, boxTop);
    var column = { name: name, bottom: real(bottom), limit: limit, free: NaN, need: NaN };
    if (name === "main") {
      column.free = limit - column.bottom;
      var line = sections.querySelector(".tl .t");
      if (line) column.need = gapOf(line.parentNode.parentNode) + real(line.getBoundingClientRect().height);
    } else if (footer && footer.getBoundingClientRect().height > 0) {
      column.free = real(footer.getBoundingClientRect().top - top - contentBottom) - gapOf(nodes[i]);
      var row = sections.querySelector(".lista li");
      if (row) column.need = gapOf(row.parentNode) + real(row.getBoundingClientRect().height);
    }
    columns.push(column);
  }
  // Single column: the header grows into the main column, so it shares its room.
  var main = columns.filter(function (c) { return c.name === "main"; })[0];
  columns.forEach(function (c) {
    if (c.name === "lado" && !isFinite(c.free) && main) { c.free = main.free; c.need = main.need; }
  });
  return columns;
}

/**
 * Measures the sheet, shows or hides the warning above it and returns
 * { overflow, full }: how far the content goes past the limit (px, 0 when
 * it fits) and which columns have no room for one more row.
 */
function checkOverflow(doc) {
  var warning = doc.getElementById("sheet-warning");
  var cv = doc.querySelector("#sheet .cv");
  if (!warning || !cv) return { overflow: 0, full: columnsFull([]) };
  var columns = measureColumns(cv);
  warning.hidden = !columnsOverflow(columns);
  return { overflow: overflowAmount(columns), full: columnsFull(columns) };
}

/**
 * The content limit of the form: a guard for the store (state.js) that
 * paints the sheet with the changed data and keeps the change only when
 * the content does not go further past the limit than it did after the
 * last painting (measure() records it). measure() is what the program
 * calls after every painting: it moves the warning and returns the
 * measurements, so the form can disable the "add row" buttons.
 */
function createContentLimit(doc, render) {
  var last = { overflow: 0, full: columnsFull([]) };
  return {
    measure: function () {
      last = checkOverflow(doc);
      return last;
    },
    guard: function (data, look) {
      render(doc, data, look);
      return !shouldUndo(last.overflow, checkOverflow(doc).overflow);
    }
  };
}

/**
 * Fits the sheet now and every time the preview area changes size. When
 * the fonts arrive, remeasure() (or the warning check) runs again.
 */
function watchSheetFit(doc, remeasure) {
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
      if (remeasure) remeasure();
      else checkOverflow(doc);
    });
  }
  refit();
}

if (typeof module !== "undefined") {
  module.exports = {
    OVERFLOW_TOLERANCE: OVERFLOW_TOLERANCE,
    CHANGE_TOLERANCE: CHANGE_TOLERANCE,
    NEW_ROW_HEIGHT: NEW_ROW_HEIGHT,
    computeSheetScale: computeSheetScale,
    isOverflowing: isOverflowing,
    contentLimit: contentLimit,
    columnsOverflow: columnsOverflow,
    overflowAmount: overflowAmount,
    shouldUndo: shouldUndo,
    columnsFull: columnsFull
  };
}
