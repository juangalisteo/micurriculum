/*
 * MiCurriculum · tests for export.js: the title that names the PDF and the
 * decision of asking before exporting when the content does not fit.
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
const { copyFileName } = require("../APP/js/storage.js");
const { pdfTitle, shouldExport } = require("../APP/js/export.js");

const day = new Date(2026, 10, 11);

test("the PDF title follows the name rule of the copies", () => {
  assert.equal(pdfTitle("Ana Ejemplo", day), "CV_ANA_EJEMPLO_20261111");
  assert.equal(pdfTitle("Juan Bautista Galisteo Marqués", day), "CV_JUAN_BAUTISTA_GALISTEO_MARQUES_20261111");
  assert.equal(pdfTitle("  Íñigo   Muñoz-Ávila  ", day), "CV_INIGO_MUNOZ_AVILA_20261111");
  assert.equal(pdfTitle("ÑANDÚ", new Date(2027, 0, 5)), "CV_NANDU_20270105");
  assert.equal(pdfTitle("Ana Ejemplo", day) + ".json", copyFileName("Ana Ejemplo", day));
});

test("the PDF title without a name", () => {
  assert.equal(pdfTitle("", day), "CV_SIN_NOMBRE_20261111");
  assert.equal(pdfTitle("   ", day), "CV_SIN_NOMBRE_20261111");
  assert.equal(pdfTitle(undefined, day), "CV_SIN_NOMBRE_20261111");
});

test("when the content fits, the PDF is made without asking", () => {
  let asked = 0;
  assert.equal(shouldExport(false, () => { asked++; return false; }), true);
  assert.equal(asked, 0);
});

test("when the content does not fit, the user decides", () => {
  let asked = 0;
  assert.equal(shouldExport(true, () => { asked++; return true; }), true);
  assert.equal(shouldExport(true, () => { asked++; return false; }), false);
  assert.equal(asked, 2);
});

test("the export texts are in texts.js", () => {
  assert.equal(TEXTS.pdfExport, "Exportar PDF");
  assert.equal(TEXTS.pdfExportHelp, "En la ventana de imprimir, elige Guardar como PDF. Elige Guardar en PDF, no Microsoft Print to PDF: ese lo guarda como imagen.");
  assert.equal(TEXTS.pdfOverflowConfirm, "El contenido no cabe en una página y se cortará. ¿Exportar igualmente?");
  assert.equal(TEXTS.copyOpen, "Abrir CV.json");
  assert.equal(TEXTS.sampleReset, "Volver al ejemplo (se borran tus datos)");
  assert.equal(TEXTS.sampleResetIcon, "↻");
});
