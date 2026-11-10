/*
 * MiCurriculum · paints the CV on the A4 sheet.
 *
 * buildCvHtml() receives the data and the look and returns the CV HTML,
 * without touching the page (so it can be tested in Node).
 * renderSheet() puts that HTML inside #sheet.
 * It is the "pintar" part of the approved template, with the same result.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* In Node, cleanSvg comes from svg-clean.js; in the browser that file is loaded first. */
if (typeof module !== "undefined" && typeof cleanSvg === "undefined") {
  var cleanSvg = require("./svg-clean.js").cleanSvg;
}

var CV_ICONS = {
  telefono: '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  correo: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  lugar: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  idioma: '<path d="M4 5h9M8.5 3v2M6 5c0 4 3 7 6 8M11 5c0 4-3 7-6 8M13 21l4-10 4 10M14.5 17h5"/>',
  otro: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10h5M13 14h3"/>'
};

/** Escapes text so it is shown as text and never read as HTML. */
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/** Only web, mail and phone links are allowed; anything else is dropped. */
function safeLink(url) {
  var text = String(url == null ? "" : url).trim();
  return /^(https?:|mailto:|tel:)/i.test(text) ? text : "";
}

/**
 * Initials of a Spanish name: first name + first surname.
 * "Juan Bautista Galisteo Marqués" → "JG" (first word and the one before the last).
 * With two words, first and last: "Ana Ejemplo" → "AE".
 */
function getInitials(name) {
  var words = String(name == null ? "" : name).split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  var second = words.length >= 3 ? words[words.length - 2] : words.length === 2 ? words[1] : "";
  return (words[0].charAt(0) + second.charAt(0)).toUpperCase();
}

/**
 * Joins words as in Spanish: "a, b y c". Before a word that sounds like "i"
 * (starts with "i" or "hi") the "y" becomes "e": "conectar e inspirar".
 */
function joinSpanish(words) {
  if (!words.length) return "";
  if (words.length === 1) return words[0];
  var last = words[words.length - 1];
  return words.slice(0, -1).join(", ") + (/^h?i/i.test(last) ? " e " : " y ") + last;
}

function cvIcon(type) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    (CV_ICONS[type] || CV_ICONS.otro) + "</svg>";
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

/** HTML of one section of the main column, or "" when it is empty or unknown. */
function buildSection(key, d, texts) {
  var esc = escapeHtml;
  var timeline = function (items, row) {
    return '<ul class="tl">' + items.map(row).join("") + "</ul>";
  };
  var title = function (t) { return "<h2>" + esc(t) + "</h2>"; };
  var sections = {
    experiencia: function () {
      var items = asList(d.experiencia);
      return items.length && "<section>" + title(texts.cvExperience) + timeline(items, function (e) {
        return '<li><div class="t"><b>' + esc(e.empresa) + '</b><span class="f">' + esc(e.fecha) + "</span></div>" +
          (e.puesto ? '<div class="s">' + esc(e.puesto) + "</div>" : "") +
          (e.descripcion ? "<p>" + esc(e.descripcion) + "</p>" : "") + "</li>";
      }) + "</section>";
    },
    formacion: function () {
      var items = asList(d.formacion);
      return items.length && "<section>" + title(texts.cvEducation) + timeline(items, function (e) {
        return '<li><div class="t"><b>' + esc(e.titulo) + '</b><span class="f">' + esc(e.fecha) + "</span></div>" +
          '<div class="s">' + esc(e.centro) + "</div></li>";
      }) + "</section>";
    },
    cursos: function () {
      var items = asList(d.cursos);
      return items.length && "<section>" + title(texts.cvCourses) + timeline(items, function (e) {
        return '<li><div class="t"><b>' + esc(e.titulo) + '</b><span class="f">' + esc(e.fecha) + "</span></div>" +
          (e.centro ? '<div class="s">' + esc(e.centro) + "</div>" : "") + "</li>";
      }) + "</section>";
    },
    proyectos: function () {
      var items = asList(d.proyectos);
      return items.length && "<section>" + title(texts.cvProjects) + '<div class="proy">' + items.map(function (p) {
        var tags = asList(p.etiquetas);
        return '<div><div class="t"><b>' + esc(p.nombre) + '</b><span class="e">' + esc(p.estado) + "</span></div>" +
          "<p>" + esc(p.descripcion) + "</p>" +
          (tags.length ? '<div class="chips">' + tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" : "") +
          "</div>";
      }).join("") + "</div></section>";
    },
    habilidades: function () {
      var items = asList(d.habilidades);
      return items.length && "<section>" + title(texts.cvSkills) + '<dl class="hab">' + items.map(function (h) {
        return "<dt>" + esc(h.grupo) + "</dt><dd>" + esc(h.items) + "</dd>";
      }).join("") + "</dl></section>";
    }
  };
  return (Object.prototype.hasOwnProperty.call(sections, key) && sections[key]()) || "";
}

/** Inline style with the theme colors, so they apply only to the sheet. */
function buildThemeStyle(theme, font) {
  var vars = {
    "--lateral": theme.lateral, "--lateral-texto": theme.lateralTexto, "--acento": theme.acento,
    "--acento-texto": theme.acentoTexto, "--fondo": theme.fondo, "--titulos": theme.titulos,
    "--texto": theme.texto, "--suave": theme.suave, "--linea": theme.linea, "--letra": font
  };
  return Object.keys(vars).map(function (k) { return k + ":" + vars[k]; }).join(";");
}

/**
 * Returns the HTML of the whole CV.
 * data: same structure as SAMPLE_DATA. look: { tema, formato, letra }.
 * The monogram is the user's own SVG logo, cleaned with cleanSvg() before it is inserted.
 */
function buildCvHtml(data, look, texts, themes, layouts, defaultLook) {
  var esc = escapeHtml;
  var d = data || {};
  var l = look || {};
  var theme = themes[l.tema] || themes[defaultLook.tema];
  var layout = layouts.indexOf(l.formato) >= 0 ? l.formato : defaultLook.formato;
  var font = l.letra || defaultLook.letra;
  var initials = esc(getInitials(d.nombre));
  var mono = d.monograma ? cleanSvg(d.monograma).replace(/^<svg\b/, '<svg class="mono"') : "";

  var contact = asList(d.contacto);
  var languages = asList(d.idiomas);
  var skills = asList(d.habilidades);
  var others = asList(d.otros);
  var photo = d.foto ? safePhoto(d.foto) : "";

  var side = '<aside class="lado">' +
    '<div class="cabeza">' +
      (mono || '<svg class="mono" viewBox="-14 -20 152 144"><text x="62" y="96">' + initials + "</text></svg>") +
      (photo ? '<div class="foto"><img src="' + esc(photo) + '" alt=""></div>' : '<div class="iniciales">' + initials + "</div>") +
    "</div>" +
    '<div><h1 class="nombre">' + esc(d.nombre) + "</h1>" +
      (d.puesto ? '<p class="puesto">' + esc(d.puesto) + "</p>" : "") + '<div class="raya"></div></div>' +
    (d.perfil ? '<div class="perfil"><h3>' + esc(texts.cvProfile) + "</h3>" + String(d.perfil).split(/\n\s*\n/).map(function (t) {
      return "<p>" + esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") + "</p>";
    }).join("") + "</div>" : "") +
    (contact.length ? "<div><h3>" + esc(texts.cvContact) + '</h3><ul class="lista">' + contact.map(function (c) {
      var link = safeLink(c.enlace);
      return "<li>" + cvIcon(c.tipo) + (link ? '<a href="' + esc(link) + '">' + esc(c.texto) + "</a>" : "<span>" + esc(c.texto) + "</span>") + "</li>";
    }).join("") + "</ul></div>" : "") +
    (languages.length ? "<div><h3>" + esc(texts.cvLanguages) + '</h3><ul class="lista">' + languages.map(function (i) {
      return "<li>" + cvIcon("idioma") + "<span>" + esc(i.idioma) + " <small>· " + esc(i.nivel) + "</small></span></li>";
    }).join("") + "</ul></div>" : "") +
    (skills.length ? "<div><h3>" + esc(texts.cvTools) + '</h3><ul class="lista hb">' + skills.map(function (h) {
      return "<li><span><b>" + esc(h.grupo) + "</b><br><small>" + esc(h.items) + "</small></span></li>";
    }).join("") + "</ul></div>" : "") +
    (others.length ? "<div><h3>" + esc(texts.cvOther) + '</h3><ul class="lista">' + others.map(function (o) {
      return "<li>" + cvIcon("otro") + "<span>" + esc(o.texto) + (o.detalle ? " <small>· " + esc(o.detalle) + "</small>" : "") + "</span></li>";
    }).join("") + "</ul></div>" : "") +
    '<p class="pie">' + esc(texts.cvFooter) + "</p>" +
    "</aside>";

  var steps = asList(d.metodologia && d.metodologia.pasos).filter(Boolean);
  var method = steps.length ? '<section class="meto">' + mono +
    '<p class="pluma">' + esc(d.metodologia.titulo) + "</p>" +
    '<p class="frase">' + esc(joinSpanish(steps.map(function (t, i) { return i ? String(t).toLowerCase() : String(t); }))) + ".</p>" +
    "</section>" : "";

  var main = '<main class="main">' + asList(d.orden).map(function (key) { return buildSection(key, d, texts); }).join("") + method + "</main>";

  return '<div class="cv ' + layout + '" style="' + esc(buildThemeStyle(theme, font)) + '">' + side + main + "</div>";
}

/** Photos: a relative path, a web address or an image embedded as data:image. */
function safePhoto(src) {
  var text = String(src).trim();
  if (/^data:image\//i.test(text) || /^https?:/i.test(text)) return text;
  return /^[a-z][a-z0-9+.-]*:/i.test(text) ? "" : text;
}

/** Paints the CV inside #sheet of the given document. */
function renderSheet(doc, data, look) {
  var sheet = doc.getElementById("sheet");
  if (!sheet) return;
  sheet.innerHTML = buildCvHtml(data, look, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);
}

if (typeof module !== "undefined") {
  module.exports = {
    escapeHtml: escapeHtml,
    safeLink: safeLink,
    getInitials: getInitials,
    joinSpanish: joinSpanish,
    buildSection: buildSection,
    buildCvHtml: buildCvHtml,
    renderSheet: renderSheet
  };
}
