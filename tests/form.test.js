/*
 * MiCurriculum · tests for form.js (contact links, photo size, tags, rows
 * and the order of the sections)
 * and state.js (the data and the rows of a list).
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
const SAMPLE_DATA = require("../APP/js/sample-data.js");
const { DEFAULT_LOOK } = require("../APP/js/themes.js");
const {
  CONTACT_TYPES, buildContactLink, fitImageSize, updateContactLink,
  parseTags, formatTags, getRowValue, setRowValue, orderMainSections
} = require("../APP/js/form.js");
const { addRow, removeRow, moveRow, createStore } = require("../APP/js/state.js");

test("contact link: built from the type", () => {
  assert.equal(buildContactLink("lugar", "Ciudad Ejemplo (España)"), "");
  assert.equal(buildContactLink("telefono", "+34 600 00 00 00"), "tel:+34600000000");
  assert.equal(buildContactLink("telefono", "600-00-00-00"), "tel:600000000");
  assert.equal(buildContactLink("correo", " ana@example.com "), "mailto:ana@example.com");
  assert.equal(buildContactLink("web", "ana-ejemplo.example.com"), "https://ana-ejemplo.example.com");
  assert.equal(buildContactLink("web", "http://ana.example.com/"), "http://ana.example.com/");
  assert.equal(buildContactLink("github", "github.com/ana-ejemplo"), "https://github.com/ana-ejemplo");
  assert.equal(buildContactLink("github", "ana-ejemplo"), "https://github.com/ana-ejemplo");
  assert.equal(buildContactLink("linkedin", "linkedin.com/in/ana-ejemplo"), "https://linkedin.com/in/ana-ejemplo");
  assert.equal(buildContactLink("linkedin", "ana-ejemplo"), "https://www.linkedin.com/in/ana-ejemplo");
});

test("contact link: nothing when the text is empty or not valid", () => {
  assert.equal(buildContactLink("web", ""), "");
  assert.equal(buildContactLink("web", "   "), "");
  assert.equal(buildContactLink("web", "javascript:alert(1)"), "");
  assert.equal(buildContactLink("web", "dos palabras.com"), "");
  assert.equal(buildContactLink("correo", "no es un correo"), "");
  assert.equal(buildContactLink("telefono", "sin número"), "");
  assert.equal(buildContactLink("otro", "x"), "");
});

test("contact row: the link follows the type and the text", () => {
  const row = { tipo: "correo", texto: "ana@example.com" };
  updateContactLink(row);
  assert.equal(row.enlace, "mailto:ana@example.com");
  row.tipo = "lugar";
  updateContactLink(row);
  assert.equal("enlace" in row, false);
});

test("every contact type has its text", () => {
  for (const type of CONTACT_TYPES) assert.equal(typeof TEXTS.contactTypes[type], "string");
});

test("photo size: the longest side becomes 600 px, never bigger", () => {
  assert.deepEqual(fitImageSize(1200, 1600, 600), { width: 450, height: 600 });
  assert.deepEqual(fitImageSize(3000, 1000, 600), { width: 600, height: 200 });
  assert.deepEqual(fitImageSize(400, 300, 600), { width: 400, height: 300 });
  assert.deepEqual(fitImageSize(0, 0, 600), { width: 1, height: 1 });
});

test("rows: add, remove and move", () => {
  const list = ["a", "b", "c"];
  assert.equal(addRow(list, "d"), 3);
  assert.deepEqual(list, ["a", "b", "c", "d"]);
  assert.equal(addRow(list, "x", 0), 0);
  assert.deepEqual(list, ["x", "a", "b", "c", "d"]);
  assert.equal(removeRow(list, 0), true);
  assert.equal(removeRow(list, 9), false);
  assert.deepEqual(list, ["a", "b", "c", "d"]);
  assert.equal(moveRow(list, 0, 1), 1);
  assert.deepEqual(list, ["b", "a", "c", "d"]);
  assert.equal(moveRow(list, 3, -1), 2);
  assert.deepEqual(list, ["b", "a", "d", "c"]);
  assert.equal(moveRow(list, 0, -1), -1);
  assert.equal(moveRow(list, 3, 1), -1);
  assert.deepEqual(list, ["b", "a", "d", "c"]);
});

test("store: starts with a copy of the sample data and tells about each change", () => {
  const store = createStore(SAMPLE_DATA, DEFAULT_LOOK);
  const seen = [];
  store.onChange((data) => seen.push(data.contacto.map((c) => c.tipo).join(",")));
  store.update((d) => { moveRow(d.contacto, 0, 1); });
  store.update((d) => { removeRow(d.contacto, 5); });
  store.update((d) => { addRow(d.contacto, { tipo: "web", texto: "" }); });
  assert.deepEqual(seen, [
    "telefono,lugar,web,github,correo,linkedin",
    "telefono,lugar,web,github,correo",
    "telefono,lugar,web,github,correo,web"
  ]);
  store.update((d) => { d.nombre = "Otra Persona"; });
  assert.equal(store.data.nombre, "Otra Persona");
  assert.equal(SAMPLE_DATA.nombre, "Ana Ejemplo");
  assert.equal(SAMPLE_DATA.contacto.length, 6);
  assert.equal(SAMPLE_DATA.contacto[0].tipo, "lugar");
});

test("project tags: typed in one field, separated by commas", () => {
  assert.deepEqual(parseTags("Diseño, Web ,, imprenta , "), ["Diseño", "Web", "imprenta"]);
  assert.deepEqual(parseTags(""), []);
  assert.deepEqual(parseTags("   "), []);
  assert.deepEqual(parseTags(undefined), []);
  assert.deepEqual(parseTags("Una sola"), ["Una sola"]);
  assert.equal(formatTags(["Diseño", "Web"]), "Diseño, Web");
  assert.equal(formatTags([]), "");
  assert.equal(formatTags(undefined), "");
  assert.deepEqual(parseTags(formatTags(["a", "b c"])), ["a", "b c"]);
});

test("rows: the tags field keeps a list, the rest keeps the text", () => {
  const tags = { key: "etiquetas", format: formatTags, parse: parseTags };
  const name = { key: "nombre" };
  const list = [{ nombre: "Web", etiquetas: ["HTML", "CSS"] }];
  assert.equal(getRowValue(list[0], tags), "HTML, CSS");
  assert.equal(setRowValue(list, 0, tags, "HTML, CSS, JS"), true);
  assert.deepEqual(list[0].etiquetas, ["HTML", "CSS", "JS"]);
  setRowValue(list, 0, name, "Tienda");
  assert.equal(list[0].nombre, "Tienda");
  assert.equal(getRowValue({}, name), "");
  assert.equal(setRowValue(list, 3, name, "x"), false);
});

test("methodology steps: each row is only a text", () => {
  const step = { key: null };
  const steps = ["Escuchar", "Ordenar"];
  assert.equal(getRowValue(steps[1], step), "Ordenar");
  setRowValue(steps, 1, step, "Diseñar");
  addRow(steps, "");
  setRowValue(steps, 2, step, "Ilusionar");
  assert.deepEqual(steps, ["Escuchar", "Diseñar", "Ilusionar"]);
  assert.equal(moveRow(steps, 2, -1), 1);
  assert.deepEqual(steps, ["Escuchar", "Ilusionar", "Diseñar"]);
});

test("form sections of the main column follow the order of the CV", () => {
  const keys = ["experiencia", "formacion", "cursos", "proyectos"];
  assert.deepEqual(orderMainSections(keys, ["formacion", "experiencia", "cursos"]), ["formacion", "experiencia", "cursos", "proyectos"]);
  assert.deepEqual(orderMainSections(keys, ["cursos", "nada"]), ["cursos", "experiencia", "formacion", "proyectos"]);
  assert.deepEqual(orderMainSections(keys, undefined), keys);
});

test("every new text of the form exists", () => {
  const keys = [
    "formLanguages", "fieldLanguage", "fieldLevel", "formSkills", "skillsHelp", "fieldGroup", "fieldItems",
    "formOther", "fieldOtherText", "fieldOtherDetail", "formExperience", "fieldCompany", "fieldDate", "fieldRole",
    "fieldDescription", "formEducation", "formCourses", "fieldTitle", "fieldCenter", "formProjects",
    "fieldProjectName", "fieldStatus", "fieldTags", "tagsHelp", "formMethod", "fieldMethodTitle", "methodHelp",
    "fieldStep", "stepAdd"
  ];
  for (const key of keys) assert.equal(typeof TEXTS[key], "string", key);
});
