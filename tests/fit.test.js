/*
 * MiCurriculum · tests for fit.js: the scale of the sheet and the
 * "does not fit" check, with made-up sizes.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const TEXTS = require("../APP/js/texts.js");
const { computeSheetScale, isOverflowing, contentLimit, columnsOverflow, OVERFLOW_TOLERANCE } = require("../APP/js/fit.js");

/* 210 mm at 96 dpi, as the browser measures it. */
const A4_WIDTH = 793.7;
const A4_HEIGHT = 1122.5;

test("the sheet shrinks to fit narrower areas", () => {
  assert.equal(computeSheetScale(A4_WIDTH / 2, A4_WIDTH), 0.5);
  assert.ok(Math.abs(computeSheetScale(600, A4_WIDTH) - 600 / A4_WIDTH) < 1e-12);
  assert.ok(Math.abs(computeSheetScale(320, A4_WIDTH) - 320 / A4_WIDTH) < 1e-12);
});

test("the sheet never goes above its real size", () => {
  assert.equal(computeSheetScale(A4_WIDTH, A4_WIDTH), 1);
  assert.equal(computeSheetScale(1200, A4_WIDTH), 1);
  assert.equal(computeSheetScale(5000, A4_WIDTH), 1);
});

test("the scale handles empty or wrong sizes", () => {
  assert.equal(computeSheetScale(0, A4_WIDTH), 0);
  assert.equal(computeSheetScale(-40, A4_WIDTH), 0);
  assert.equal(computeSheetScale(600, 0), 1);
  assert.equal(computeSheetScale(undefined, A4_WIDTH), 1);
  assert.equal(computeSheetScale(600, NaN), 1);
});

test("content that fits gives no warning", () => {
  assert.equal(isOverflowing(A4_HEIGHT, [A4_HEIGHT, 900, 1000]), false);
  assert.equal(isOverflowing(A4_HEIGHT, [A4_HEIGHT + OVERFLOW_TOLERANCE]), false);
  assert.equal(isOverflowing(A4_HEIGHT, []), false);
});

test("a column taller than the sheet gives the warning", () => {
  assert.equal(isOverflowing(A4_HEIGHT, [A4_HEIGHT, 1300]), true);
  assert.equal(isOverflowing(A4_HEIGHT, [1500, 900]), true);
  assert.equal(isOverflowing(A4_HEIGHT, [A4_HEIGHT + OVERFLOW_TOLERANCE + 0.5]), true);
});

test("the overflow check ignores wrong sizes", () => {
  assert.equal(isOverflowing(0, [1300]), false);
  assert.equal(isOverflowing(A4_HEIGHT, undefined), false);
  assert.equal(isOverflowing(A4_HEIGHT, [NaN, "x"]), false);
});

test("the limit of a column is the top of the methodology box, or the sheet without a box", () => {
  assert.equal(contentLimit(A4_HEIGHT, 918.5), 918.5);
  assert.equal(contentLimit(A4_HEIGHT, 1032.3), 1032.3);
  assert.equal(contentLimit(A4_HEIGHT, NaN), A4_HEIGHT);        // no box in the column
  assert.equal(contentLimit(A4_HEIGHT, undefined), A4_HEIGHT);
  assert.equal(contentLimit(A4_HEIGHT, 0), A4_HEIGHT);          // a box top that is not a height
  assert.equal(contentLimit(A4_HEIGHT, -5), A4_HEIGHT);
  assert.equal(contentLimit(A4_HEIGHT, A4_HEIGHT + 20), A4_HEIGHT); // a box below the sheet does not count
});

test("the sections may end anywhere above the box; past its top, the warning", () => {
  const box = 918.5;
  const limit = contentLimit(A4_HEIGHT, box);
  // the sample data: the courses end 28 px above the box
  assert.equal(columnsOverflow([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: 889.9, limit }]), false);
  // the sections reach the box
  assert.equal(columnsOverflow([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: box + OVERFLOW_TOLERANCE, limit }]), false);
  assert.equal(columnsOverflow([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: box + OVERFLOW_TOLERANCE + 0.5, limit }]), true);
  assert.equal(columnsOverflow([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: 1000, limit }]), true);
  // the side column still counts up to the sheet
  assert.equal(columnsOverflow([{ bottom: A4_HEIGHT + 3, limit: A4_HEIGHT }, { bottom: 800, limit }]), true);
  // without a methodology box, the main column counts up to the sheet, as before
  assert.equal(columnsOverflow([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: 1000, limit: contentLimit(A4_HEIGHT, NaN) }]), false);
  assert.equal(columnsOverflow([]), false);
  assert.equal(columnsOverflow(undefined), false);
  assert.equal(columnsOverflow([null, { bottom: "x", limit }]), false);
});

test("the warning text is in texts.js", () => {
  assert.equal(TEXTS.sheetOverflow, "El contenido no cabe en una página");
});
