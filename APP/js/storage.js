/*
 * MiCurriculum · keeping the data: in the browser and in copy files (.json).
 *
 * Every change is saved in the browser (localStorage) and loaded again
 * when the page opens. "Guardar copia" downloads the data as a .json
 * file; "Abrir copia" reads one back, and "Volver al ejemplo" loads the
 * sample data again.
 *
 * A copy file is { programa: "MiCurriculum", formato: 1, datos, aspecto }.
 * Whatever comes from a file or from the browser goes through cleanData()
 * and cleanLook(): missing fields become empty, unknown fields are dropped,
 * the order keeps only the sections that can be edited, the logo is
 * cleaned with cleanSvg() and the photo is kept only as data:image.
 *
 * Everything above "Browser only" works without the browser and is tested in Node.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* In Node these come from the other files; in the browser they are loaded first. */
if (typeof module !== "undefined") {
  if (typeof cleanSvg === "undefined") var cleanSvg = require("./svg-clean.js").cleanSvg;
  if (typeof MAIN_SECTIONS === "undefined") var MAIN_SECTIONS = require("./render.js").MAIN_SECTIONS;
  if (typeof THEMES === "undefined") {
    var themesModule = require("./themes.js");
    var THEMES = themesModule.THEMES;
    var LAYOUTS = themesModule.LAYOUTS;
    var DEFAULT_LOOK = themesModule.DEFAULT_LOOK;
  }
}

var COPY_PROGRAM = "MiCurriculum";
var COPY_FORMAT = 1;
var STORAGE_KEY = "micurriculum";

/* Biggest copy file accepted, in characters (a photo of 600 px takes about 100 000). */
var COPY_MAX_LENGTH = 5000000;

/* Fields of each list of rows. Anything else in a row is dropped. */
var ROW_FIELDS = {
  idiomas: ["idioma", "nivel"],
  otros: ["texto", "detalle"],
  experiencia: ["empresa", "fecha", "puesto", "descripcion"],
  formacion: ["titulo", "centro", "fecha"],
  cursos: ["titulo", "centro", "fecha"],
  habilidades: ["grupo", "items"]
};

/* ---------- Cleaning ---------- */

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Texts stay as they are, numbers become text, anything else becomes "". */
function cleanText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && isFinite(value)) return String(value);
  return "";
}

/** A list of rows with only the given fields, all of them texts. Rows that are not objects are dropped. */
function cleanRows(list, fields) {
  if (!Array.isArray(list)) return [];
  return list.filter(isPlainObject).map(function (row) {
    var clean = {};
    fields.forEach(function (key) { clean[key] = cleanText(row[key]); });
    return clean;
  });
}

/** Contact rows: type and text; the link only when there is one. */
function cleanContact(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(isPlainObject).map(function (row) {
    var clean = { tipo: cleanText(row.tipo), texto: cleanText(row.texto) };
    var link = cleanText(row.enlace);
    if (link) clean.enlace = link;
    return clean;
  });
}

/** Projects are not in the form of the first version, but a copy that brings them keeps them. */
function cleanProjects(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(isPlainObject).map(function (row) {
    return {
      nombre: cleanText(row.nombre),
      estado: cleanText(row.estado),
      descripcion: cleanText(row.descripcion),
      etiquetas: Array.isArray(row.etiquetas) ? row.etiquetas.map(cleanText).filter(Boolean) : []
    };
  });
}

/**
 * Order of the main column: only sections that can be edited, each once.
 * Without an order (missing or not a list), the default one.
 */
function cleanOrder(order) {
  if (!Array.isArray(order)) return MAIN_SECTIONS.slice();
  var out = [];
  order.forEach(function (key) {
    if (MAIN_SECTIONS.indexOf(key) >= 0 && out.indexOf(key) < 0) out.push(key);
  });
  return out;
}

/** The photo is kept only when it is an image embedded as data:image. */
function cleanPhoto(value) {
  var text = cleanText(value).trim();
  return /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+\/=\s]+$/i.test(text) ? text : "";
}

/** CV data with exactly the fields the program knows. */
function cleanData(raw) {
  var d = isPlainObject(raw) ? raw : {};
  var method = isPlainObject(d.metodologia) ? d.metodologia : {};
  var data = {
    nombre: cleanText(d.nombre),
    puesto: cleanText(d.puesto),
    foto: cleanPhoto(d.foto),
    monograma: d.monograma ? cleanSvg(cleanText(d.monograma)) : "",
    perfil: cleanText(d.perfil),
    contacto: cleanContact(d.contacto)
  };
  data.idiomas = cleanRows(d.idiomas, ROW_FIELDS.idiomas);
  data.otros = cleanRows(d.otros, ROW_FIELDS.otros);
  data.experiencia = cleanRows(d.experiencia, ROW_FIELDS.experiencia);
  data.formacion = cleanRows(d.formacion, ROW_FIELDS.formacion);
  data.cursos = cleanRows(d.cursos, ROW_FIELDS.cursos);
  data.proyectos = cleanProjects(d.proyectos);
  data.habilidades = cleanRows(d.habilidades, ROW_FIELDS.habilidades);
  data.metodologia = {
    titulo: cleanText(method.titulo),
    pasos: Array.isArray(method.pasos) ? method.pasos.map(cleanText) : []
  };
  data.orden = cleanOrder(d.orden);
  return data;
}

/** Look: a known theme and layout; the font is always the one of the template. */
function cleanLook(raw) {
  var l = isPlainObject(raw) ? raw : {};
  return {
    tema: Object.prototype.hasOwnProperty.call(THEMES, l.tema) ? l.tema : DEFAULT_LOOK.tema,
    formato: LAYOUTS.indexOf(l.formato) >= 0 ? l.formato : DEFAULT_LOOK.formato,
    letra: DEFAULT_LOOK.letra
  };
}

/* ---------- Copy files ---------- */

/** The copy object for the data and the look. */
function buildCopy(data, look) {
  return { programa: COPY_PROGRAM, formato: COPY_FORMAT, datos: cleanData(data), aspecto: cleanLook(look) };
}

/** The text of a copy file. */
function serializeCopy(data, look) {
  return JSON.stringify(buildCopy(data, look), null, 2) + "\n";
}

/**
 * Reads the text of a copy file.
 * Returns { ok: true, data, look } or { ok: false, error: "invalid" | "newer" }.
 * "newer": the copy was made by a later version, with a format this one does not know.
 */
function parseCopy(text) {
  if (typeof text !== "string" || !text || text.length > COPY_MAX_LENGTH) return { ok: false, error: "invalid" };
  var copy;
  try {
    copy = JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    return { ok: false, error: "invalid" };
  }
  if (!isPlainObject(copy) || copy.programa !== COPY_PROGRAM || !isPlainObject(copy.datos)) return { ok: false, error: "invalid" };
  if (typeof copy.formato !== "number" || copy.formato < 1 || Math.floor(copy.formato) !== copy.formato) return { ok: false, error: "invalid" };
  if (copy.formato > COPY_FORMAT) return { ok: false, error: "newer" };
  return { ok: true, data: cleanData(copy.datos), look: cleanLook(copy.aspecto) };
}

/** "Juan Bautista Peña" → "JUAN_BAUTISTA_PENA": capitals, no accents or spaces, Ñ → N. */
function nameForFile(name) {
  var text = cleanText(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  return text.replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "SIN_NOMBRE";
}

/** CV_NOMBRE_AAAAMMDD, with the local date of the given day (copies and PDF share it). */
function cvBaseName(name, date) {
  var day = date || new Date();
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var stamp = day.getFullYear() + pad(day.getMonth() + 1) + pad(day.getDate());
  return "CV_" + nameForFile(name) + "_" + stamp;
}

/** CV_NOMBRE_AAAAMMDD.json */
function copyFileName(name, date) {
  return cvBaseName(name, date) + ".json";
}

/* ---------- Saving in the browser ---------- */

/**
 * Saves and loads through a storage object (localStorage, or a fake one in
 * the tests). If the browser does not let the page save, onFail() is called
 * once and the program goes on without saving.
 */
function createSaver(storage, onFail) {
  var warned = false;
  function fail() {
    if (warned) return;
    warned = true;
    if (onFail) onFail();
  }
  return {
    /** Tries a write; false (and the warning) when the browser does not let it. */
    check: function () {
      try {
        storage.setItem(STORAGE_KEY + ".test", "1");
        storage.removeItem(STORAGE_KEY + ".test");
        return true;
      } catch (e) {
        fail();
        return false;
      }
    },
    /** The saved data and look, or null when there is nothing (or nothing valid). */
    load: function () {
      var text;
      try {
        text = storage.getItem(STORAGE_KEY);
      } catch (e) {
        fail();
        return null;
      }
      var result = parseCopy(text);
      return result.ok ? { data: result.data, look: result.look } : null;
    },
    save: function (data, look) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(buildCopy(data, look)));
        return true;
      } catch (e) {
        fail();
        return false;
      }
    }
  };
}

/* ---------- Browser only ---------- */

/** window.localStorage, or null when even reading it fails. */
function getBrowserStorage(win) {
  try {
    return win.localStorage || null;
  } catch (e) {
    return null;
  }
}

/** Shows a message above the sheet until it is closed or another one comes. */
function showNotice(doc, text) {
  var box = doc.getElementById("notice");
  if (!box) return;
  box.querySelector(".notice-text").textContent = text;
  box.hidden = false;
}

function hideNotice(doc) {
  var box = doc.getElementById("notice");
  if (box) box.hidden = true;
}

/** Downloads the copy file of the current data. */
function downloadCopy(doc, win, data, look) {
  var blob = new win.Blob([serializeCopy(data, look)], { type: "application/json" });
  var url = win.URL.createObjectURL(blob);
  var link = doc.createElement("a");
  link.href = url;
  link.download = copyFileName(data && data.nombre, new Date());
  link.hidden = true;
  doc.body.appendChild(link);
  link.click();
  link.remove();
  win.setTimeout(function () { win.URL.revokeObjectURL(url); }, 2000);
}

/**
 * Puts the buttons "Guardar copia", "Abrir CV.json" and "Volver al ejemplo"
 * (an icon) in #actions. replace(data, look) puts new data in the program.
 */
function buildCopyActions(doc, win, state, texts, sample, replace) {
  var host = doc.getElementById("actions");
  if (!host) return;
  host.textContent = "";
  var button = function (text, quiet) {
    var b = doc.createElement("button");
    b.type = "button";
    b.className = quiet ? "button button-quiet" : "button";
    b.textContent = text;
    return b;
  };

  var save = button(texts.copySave, false);
  save.setAttribute("aria-describedby", "copies-help");
  save.addEventListener("click", function () {
    hideNotice(doc);
    downloadCopy(doc, win, state.data, state.look);
  });

  var input = doc.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.className = "visually-hidden";
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  var open = button(texts.copyOpen, true);
  open.addEventListener("click", function () { input.click(); });
  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    input.value = ""; // the same file can be chosen again
    if (!file) return;
    hideNotice(doc);
    if (file.size > COPY_MAX_LENGTH) { showNotice(doc, texts.copyInvalid); return; }
    var reader = new win.FileReader();
    reader.onerror = function () { showNotice(doc, texts.copyReadError); };
    reader.onload = function () {
      var result = parseCopy(String(reader.result));
      if (!result.ok) {
        showNotice(doc, result.error === "newer" ? texts.copyNewer : texts.copyInvalid);
        return;
      }
      if (!win.confirm(texts.copyOpenConfirm)) return;
      replace(result.data, result.look);
    };
    reader.readAsText(file);
  });

  var reset = button(texts.sampleResetIcon, true);
  reset.className += " button-icon";
  reset.title = texts.sampleReset;
  reset.setAttribute("aria-label", texts.sampleReset);
  reset.addEventListener("click", function () {
    if (!win.confirm(texts.sampleResetConfirm)) return;
    hideNotice(doc);
    replace(sample.data, sample.look);
  });

  var help = doc.createElement("span");
  help.className = "actions-help";
  help.id = "copies-help";
  help.textContent = texts.copiesHelp;

  host.appendChild(help);
  host.appendChild(save);
  host.appendChild(open);
  host.appendChild(input);
  host.appendChild(reset);
}

if (typeof module !== "undefined") {
  module.exports = {
    COPY_PROGRAM: COPY_PROGRAM,
    COPY_FORMAT: COPY_FORMAT,
    STORAGE_KEY: STORAGE_KEY,
    cleanData: cleanData,
    cleanLook: cleanLook,
    cleanOrder: cleanOrder,
    cleanPhoto: cleanPhoto,
    buildCopy: buildCopy,
    serializeCopy: serializeCopy,
    parseCopy: parseCopy,
    nameForFile: nameForFile,
    cvBaseName: cvBaseName,
    copyFileName: copyFileName,
    createSaver: createSaver
  };
}
