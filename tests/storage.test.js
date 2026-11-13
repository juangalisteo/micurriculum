/*
 * MiCurriculum · tests for storage.js (saving in the browser and copy files).
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const SAMPLE_DATA = require("../APP/js/sample-data.js");
const { DEFAULT_LOOK } = require("../APP/js/themes.js");
const {
  STORAGE_KEY, cleanData, cleanMethod, cleanLook, buildCopy, serializeCopy, parseCopy, nameForFile, copyFileName, createSaver
} = require("../APP/js/storage.js");

const day = new Date(2026, 10, 11); // 11 November 2026, local time
const copyText = (datos, extra) => JSON.stringify(Object.assign({ programa: "MiCurriculum", formato: 1, datos, aspecto: DEFAULT_LOOK }, extra));

test("file name: capitals, no accents or spaces, Ñ → N, date at the end", () => {
  assert.equal(copyFileName("Ana Ejemplo", day), "CV_ANA_EJEMPLO_20261111.json");
  assert.equal(copyFileName("Juan Bautista Galisteo Marqués", day), "CV_JUAN_BAUTISTA_GALISTEO_MARQUES_20261111.json");
  assert.equal(copyFileName("  Íñigo   Muñoz-Ávila  ", day), "CV_INIGO_MUNOZ_AVILA_20261111.json");
  assert.equal(copyFileName("María José O'Neill Çelik", day), "CV_MARIA_JOSE_O_NEILL_CELIK_20261111.json");
  assert.equal(copyFileName("ñandú", new Date(2027, 0, 5)), "CV_NANDU_20270105.json");
});

test("file name without a name: CV_SIN_NOMBRE", () => {
  assert.equal(copyFileName("", day), "CV_SIN_NOMBRE_20261111.json");
  assert.equal(copyFileName("   ", day), "CV_SIN_NOMBRE_20261111.json");
  assert.equal(copyFileName(undefined, day), "CV_SIN_NOMBRE_20261111.json");
  assert.equal(nameForFile("¿?"), "SIN_NOMBRE");
});

test("saving and opening a copy gives back the same data and look", () => {
  const look = { tema: "burdeos", formato: "dcha", letra: DEFAULT_LOOK.letra };
  const text = serializeCopy(SAMPLE_DATA, look);
  const copy = JSON.parse(text);
  assert.equal(copy.programa, "MiCurriculum");
  assert.equal(copy.formato, 1);
  assert.deepEqual(Object.keys(copy), ["programa", "formato", "datos", "aspecto"]);
  const result = parseCopy(text);
  assert.equal(result.ok, true);
  assert.deepEqual(result.data, SAMPLE_DATA);
  assert.deepEqual(result.look, look);
});

test("a copy with a photo and a clean logo keeps both", () => {
  const foto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHR8eHRscHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/";
  const monograma = '<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>';
  const data = Object.assign({}, SAMPLE_DATA, { foto, monograma });
  const result = parseCopy(serializeCopy(data, DEFAULT_LOOK));
  assert.equal(result.data.foto, foto);
  assert.equal(result.data.monograma, monograma);
});

test("cleaning: missing fields become empty", () => {
  const result = parseCopy(copyText({ nombre: "Ana" }, { aspecto: undefined }));
  assert.equal(result.ok, true);
  const d = result.data;
  assert.equal(d.nombre, "Ana");
  for (const key of ["puesto", "foto", "monograma", "perfil"]) assert.equal(d[key], "");
  for (const key of ["contacto", "idiomas", "otros", "experiencia", "formacion", "cursos", "proyectos", "habilidades"]) {
    assert.deepEqual(d[key], []);
  }
  assert.deepEqual(d.metodologia, { titulo: "", pasos: [] });
  assert.deepEqual(d.orden, ["formacion", "experiencia", "cursos"]); // no order: the default one
  assert.deepEqual(result.look, DEFAULT_LOOK);
  // a row with missing fields gets them empty; a row that is not an object goes
  const rows = cleanData({ experiencia: [{ empresa: "Tienda" }, "texto suelto", null, 7] }).experiencia;
  assert.deepEqual(rows, [{ empresa: "Tienda", fecha: "", puesto: "", descripcion: "" }]);
});

test("cleaning: unknown fields are dropped and values become texts", () => {
  const d = cleanData({
    nombre: "Ana", edad: 30, secreto: { a: 1 },
    puesto: 42,
    perfil: ["no es texto"],
    contacto: [{ tipo: "web", texto: "ana.es", enlace: "https://ana.es", extra: "x" }, { tipo: "lugar", texto: "Sevilla", enlace: "" }],
    idiomas: [{ idioma: "Inglés", nivel: "B2", nota: "x" }],
    metodologia: { titulo: "T", pasos: ["Uno", 2, null], color: "rojo" }
  });
  assert.equal(d.edad, undefined);
  assert.equal(d.secreto, undefined);
  assert.equal(d.puesto, "42");
  assert.equal(d.perfil, "");
  assert.deepEqual(d.contacto, [{ tipo: "web", texto: "ana.es", enlace: "https://ana.es" }, { tipo: "lugar", texto: "Sevilla" }]);
  assert.deepEqual(d.idiomas, [{ idioma: "Inglés", nivel: "B2" }]);
  assert.deepEqual(d.metodologia, { titulo: "T", pasos: ["Uno", "2", ""] });
  assert.deepEqual(Object.keys(d), Object.keys(SAMPLE_DATA));
  const look = cleanLook({ tema: "nope", formato: "una", letra: "x;background:url(https://example.com)", extra: 1 });
  assert.deepEqual(look, { tema: "marca", formato: "una", letra: DEFAULT_LOOK.letra });
});

test("cleaning: the order keeps only sections that can be edited, each once", () => {
  const d = cleanData({ orden: ["proyectos", "cursos", "habilidades", "nada", "cursos", "experiencia", 3] });
  assert.deepEqual(d.orden, ["cursos", "experiencia"]);
  assert.deepEqual(cleanData({ orden: [] }).orden, []);
  assert.deepEqual(cleanData({ orden: "cursos" }).orden, ["formacion", "experiencia", "cursos"]);
});

test("cleaning: a methodology with more than fits is cut when the copy is opened", () => {
  const long = {
    titulo: "¿Cómo trabajo yo cada día en mis proyectos?",
    pasos: ["Escuchar", "Ordenar con mucho cuidado", "Diseñar", "Ilusionar", "Entregar", "Revisar", "Celebrar"]
  };
  assert.deepEqual(cleanMethod(long), {
    titulo: "¿Cómo trabajo yo cada ",
    pasos: ["Escuchar", "Ordenar con ", "Diseñar", "Ilusionar", "Entregar"]
  });
  assert.equal(cleanMethod(long).titulo.length, 22);
  // through a whole copy
  const result = parseCopy(copyText({ metodologia: long }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.data.metodologia, cleanMethod(long));
  // what fits is not touched; empty rows count as rows
  assert.deepEqual(cleanMethod(SAMPLE_DATA.metodologia), SAMPLE_DATA.metodologia);
  assert.deepEqual(cleanMethod({ titulo: "T", pasos: ["", "", "", "", "", "Seis"] }), { titulo: "T", pasos: ["", "", "", "", ""] });
  assert.deepEqual(cleanMethod({ pasos: "no es lista" }), { titulo: "", pasos: [] });
  assert.deepEqual(cleanMethod(null), { titulo: "", pasos: [] });
});

test("cleaning: the logo goes through svg-clean and the photo must be data:image", () => {
  const d = cleanData({
    monograma: '<svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><path d="M0 0h10"/></svg>',
    foto: "javascript:alert(1)"
  });
  assert.ok(!/script|onload|alert/i.test(d.monograma));
  assert.ok(d.monograma.includes("<path"));
  assert.equal(d.foto, "");
  for (const foto of ["foto.jpg", "https://example.com/a.jpg", "data:text/html;base64,PHA+", "data:image/svg+xml,<svg onload=alert(1)>"]) {
    assert.equal(cleanData({ foto }).foto, "", foto);
  }
  assert.equal(cleanData({ monograma: "no es un svg" }).monograma, "");
});

test("a file that is not a copy is refused", () => {
  const bad = [
    "", "no es json", "{", "null", "[]", "42", '"texto"',
    JSON.stringify({ nombre: "Ana" }),                                        // data without the wrapper
    JSON.stringify({ programa: "OtroPrograma", formato: 1, datos: {} }),
    JSON.stringify({ programa: "MiCurriculum", formato: 1 }),                 // no data
    JSON.stringify({ programa: "MiCurriculum", formato: 1, datos: [] }),
    JSON.stringify({ programa: "MiCurriculum", formato: "1", datos: {} }),
    JSON.stringify({ programa: "MiCurriculum", formato: 0, datos: {} }),
    JSON.stringify({ programa: "MiCurriculum", formato: 1.5, datos: {} })
  ];
  for (const text of bad) assert.deepEqual(parseCopy(text), { ok: false, error: "invalid" }, text);
  assert.deepEqual(parseCopy(undefined), { ok: false, error: "invalid" });
  assert.deepEqual(parseCopy(JSON.stringify({ programa: "MiCurriculum", formato: 2, datos: {} })), { ok: false, error: "newer" });
  // a copy saved with a BOM (some editors add it) is still read
  assert.equal(parseCopy("﻿" + copyText({ nombre: "Ana" })).ok, true);
});

/** A storage like localStorage, kept in memory. blocked: every call fails. */
function fakeStorage(blocked) {
  const items = new Map();
  const guard = () => { if (blocked) throw new Error("blocked"); };
  return {
    items,
    getItem: (k) => { guard(); return items.has(k) ? items.get(k) : null; },
    setItem: (k, v) => { guard(); items.set(k, String(v)); },
    removeItem: (k) => { guard(); items.delete(k); }
  };
}

test("saving in the browser: what is saved is loaded again; nothing saved gives null", () => {
  const storage = fakeStorage(false);
  const saver = createSaver(storage, () => assert.fail("no warning expected"));
  assert.equal(saver.check(), true);
  assert.equal(saver.load(), null);
  const data = Object.assign({}, SAMPLE_DATA, { nombre: "Otra Persona" });
  assert.equal(saver.save(data, DEFAULT_LOOK), true);
  assert.deepEqual(saver.load(), { data, look: DEFAULT_LOOK });
  assert.deepEqual(JSON.parse(storage.items.get(STORAGE_KEY)), buildCopy(data, DEFAULT_LOOK));
  storage.items.set(STORAGE_KEY, "basura");
  assert.equal(saver.load(), null);
});

test("saving in the browser: when it is not allowed, the program goes on and warns once", () => {
  let warnings = 0;
  const saver = createSaver(fakeStorage(true), () => { warnings += 1; });
  assert.equal(saver.check(), false);
  assert.equal(saver.load(), null);
  assert.equal(saver.save(SAMPLE_DATA, DEFAULT_LOOK), false);
  assert.equal(saver.save(SAMPLE_DATA, DEFAULT_LOOK), false);
  assert.equal(warnings, 1);
  // a page without localStorage at all
  let other = 0;
  const none = createSaver({}, () => { other += 1; });
  assert.equal(none.check(), false);
  assert.equal(none.save(SAMPLE_DATA, DEFAULT_LOOK), false);
  assert.equal(other, 1);
});
