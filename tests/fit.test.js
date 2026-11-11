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
const { computeSheetScale, isOverflowing, OVERFLOW_TOLERANCE } = require("../APP/js/fit.js");

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

test("the warning text is in texts.js", () => {
  assert.equal(TEXTS.sheetOverflow, "El contenido no cabe en una página");
});
