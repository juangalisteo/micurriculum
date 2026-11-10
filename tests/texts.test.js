/*
 * MiCurriculum · tests for texts.js and app.js.
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
const { getText } = require("../APP/js/app.js");

test("texts.js loads and has the program version", () => {
  assert.equal(typeof TEXTS, "object");
  assert.equal(TEXTS.version, "0.1.0");
  assert.match(TEXTS.version, /^\d+\.\d+\.\d+$/);
});

test("texts.js has the program name", () => {
  assert.equal(TEXTS.appName, "MiCurriculum");
});

test("getText returns the text, or the key when it is missing", () => {
  assert.equal(getText(TEXTS, "appName"), "MiCurriculum");
  assert.equal(getText(TEXTS, "doesNotExist"), "doesNotExist");
});
