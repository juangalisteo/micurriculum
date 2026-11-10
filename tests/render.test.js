/*
 * MiCurriculum · tests for render.js (painting the CV).
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
const { getInitials, joinSpanish, escapeHtml, safeLink, buildCvHtml } = require("../APP/js/render.js");

const render = (data, look = DEFAULT_LOOK) => buildCvHtml(data, look, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);
const withData = (changes) => Object.assign(JSON.parse(JSON.stringify(SAMPLE_DATA)), changes);

test("initials: first name and first surname", () => {
  assert.equal(getInitials("Juan Bautista Galisteo Marqués"), "JG");
  assert.equal(getInitials("María García López"), "MG");
  assert.equal(getInitials("Ana Ejemplo"), "AE");
  assert.equal(getInitials("  ana  "), "A");
  assert.equal(getInitials(""), "");
  assert.equal(getInitials(undefined), "");
});

test("methodology: 'y' before most words, 'e' before an 'i' sound", () => {
  assert.equal(joinSpanish(["Educar", "programar", "conectar", "inspirar"]), "Educar, programar, conectar e inspirar");
  assert.equal(joinSpanish(["Leer", "hilar"]), "Leer e hilar");
  assert.equal(joinSpanish(["Leer", "escribir"]), "Leer y escribir");
  assert.equal(joinSpanish(["Solo"]), "Solo");
  assert.equal(joinSpanish([]), "");
});

test("methodology sentence on the sheet uses lower case after the first step", () => {
  const html = render(withData({ metodologia: { titulo: "¿Mi metodología?", pasos: ["Educar", "Programar", "Conectar", "Inspirar"] } }));
  assert.match(html, /<p class="frase">Educar, programar, conectar e inspirar\.<\/p>/);
});

test("text is escaped and unsafe links are dropped", () => {
  assert.equal(escapeHtml(`<b>"Tom" & 'Ana'</b>`), "&lt;b&gt;&quot;Tom&quot; &amp; &#39;Ana&#39;&lt;/b&gt;");
  const html = render(withData({
    nombre: "<script>alert(1)</script>",
    contacto: [{ tipo: "web", texto: "x", enlace: "javascript:alert(1)" }]
  }));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("javascript:"));
  assert.equal(safeLink("mailto:a@example.com"), "mailto:a@example.com");
});

test("an empty section is not shown", () => {
  const html = render(withData({ cursos: [], idiomas: [], otros: [], perfil: "", metodologia: { titulo: "x", pasos: [] } }));
  assert.ok(!html.includes(TEXTS.cvCourses));
  assert.ok(!html.includes(`<h3>${TEXTS.cvLanguages}</h3>`));
  assert.ok(!html.includes(`<h3>${TEXTS.cvOther}</h3>`));
  assert.ok(!html.includes(`<h3>${TEXTS.cvProfile}</h3>`));
  assert.ok(!html.includes('class="meto"'));
  assert.ok(html.includes(TEXTS.cvExperience));
});

test("the main column follows the chosen order and skips unknown keys", () => {
  const html = render(withData({ orden: ["cursos", "nada", "formacion"] }));
  const courses = html.indexOf(TEXTS.cvCourses);
  const education = html.indexOf(TEXTS.cvEducation);
  assert.ok(courses > 0 && education > courses);
  assert.ok(!html.includes(`<h2>${TEXTS.cvExperience}</h2>`));
});

test("sample data paints initials, theme colors on the sheet and the default layout", () => {
  const html = render(SAMPLE_DATA);
  assert.match(html, /^<div class="cv izq" style="--lateral:#22343D;/);
  assert.ok(html.includes('<div class="iniciales">AE</div>'));
  assert.ok(html.includes("Ana Ejemplo"));
  const other = render(SAMPLE_DATA, { tema: "oceano", formato: "dcha" });
  assert.match(other, /^<div class="cv dcha" style="--lateral:#1F3A5F;/);
  const fallback = render(SAMPLE_DATA, { tema: "nope", formato: "nope" });
  assert.match(fallback, /^<div class="cv izq" style="--lateral:#22343D;/);
});
