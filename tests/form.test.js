/*
 * MiCurriculum · tests for form.js (contact links, photo size, tags, rows,
 * the order of the sections and the limits of the methodology)
 * and state.js (the data, the rows of a list and the guard that undoes
 * a change: the content limit).
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
const { METHOD_LIMITS } = require("../APP/js/render.js");
const {
  CONTACT_TYPES, buildContactLink, fitImageSize, updateContactLink,
  parseTags, formatTags, clampText, formatCharsLeft, getRowValue, setRowValue, buildOrderRows, orderFromRows
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
  assert.equal(SAMPLE_DATA.nombre, "MiCurriculum");
  assert.equal(SAMPLE_DATA.contacto.length, 6);
  assert.equal(SAMPLE_DATA.contacto[0].tipo, "lugar");
});

test("store: a guard keeps or undoes each change", () => {
  const store = createStore(SAMPLE_DATA, DEFAULT_LOOK);
  const seen = [];
  store.onChange((data) => seen.push(data.nombre + "/" + data.cursos.length));
  // without a guard, every change stays and update() says so
  assert.equal(store.update((d) => { d.nombre = "Ana Uno"; }), true);
  // the guard sees the changed data and the look; false undoes the change
  const asked = [];
  store.setGuard((data, look) => {
    asked.push(data.nombre + "/" + data.cursos.length + "/" + look.formato);
    return data.cursos.length <= 6;
  });
  assert.equal(store.update((d) => { d.nombre = "Ana Dos"; }), true);
  assert.equal(store.update((d) => { addRow(d.cursos, { titulo: "Uno más", centro: "", fecha: "" }); }), false);
  assert.equal(store.data.nombre, "Ana Dos");
  assert.equal(store.data.cursos.length, 6);
  assert.equal(store.data.cursos[5].titulo, "Curso online de herramientas digitales");
  assert.deepEqual(asked, ["Ana Dos/6/izq", "Ana Dos/7/izq"]);
  // the listeners are told after the undone change too, with the data as before
  assert.deepEqual(seen, ["Ana Uno/6", "Ana Dos/6", "Ana Dos/6"]);
  // removing goes through the guard like any change; the look and a whole replacement never ask it
  assert.equal(store.update((d) => { removeRow(d.cursos, 0); }), true);
  store.updateLook((look) => { look.formato = "una"; });
  store.replace(SAMPLE_DATA, DEFAULT_LOOK);
  assert.equal(asked.length, 3);
  assert.equal(store.data.cursos.length, 6);
  // a guard that is not a function is no guard
  store.setGuard(null);
  assert.equal(store.update((d) => { addRow(d.cursos, { titulo: "Otro", centro: "", fecha: "" }); }), true);
  assert.equal(store.data.cursos.length, 7);
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

test("order rows: the sections in order are shown, the rest hidden at the end", () => {
  const keys = ["formacion", "experiencia", "cursos"];
  assert.deepEqual(buildOrderRows(["formacion", "experiencia", "cursos"], keys), [
    { key: "formacion", shown: true }, { key: "experiencia", shown: true }, { key: "cursos", shown: true }
  ]);
  assert.deepEqual(buildOrderRows(["cursos", "nada", "proyectos", "cursos"], keys), [
    { key: "cursos", shown: true }, { key: "formacion", shown: false }, { key: "experiencia", shown: false }
  ]);
  assert.deepEqual(orderFromRows(buildOrderRows([], keys)), []);
  assert.deepEqual(orderFromRows(buildOrderRows(undefined, keys)), []);
});

test("order: moving a section up and down", () => {
  const rows = buildOrderRows(["formacion", "experiencia", "cursos"], ["formacion", "experiencia", "cursos"]);
  assert.equal(moveRow(rows, 2, -1), 1);
  assert.deepEqual(orderFromRows(rows), ["formacion", "cursos", "experiencia"]);
  assert.equal(moveRow(rows, 0, 1), 1);
  assert.deepEqual(orderFromRows(rows), ["cursos", "formacion", "experiencia"]);
  assert.equal(moveRow(rows, 0, -1), -1); // already first
  assert.equal(moveRow(rows, 2, 1), -1); // already last
  assert.deepEqual(orderFromRows(rows), ["cursos", "formacion", "experiencia"]);
});

test("order: hiding a section and showing it again keeps its place", () => {
  const keys = ["formacion", "experiencia", "cursos"];
  const rows = buildOrderRows(keys, keys);
  rows[1].shown = false;
  assert.deepEqual(orderFromRows(rows), ["formacion", "cursos"]);
  moveRow(rows, 2, -1); // cursos goes above the hidden experiencia
  assert.deepEqual(orderFromRows(rows), ["formacion", "cursos"]);
  rows[2].shown = true;
  assert.deepEqual(orderFromRows(rows), ["formacion", "cursos", "experiencia"]);
  // After saving and loading, a hidden section comes back at the end, still hidden
  assert.deepEqual(buildOrderRows(["cursos"], keys), [
    { key: "cursos", shown: true }, { key: "formacion", shown: false }, { key: "experiencia", shown: false }
  ]);
});

test("order: the store saves it, so the sheet and the copies get it", () => {
  const store = createStore({ orden: ["formacion", "experiencia", "cursos"] }, {});
  const rows = buildOrderRows(store.data.orden, ["formacion", "experiencia", "cursos"]);
  let seen = null;
  store.onChange((data) => { seen = data.orden.slice(); });
  store.update((d) => { rows[0].shown = false; d.orden = orderFromRows(rows); });
  assert.deepEqual(seen, ["experiencia", "cursos"]);
});

test("methodology limits: 22 characters of title, 5 steps of 12 characters", () => {
  assert.deepEqual(METHOD_LIMITS, { title: 22, steps: 5, step: 12 });
  // the sample data is within the limits
  assert.ok(SAMPLE_DATA.metodologia.titulo.length <= METHOD_LIMITS.title);
  assert.ok(SAMPLE_DATA.metodologia.pasos.length <= METHOD_LIMITS.steps);
  for (const step of SAMPLE_DATA.metodologia.pasos) assert.ok(step.length <= METHOD_LIMITS.step, step);
});

test("a field with a limit never keeps more characters", () => {
  assert.equal(clampText("¿Mi metodología?", METHOD_LIMITS.title), "¿Mi metodología?");
  assert.equal(clampText("¿Mi forma de trabajar?", METHOD_LIMITS.title), "¿Mi forma de trabajar?"); // 22, just fits
  assert.equal(clampText("¿Mi forma de trabajar hoy?", METHOD_LIMITS.title), "¿Mi forma de trabajar ");
  assert.equal(clampText("Experimentar", METHOD_LIMITS.step), "Experimentar"); // 12
  assert.equal(clampText("Experimentar mucho", METHOD_LIMITS.step), "Experimentar");
  assert.equal(clampText("", 5), "");
  assert.equal(clampText(undefined, 5), "");
  assert.equal(clampText("abc", undefined), "abc"); // no limit
  assert.equal(clampText("abc", 0), "");
});

test("the counter says how many characters are left", () => {
  assert.equal(formatCharsLeft(TEXTS, 22, "¿Mi metodología?"), "Quedan 6 caracteres");
  assert.equal(formatCharsLeft(TEXTS, 22, ""), "Quedan 22 caracteres");
  assert.equal(formatCharsLeft(TEXTS, 12, "Experimenta"), "Queda 1 carácter");
  assert.equal(formatCharsLeft(TEXTS, 12, "Experimentar"), "Quedan 0 caracteres");
  assert.equal(formatCharsLeft(TEXTS, 12, "Experimentar mucho"), "Quedan 0 caracteres"); // never negative
  assert.equal(formatCharsLeft(TEXTS, 5, undefined), "Quedan 5 caracteres");
});

test("steps: the list stops at 5 rows (the form disables the add button there)", () => {
  const steps = ["Escuchar", "Ordenar", "Diseñar", "Ilusionar"];
  const canAdd = () => steps.length < METHOD_LIMITS.steps;
  assert.equal(canAdd(), true);
  addRow(steps, "");
  assert.equal(steps.length, 5);
  assert.equal(canAdd(), false);
  removeRow(steps, 4);
  assert.equal(canAdd(), true);
});

test("every new text of the form exists", () => {
  const keys = [
    "formLanguages", "fieldLanguage", "fieldLevel", "formSkills", "skillsHelp", "fieldGroup", "fieldItems",
    "formOther", "fieldOtherText", "fieldOtherDetail", "formExperience", "fieldCompany", "fieldDate", "fieldRole",
    "fieldDescription", "formEducation", "formCourses", "fieldTitle", "fieldCenter", "fieldSubtitle",
    "formMethod", "fieldMethodTitle", "methodHelp",
    "fieldStep", "stepAdd", "formOrder", "orderHelp", "orderShow", "listFull", "charsLeftMany", "charsLeftOne",
    "sheetFull", "sheetFullAdd"
  ];
  for (const key of keys) assert.equal(typeof TEXTS[key], "string", key);
  assert.ok(TEXTS.charsLeftMany.includes("{n}"));
  assert.ok(TEXTS.listFull.includes("{n}"));
  assert.equal(TEXTS.methodHelp, "Hasta 5 pasos, una fila por paso. Si no hay pasos, el recuadro no sale.");
});
