/*
 * MiCurriculum · the form on the left panel.
 *
 * One folding section (<details>) per block of the CV, in the order it is
 * printed: personal data, profile, contact, languages, tools, other data,
 * the main column sections and the methodology. Every change goes through
 * STATE.update(), so the sheet is painted again at once. createListEditor()
 * is the reusable piece for every list of rows.
 *
 * buildContactLink(), fitImageSize(), the tag and row helpers and
 * orderMainSections() do not need the browser and are tested in Node.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* Contact types, in the order they are offered. */
var CONTACT_TYPES = ["lugar", "telefono", "web", "github", "correo", "linkedin"];

/* Longest side of the photo kept in the data, in pixels. */
var PHOTO_MAX_SIDE = 600;
var PHOTO_QUALITY = 0.85;

/* ---------- Parts that do not need the browser ---------- */

/**
 * Builds the link of a contact row from its type and text.
 * lugar → no link; telefono → tel:+34600…; correo → mailto:…;
 * web, github, linkedin → https://… (a bare user name is completed:
 * "ana" → https://github.com/ana). Returns "" when there is no valid link.
 */
function buildContactLink(type, text) {
  var t = String(text == null ? "" : text).trim();
  if (!t) return "";
  if (type === "lugar") return "";
  if (type === "telefono") {
    var phone = t.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    return /\d/.test(phone) ? "tel:" + phone : "";
  }
  if (type === "correo") {
    var mail = t.replace(/^mailto:/i, "");
    return /^[^\s@]+@[^\s@]+$/.test(mail) ? "mailto:" + mail : "";
  }
  if (type === "web" || type === "github" || type === "linkedin") {
    if (/\s/.test(t)) return "";
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return ""; // another kind of link: not allowed
    var bare = t.replace(/^\/+/, "").replace(/^@/, "");
    if (!bare) return "";
    if (bare.indexOf(".") < 0 && bare.indexOf("/") < 0) {
      if (type === "github") return "https://github.com/" + bare;
      if (type === "linkedin") return "https://www.linkedin.com/in/" + bare;
    }
    return "https://" + bare;
  }
  return "";
}

/** Size of the photo so its longest side is at most max. Never makes it bigger. */
function fitImageSize(width, height, max) {
  var w = Math.max(1, Math.round(width) || 1);
  var h = Math.max(1, Math.round(height) || 1);
  var longest = Math.max(w, h);
  if (longest <= max) return { width: w, height: h };
  var scale = max / longest;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Sets or removes the link of a contact row after its type or text changes. */
function updateContactLink(row) {
  var link = buildContactLink(row.tipo, row.texto);
  if (link) row.enlace = link;
  else delete row.enlace;
}

/** "a, b,, c " → ["a", "b", "c"]: the project tags typed in one field. */
function parseTags(text) {
  return String(text == null ? "" : text).split(",").map(function (t) { return t.trim(); }).filter(Boolean);
}

/** ["a", "b"] → "a, b": the tags shown in their field. */
function formatTags(tags) {
  return Array.isArray(tags) ? tags.join(", ") : String(tags == null ? "" : tags);
}

/**
 * The text shown in the field of a row. A field without key is a row that
 * is only a text (a methodology step). field.format turns the stored value
 * into text (tags).
 */
function getRowValue(item, field) {
  var value = field.key == null ? item : item == null ? undefined : item[field.key];
  if (field.format) return field.format(value);
  return value == null ? "" : String(value);
}

/** Stores the text of a field in the row at index. field.parse turns it back (tags). */
function setRowValue(list, index, field, text) {
  if (index < 0 || index >= list.length) return false;
  var value = field.parse ? field.parse(text) : text;
  if (field.key == null) list[index] = value;
  else list[index][field.key] = value;
  return true;
}

/* ---------- Small helpers for the page ---------- */

var formIdCount = 0;

function newFieldId(prefix) {
  formIdCount += 1;
  return prefix + "-" + formIdCount;
}

/** Creates an element with attributes and text. */
function el(doc, tag, attrs, text) {
  var node = doc.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function (k) {
      if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
    });
  }
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A folding section of the form. */
function buildFormSection(doc, title, open) {
  var details = el(doc, "details", { class: "form-section", open: open ? "" : null });
  details.appendChild(el(doc, "summary", null, title));
  var body = el(doc, "div", { class: "form-body" });
  details.appendChild(body);
  return { element: details, body: body };
}

/**
 * A text field with its label. kind: "text" or "textarea".
 * onInput(value) is called on every key.
 */
function buildTextField(doc, opts) {
  var id = newFieldId("f");
  var wrap = el(doc, "div", { class: "field" });
  wrap.appendChild(el(doc, "label", { for: id }, opts.label));
  var input = opts.kind === "textarea"
    ? el(doc, "textarea", { id: id, rows: opts.rows || 6 })
    : el(doc, "input", { id: id, type: "text", autocomplete: opts.autocomplete || "off" });
  input.value = opts.value || "";
  var helpId = opts.help ? id + "-help" : null;
  if (helpId) input.setAttribute("aria-describedby", helpId);
  input.addEventListener("input", function () { opts.onInput(input.value); });
  wrap.appendChild(input);
  if (opts.help) wrap.appendChild(el(doc, "p", { class: "help", id: helpId }, opts.help));
  return wrap;
}

/**
 * A file picker shown as a button (its <label>), a remove button and a
 * status line. onFile(file, setStatus) reads the file; onRemove() clears it.
 */
function buildFilePicker(doc, opts) {
  var id = newFieldId("file");
  var wrap = el(doc, "div", { class: "field" });
  wrap.appendChild(el(doc, "span", { class: "field-title", id: id + "-title" }, opts.title));
  var row = el(doc, "div", { class: "file-row" });
  var input = el(doc, "input", { id: id, type: "file", accept: opts.accept, class: "visually-hidden" });
  var pick = el(doc, "label", { for: id, class: "button" }, opts.chooseText);
  var remove = el(doc, "button", { type: "button", class: "button button-quiet" }, opts.removeText);
  var status = el(doc, "p", { class: "help", role: "status", "aria-live": "polite" });
  row.appendChild(input);
  row.appendChild(pick);
  row.appendChild(remove);
  wrap.appendChild(row);
  wrap.appendChild(status);

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle("help-error", !!isError);
  }
  function refresh() {
    var has = opts.hasValue();
    remove.disabled = !has;
    setStatus(has ? opts.setText : opts.noneText, false);
  }

  input.addEventListener("change", function () {
    var file = input.files && input.files[0];
    input.value = ""; // the same file can be chosen again
    if (!file) return;
    opts.onFile(file, function (error) {
      if (error) setStatus(error, true);
      else refresh();
    }, setStatus);
  });
  remove.addEventListener("click", function () {
    opts.onRemove();
    refresh();
    pick.focus();
  });
  refresh();
  return wrap;
}

/* ---------- Reading files (browser only) ---------- */

/** Reads an image file, makes it smaller and returns it as data:image/jpeg. */
function readPhotoFile(file, done) {
  if (!/^image\//.test(file.type || "")) { done(new Error("not an image")); return; }
  var reader = new FileReader();
  reader.onerror = function () { done(new Error("read failed")); };
  reader.onload = function () {
    var img = new Image();
    img.onerror = function () { done(new Error("decode failed")); };
    img.onload = function () {
      var size = fitImageSize(img.naturalWidth, img.naturalHeight, PHOTO_MAX_SIDE);
      var canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF"; // JPEG has no transparency: white behind it
      ctx.fillRect(0, 0, size.width, size.height);
      ctx.drawImage(img, 0, 0, size.width, size.height);
      done(null, canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/** Reads an .svg file and returns it already cleaned, or an error. */
function readLogoFile(file, done) {
  var looksSvg = /\.svg$/i.test(file.name || "") || file.type === "image/svg+xml";
  if (!looksSvg) { done(new Error("not svg")); return; }
  var reader = new FileReader();
  reader.onerror = function () { done(new Error("read failed")); };
  reader.onload = function () {
    var clean = cleanSvg(reader.result);
    if (clean) done(null, clean);
    else done(new Error("no svg"));
  };
  reader.readAsText(file);
}

/* ---------- Reusable list of rows ---------- */

/**
 * Editor for a list of rows (contact, experience, courses, steps…).
 * opts:
 *   getList()          the array in STATE.data (created if missing)
 *   fields             [{ key, label, kind: "text" | "textarea" | "select",
 *                         options: [{ value, label }], format, parse }]
 *                      key null = the row is only a text (methodology steps)
 *   stacked            true: the fields go one under the other, with their
 *                      labels in sight (rows with many fields)
 *   newItem()          a new empty row
 *   onRowChange(row)   optional, after a field of a row changes
 *   addText            text of the add button
 *   update(fn)         how to change the data (STATE.update)
 *   texts              TEXTS
 */
function createListEditor(doc, opts) {
  var texts = opts.texts;
  var root = el(doc, "div", { class: opts.stacked ? "rows rows-stacked" : "rows" });
  var list = el(doc, "ol", { class: "rows-list" });
  var empty = el(doc, "p", { class: "help" }, texts.listEmpty);
  var add = el(doc, "button", { type: "button", class: "button" }, opts.addText || texts.rowAdd);
  root.appendChild(list);
  root.appendChild(empty);
  root.appendChild(add);

  function rowLabel(text, index) {
    return text + " (" + texts.rowNumber + " " + (index + 1) + ")";
  }

  function buildField(item, index, field) {
    var id = newFieldId("row");
    var wrap = el(doc, "div", { class: "row-field row-field-" + (field.kind || "text") });
    // Stacked rows show the label; short rows keep it for screen readers only.
    var label = el(doc, "label", { for: id, class: opts.stacked ? "row-label" : "visually-hidden" }, opts.stacked ? field.label : rowLabel(field.label, index));
    if (opts.stacked) label.appendChild(el(doc, "span", { class: "visually-hidden" }, " (" + texts.rowNumber + " " + (index + 1) + ")"));
    wrap.appendChild(label);
    var input;
    if (field.kind === "select") {
      input = el(doc, "select", { id: id });
      field.options.forEach(function (o) { input.appendChild(el(doc, "option", { value: o.value }, o.label)); });
      input.value = getRowValue(item, field) || field.options[0].value;
    } else if (field.kind === "textarea") {
      input = el(doc, "textarea", { id: id, rows: field.rows || 3 });
      input.value = getRowValue(item, field);
    } else {
      input = el(doc, "input", { id: id, type: "text", autocomplete: "off" });
      input.value = getRowValue(item, field);
    }
    var helpId = field.help ? id + "-help" : null;
    if (helpId) input.setAttribute("aria-describedby", helpId);
    input.addEventListener(field.kind === "select" ? "change" : "input", function () {
      opts.update(function () {
        var items = opts.getList();
        if (!setRowValue(items, index, field, input.value)) return;
        if (opts.onRowChange) opts.onRowChange(items[index]);
      });
    });
    wrap.appendChild(input);
    if (field.help) wrap.appendChild(el(doc, "p", { class: "help", id: helpId }, field.help));
    return wrap;
  }

  function buildButton(text, index, action, disabled) {
    var button = el(doc, "button", {
      type: "button", class: "icon-button", "data-action": action,
      "aria-label": rowLabel(text, index), title: text, disabled: disabled ? "" : null
    }, { up: "↑", down: "↓", remove: "×" }[action]);
    button.addEventListener("click", function () { act(action, index); });
    return button;
  }

  /** Runs a row action and keeps the focus on a sensible button. */
  function act(action, index) {
    var focusIndex = index;
    var focusAction = action;
    opts.update(function () {
      var items = opts.getList();
      if (action === "up" || action === "down") {
        var to = moveRow(items, index, action === "up" ? -1 : 1);
        if (to >= 0) focusIndex = to;
      } else if (action === "remove") {
        removeRow(items, index);
        focusIndex = Math.min(index, items.length - 1);
      } else if (action === "add") {
        focusIndex = addRow(items, opts.newItem());
      }
    });
    refresh();
    var rows = list.children;
    if (focusIndex < 0 || !rows[focusIndex]) { add.focus(); return; }
    if (action === "add") {
      var first = rows[focusIndex].querySelector("input, select, textarea");
      if (first) first.focus();
      return;
    }
    var target = rows[focusIndex].querySelector('[data-action="' + focusAction + '"]');
    if (!target || target.disabled) target = rows[focusIndex].querySelector("button:not([disabled])");
    if (target) target.focus();
  }

  function refresh() {
    var items = opts.getList();
    list.textContent = "";
    items.forEach(function (item, index) {
      var li = el(doc, "li", { class: "row" });
      var fields = el(doc, "div", { class: "row-fields" });
      opts.fields.forEach(function (field) { fields.appendChild(buildField(item, index, field)); });
      var buttons = el(doc, "div", { class: "row-buttons" });
      buttons.appendChild(buildButton(texts.rowUp, index, "up", index === 0));
      buttons.appendChild(buildButton(texts.rowDown, index, "down", index === items.length - 1));
      buttons.appendChild(buildButton(texts.rowRemove, index, "remove", false));
      li.appendChild(fields);
      li.appendChild(buttons);
      list.appendChild(li);
    });
    empty.hidden = items.length > 0;
  }

  add.addEventListener("click", function () { act("add", -1); });
  refresh();
  return { element: root, refresh: refresh };
}

/* ---------- The whole form ---------- */

/** Builds the form inside #form. state is the store from state.js. */
function buildForm(doc, state, texts) {
  var host = doc.getElementById("form");
  if (!host) return;
  host.textContent = "";
  var data = function () { return state.data; };
  var set = function (key) {
    return function (value) { state.update(function (d) { d[key] = value; }); };
  };

  // Personal data
  var personal = buildFormSection(doc, texts.formPersonal, true);
  personal.body.appendChild(buildTextField(doc, {
    label: texts.fieldName, value: data().nombre, autocomplete: "name", onInput: set("nombre")
  }));
  personal.body.appendChild(buildTextField(doc, {
    label: texts.fieldJob, value: data().puesto, help: texts.fieldJobHelp, autocomplete: "organization-title", onInput: set("puesto")
  }));
  personal.body.appendChild(buildFilePicker(doc, {
    title: texts.fieldPhoto, accept: "image/*", chooseText: texts.photoChoose, removeText: texts.photoRemove,
    setText: texts.photoSet, noneText: texts.photoNone,
    hasValue: function () { return !!data().foto; },
    onFile: function (file, finish, setStatus) {
      setStatus(texts.photoBusy);
      readPhotoFile(file, function (error, url) {
        if (error) { finish(texts.photoError); return; }
        set("foto")(url);
        finish();
      });
    },
    onRemove: function () { set("foto")(""); }
  }));
  personal.body.appendChild(buildFilePicker(doc, {
    title: texts.fieldLogo, accept: ".svg,image/svg+xml", chooseText: texts.logoChoose, removeText: texts.logoRemove,
    setText: texts.logoSet, noneText: texts.logoNone,
    hasValue: function () { return !!data().monograma; },
    onFile: function (file, finish) {
      readLogoFile(file, function (error, svg) {
        if (error) { finish(texts.logoError); return; }
        set("monograma")(svg);
        finish();
      });
    },
    onRemove: function () { set("monograma")(""); }
  }));
  host.appendChild(personal.element);

  // Profile
  var profile = buildFormSection(doc, texts.formProfile, false);
  profile.body.appendChild(buildTextField(doc, {
    kind: "textarea", rows: 10, label: texts.fieldProfile, value: data().perfil, help: texts.profileHelp, onInput: set("perfil")
  }));
  host.appendChild(profile.element);

  // Contact
  var contact = buildFormSection(doc, texts.formContact, false);
  var contactEditor = createListEditor(doc, {
    texts: texts,
    update: state.update,
    getList: function () {
      if (!Array.isArray(state.data.contacto)) state.data.contacto = [];
      return state.data.contacto;
    },
    fields: [
      { key: "tipo", label: texts.rowType, kind: "select", options: CONTACT_TYPES.map(function (t) {
        return { value: t, label: texts.contactTypes[t] };
      }) },
      { key: "texto", label: texts.rowText, kind: "text" }
    ],
    newItem: function () { return { tipo: "web", texto: "" }; },
    onRowChange: updateContactLink
  });
  contact.body.appendChild(contactEditor.element);
  host.appendChild(contact.element);

  /** A folding section with a list of rows of state.data[key]. */
  function addListSection(title, key, opts) {
    var section = buildFormSection(doc, title, false);
    if (opts.help) section.body.appendChild(el(doc, "p", { class: "help section-help" }, opts.help));
    var editor = createListEditor(doc, {
      texts: texts,
      update: state.update,
      stacked: opts.stacked,
      getList: opts.getList || function () {
        if (!Array.isArray(state.data[key])) state.data[key] = [];
        return state.data[key];
      },
      fields: opts.fields,
      newItem: opts.newItem,
      addText: opts.addText
    });
    section.body.appendChild(editor.element);
    host.appendChild(section.element);
    return section;
  }
  var text = function (key, label, extra) {
    return Object.assign({ key: key, label: label, kind: "text" }, extra || {});
  };

  // Side column, in the order it is printed
  addListSection(texts.formLanguages, "idiomas", {
    fields: [text("idioma", texts.fieldLanguage), text("nivel", texts.fieldLevel)],
    newItem: function () { return { idioma: "", nivel: "" }; }
  });
  addListSection(texts.formSkills, "habilidades", {
    help: texts.skillsHelp, stacked: true,
    fields: [text("grupo", texts.fieldGroup), text("items", texts.fieldItems)],
    newItem: function () { return { grupo: "", items: "" }; }
  });
  addListSection(texts.formOther, "otros", {
    fields: [text("texto", texts.fieldOtherText), text("detalle", texts.fieldOtherDetail)],
    newItem: function () { return { texto: "", detalle: "" }; }
  });

  // Main column: the sections follow the order of the CV (data.orden)
  var mainSections = {
    experiencia: function () {
      addListSection(texts.formExperience, "experiencia", {
        stacked: true,
        fields: [
          text("empresa", texts.fieldCompany), text("fecha", texts.fieldDate), text("puesto", texts.fieldRole),
          text("descripcion", texts.fieldDescription, { kind: "textarea" })
        ],
        newItem: function () { return { empresa: "", fecha: "", puesto: "", descripcion: "" }; }
      });
    },
    formacion: function () {
      addListSection(texts.formEducation, "formacion", {
        stacked: true,
        fields: [text("titulo", texts.fieldTitle), text("centro", texts.fieldCenter), text("fecha", texts.fieldDate)],
        newItem: function () { return { titulo: "", centro: "", fecha: "" }; }
      });
    },
    cursos: function () {
      addListSection(texts.formCourses, "cursos", {
        stacked: true,
        fields: [text("titulo", texts.fieldTitle), text("centro", texts.fieldCenter), text("fecha", texts.fieldDate)],
        newItem: function () { return { titulo: "", centro: "", fecha: "" }; }
      });
    },
    proyectos: function () {
      addListSection(texts.formProjects, "proyectos", {
        stacked: true,
        fields: [
          text("nombre", texts.fieldProjectName), text("estado", texts.fieldStatus),
          text("descripcion", texts.fieldDescription, { kind: "textarea" }),
          text("etiquetas", texts.fieldTags, { help: texts.tagsHelp, format: formatTags, parse: parseTags })
        ],
        newItem: function () { return { nombre: "", estado: "", descripcion: "", etiquetas: [] }; }
      });
    }
  };
  orderMainSections(Object.keys(mainSections), data().orden).forEach(function (key) { mainSections[key](); });

  // Methodology: a title and one row per step
  var getMethod = function () {
    var m = state.data.metodologia;
    if (!m || typeof m !== "object") m = state.data.metodologia = { titulo: "", pasos: [] };
    if (!Array.isArray(m.pasos)) m.pasos = [];
    return m;
  };
  var method = addListSection(texts.formMethod, null, {
    help: texts.methodHelp,
    getList: function () { return getMethod().pasos; },
    fields: [{ key: null, label: texts.fieldStep, kind: "text" }],
    newItem: function () { return ""; },
    addText: texts.stepAdd
  });
  method.body.insertBefore(buildTextField(doc, {
    label: texts.fieldMethodTitle, value: getMethod().titulo,
    onInput: function (value) { state.update(function () { getMethod().titulo = value; }); }
  }), method.body.firstChild);
}

/**
 * Keys of the main column in the order of the CV: first those in order,
 * then the rest as they come.
 */
function orderMainSections(keys, order) {
  var list = Array.isArray(order) ? order : [];
  var pos = function (k) { var i = list.indexOf(k); return i < 0 ? list.length + keys.indexOf(k) : i; };
  return keys.slice().sort(function (a, b) { return pos(a) - pos(b); });
}

if (typeof module !== "undefined") {
  module.exports = {
    CONTACT_TYPES: CONTACT_TYPES,
    buildContactLink: buildContactLink,
    fitImageSize: fitImageSize,
    updateContactLink: updateContactLink,
    parseTags: parseTags,
    formatTags: formatTags,
    getRowValue: getRowValue,
    setRowValue: setRowValue,
    orderMainSections: orderMainSections
  };
}
