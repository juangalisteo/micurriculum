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
const { getInitials, joinSpanish, cleanSteps, fitFontSize, escapeHtml, safeLink, buildSection, buildCvHtml } = require("../APP/js/render.js");

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

test("methodology: empty steps are dropped; with no steps the box is not shown", () => {
  assert.deepEqual(cleanSteps([" Escuchar ", "", "   ", null, "Ordenar"]), ["Escuchar", "Ordenar"]);
  assert.deepEqual(cleanSteps(undefined), []);
  const withEmpty = render(withData({ metodologia: { titulo: "Mi forma", pasos: ["Leer", "", " "] } }));
  assert.match(withEmpty, /<p class="frase">Leer\.<\/p>/);
  for (const pasos of [[], ["", "  "], undefined]) {
    assert.ok(!render(withData({ metodologia: { titulo: "Mi forma", pasos } })).includes('class="meto"'));
  }
  assert.ok(!render(withData({ metodologia: undefined })).includes('class="meto"'));
});

test("the methodology texts get a smaller font only when they are wider than the box", () => {
  assert.equal(fitFontSize(45.33, 366, 300), 45.33);   // fits: the size of cv.css
  assert.equal(fitFontSize(45.33, 366, 366), 45.33);
  assert.equal(fitFontSize(17.33, 366, 380), 16.69);   // a little too wide: a little smaller
  assert.equal(fitFontSize(17.33, 366, 732), 8.66);    // twice too wide: half
  assert.equal(fitFontSize(17.33, 0, 300), 17.33);     // nothing measured yet: the base size
  assert.equal(fitFontSize(17.33, NaN, 300), 17.33);
  assert.equal(fitFontSize(0, 366, 300), 0);
  assert.equal(fitFontSize(undefined, 366, 300), 0);
});

test("the main column puts the sections in their own block, before the methodology box", () => {
  const html = render(SAMPLE_DATA);
  assert.match(html, /<main class="main"><div class="apartados"><section><h2>/);
  assert.match(html, /<\/section><\/div><section class="meto">/);
  const noMethod = render(withData({ metodologia: { titulo: "x", pasos: [] } }));
  assert.match(noMethod, /<\/section><\/div><\/main>/);
});

test("sections that cannot be edited are not painted, even when they are in the order", () => {
  const proyectos = [{ nombre: "Web", estado: "En curso", descripcion: "Una tienda", etiquetas: ["HTML", "CSS"] }];
  const html = render(withData({ orden: ["proyectos", "habilidades", "cursos"], proyectos }));
  assert.ok(!html.includes(`<h2>${TEXTS.cvProjects}</h2>`));
  assert.ok(!html.includes(`<h2>${TEXTS.cvSkills}</h2>`));
  assert.ok(html.includes(`<h2>${TEXTS.cvCourses}</h2>`));
  // render.js keeps the code of the projects, with their tags as chips
  const section = buildSection("proyectos", { proyectos }, TEXTS);
  assert.ok(section.includes('<div class="chips"><span>HTML</span><span>CSS</span></div>'));
});
