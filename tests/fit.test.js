/*
 * MiCurriculum · tests for fit.js: the scale of the sheet, the "does not
 * fit" check and the content limit (how far the content goes past the
 * sheet, whether a change is kept or undone, and which columns are full),
 * with made-up sizes.
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
const {
  computeSheetScale, isOverflowing, contentLimit, columnsOverflow, overflowAmount, shouldUndo, columnsFull,
  OVERFLOW_TOLERANCE, CHANGE_TOLERANCE, NEW_ROW_HEIGHT
} = require("../APP/js/fit.js");

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

/* ---------- Content limit ---------- */

const box = 918.5;
const limit = contentLimit(A4_HEIGHT, box);

test("how far the content goes past the limit: 0 when it fits", () => {
  // the sample data in two columns: the side footer at the bottom, the courses 28 px above the box
  assert.equal(overflowAmount([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: 889.9, limit }]), 0);
  assert.equal(overflowAmount([{ bottom: box + OVERFLOW_TOLERANCE, limit }]), 0); // rounding
  assert.equal(overflowAmount([]), 0);
  assert.equal(overflowAmount(undefined), 0);
  assert.equal(overflowAmount([null, { bottom: "x", limit }, { bottom: 900, limit: 0 }]), 0);
});

test("how far the content goes past the limit: what every column goes past, added up", () => {
  assert.equal(overflowAmount([{ bottom: 1085, limit: A4_HEIGHT }, { bottom: box + 13.5, limit }]), 12.5);
  assert.equal(overflowAmount([{ bottom: A4_HEIGHT + 21, limit: A4_HEIGHT }, { bottom: box + 11, limit }]), 30);
  // the amount and the warning agree: past the limit means more than 0
  const columns = [{ bottom: 1085, limit: A4_HEIGHT }, { bottom: box + OVERFLOW_TOLERANCE + 0.5, limit }];
  assert.equal(overflowAmount(columns) > 0, columnsOverflow(columns));
});

test("a change that keeps the content inside the sheet stays", () => {
  assert.equal(shouldUndo(0, 0), false);
  assert.equal(shouldUndo(0, -3), false); // never below 0, but just in case
  assert.equal(shouldUndo(0, undefined), false);
});

test("a change that makes the content go past the sheet is undone", () => {
  assert.equal(shouldUndo(0, 12.5), true);     // one more line of a subtitle
  assert.equal(shouldUndo(0, 0.6), true);      // a hair past the tolerance
  assert.equal(shouldUndo(0, CHANGE_TOLERANCE), false); // rounding is not worse
  assert.equal(shouldUndo(undefined, 5), true); // nothing measured before counts as 0
  assert.equal(shouldUndo(NaN, 5), true);
  assert.equal(shouldUndo(-1, 5), true);
});

test("when the sheet already did not fit, only changes that make it worse are undone", () => {
  // a copy opened or another layout left 40 px outside (not undone): the user may go on
  assert.equal(shouldUndo(40, 40), false);      // the same
  assert.equal(shouldUndo(40, 25), false);      // shorter: removing or cutting is never blocked
  assert.equal(shouldUndo(40, 0), false);
  assert.equal(shouldUndo(40, 40 + CHANGE_TOLERANCE), false);
  assert.equal(shouldUndo(40, 41), true);       // one more line
  assert.equal(shouldUndo(40, 52.5), true);
});

test("a column is full when one more row would not fit", () => {
  const main = (free, need) => ({ name: "main", bottom: limit - free, limit, free, need });
  const side = (free, need) => ({ name: "lado", bottom: 1085, limit: A4_HEIGHT, free, need });
  // the sample data: 28 px free in the main column, a row needs about 35 px
  assert.deepEqual(columnsFull([side(300, 21), main(28, 35)]), { lado: false, main: true });
  assert.deepEqual(columnsFull([side(300, 21), main(35, 35)]), { lado: false, main: false });
  assert.deepEqual(columnsFull([side(20, 21), main(100, 35)]), { lado: true, main: false });
  assert.deepEqual(columnsFull([side(0, 21), main(-12, 35)]), { lado: true, main: true });
  // without a row to measure from, the usual height of a row
  assert.deepEqual(columnsFull([side(NEW_ROW_HEIGHT.lado, NaN), main(NEW_ROW_HEIGHT.main - 1, NaN)]), { lado: false, main: true });
  // a column past its limit is full even when the free space says otherwise
  assert.deepEqual(columnsFull([{ name: "main", bottom: box + 30, limit, free: 50, need: 35 }]), { lado: false, main: true });
  // without free space measured, it comes from the limit and the bottom
  assert.deepEqual(columnsFull([{ name: "main", bottom: box - 10, limit, free: NaN, need: 35 }]), { lado: false, main: true });
  assert.deepEqual(columnsFull([{ name: "main", bottom: box - 60, limit, free: NaN, need: 35 }]), { lado: false, main: false });
  assert.deepEqual(columnsFull([]), { lado: false, main: false });
  assert.deepEqual(columnsFull(undefined), { lado: false, main: false });
  assert.deepEqual(columnsFull([null, { name: "otra", free: 0 }]), { lado: false, main: false });
});

test("the texts of the content limit are in texts.js", () => {
  assert.equal(TEXTS.sheetFull, "No cabe más en la hoja. Quita algo para añadir esto.");
  assert.equal(TEXTS.sheetFullAdd, "La hoja está llena");
});
