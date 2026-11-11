/*
 * MiCurriculum · tests for look.js (theme and layout) and how the rest uses the look.
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
const { THEMES, LAYOUTS, DEFAULT_LOOK } = require("../APP/js/themes.js");
const SAMPLE_DATA = require("../APP/js/sample-data.js");
const { buildCvHtml } = require("../APP/js/render.js");
const { cleanLook, parseCopy, serializeCopy } = require("../APP/js/storage.js");
const { createStore } = require("../APP/js/state.js");
const { pickTheme, pickLayout, themeSwatch } = require("../APP/js/look.js");

const render = (look) => buildCvHtml(SAMPLE_DATA, look, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);

test("every theme and layout has its name in texts.js", () => {
  assert.deepEqual(Object.keys(THEMES), ["marca", "oceano", "bosque", "claro"]);
  assert.deepEqual(LAYOUTS, ["izq", "dcha", "una"]);
  for (const key of Object.keys(THEMES)) assert.equal(typeof TEXTS.themeNames[key], "string", key);
  for (const key of LAYOUTS) assert.equal(typeof TEXTS.layoutNames[key], "string", key);
  assert.equal(TEXTS.themeNames.oceano, "Océano");
  assert.equal(TEXTS.layoutNames.una, "Una columna");
  assert.equal(typeof TEXTS.lookTheme, "string");
  assert.equal(typeof TEXTS.lookLayout, "string");
});

test("unknown theme or layout: the default one is used", () => {
  assert.equal(pickTheme("nope", THEMES, DEFAULT_LOOK), "marca");
  assert.equal(pickTheme(undefined, THEMES, DEFAULT_LOOK), "marca");
  assert.equal(pickTheme("toString", THEMES, DEFAULT_LOOK), "marca");
  assert.equal(pickTheme("bosque", THEMES, DEFAULT_LOOK), "bosque");
  assert.equal(pickLayout("tres", LAYOUTS, DEFAULT_LOOK), "izq");
  assert.equal(pickLayout(null, LAYOUTS, DEFAULT_LOOK), "izq");
  assert.equal(pickLayout("una", LAYOUTS, DEFAULT_LOOK), "una");
  // The sheet and the copies do the same
  assert.equal(render({ tema: "nope", formato: "tres" }), render(DEFAULT_LOOK));
  assert.equal(render({ tema: "toString", formato: "una" }), render({ tema: "marca", formato: "una" }));
  assert.deepEqual(cleanLook({ tema: "nope", formato: "tres" }), DEFAULT_LOOK);
});

test("the sample of each theme uses its side column and accent colors", () => {
  assert.equal(themeSwatch(THEMES.marca), "linear-gradient(135deg, #22343D 0 55%, #C7A15B 55% 100%)");
  for (const key of Object.keys(THEMES)) {
    assert.ok(themeSwatch(THEMES[key]).includes(THEMES[key].lateral), key);
  }
});

test("each theme and layout paints its own sheet", () => {
  for (const tema of Object.keys(THEMES)) {
    for (const formato of LAYOUTS) {
      const html = render({ tema, formato });
      assert.ok(html.startsWith(`<div class="cv ${formato}" style="--lateral:${THEMES[tema].lateral};`), tema + " " + formato);
    }
  }
});

test("changing the look tells the listeners and goes into the copies", () => {
  const store = createStore(SAMPLE_DATA, DEFAULT_LOOK);
  let seen = null;
  store.onChange((data, look) => { seen = Object.assign({}, look); });
  store.updateLook((look) => { look.tema = "claro"; look.formato = "una"; });
  assert.equal(seen.tema, "claro");
  assert.equal(seen.formato, "una");
  assert.equal(DEFAULT_LOOK.tema, "marca"); // the default look is not changed
  const back = parseCopy(serializeCopy(store.data, store.look));
  assert.deepEqual(back.look, { tema: "claro", formato: "una", letra: DEFAULT_LOOK.letra });
});
