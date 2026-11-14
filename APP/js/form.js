/*
 * MiCurriculum · the form on the left panel.
 *
 * One folding section (<details>) per block of the CV, in the order it is
 * printed: personal data, profile, contact, languages, tools, other data,
 * the order of the main column, its sections (in that order) and the
 * methodology. Every change goes through
 * STATE.update(), so the sheet is painted again at once. createListEditor()
 * is the reusable piece for every list of rows.
 *
 * Content limit: when STATE.update() refuses a change (the content would
 * go further past the sheet than before, see fit.js), the field goes back
 * to its last accepted text with the cursor where it was, or the row that
 * was added or moved is put back, and a short notice shows next to it for
 * a few seconds. setSheetFull() disables the "add row" buttons of the
 * columns that have no room for one more row.
 *
 * buildContactLink(), fitImageSize(), the tag and row helpers,
 * buildOrderRows(), orderFromRows(), clampText() and formatCharsLeft() do
 * not need the browser and are tested in Node.
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

/* In Node, the methodology limits come from render.js; in the browser that file is loaded first. */
if (typeof module !== "undefined" && typeof METHOD_LIMITS === "undefined") {
  var METHOD_LIMITS = require("./render.js").METHOD_LIMITS;
}

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

/** "a, b,, c " → ["a", "b", "c"]: tags typed in one field (projects, not in the form yet). */
function parseTags(text) {
  return String(text == null ? "" : text).split(",").map(function (t) { return t.trim(); }).filter(Boolean);
}

/** ["a", "b"] → "a, b": the tags shown in their field. */
function formatTags(tags) {
  return Array.isArray(tags) ? tags.join(", ") : String(tags == null ? "" : tags);
}

/** The text cut to max characters (a field with a limit never keeps more). */
function clampText(value, max) {
  var text = String(value == null ? "" : value);
  var limit = Number(max);
  return isFinite(limit) && limit >= 0 && text.length > limit ? text.slice(0, limit) : text;
}

/** "Quedan 7 caracteres" / "Queda 1 carácter": what is left of a limit for the given text. */
function formatCharsLeft(texts, max, value) {
  var left = Math.max(0, Number(max) - String(value == null ? "" : value).length);
  return left === 1 ? texts.charsLeftOne : texts.charsLeftMany.replace("{n}", String(left));
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

/* ---------- Notice of the content limit ---------- */

/* How long the notice stays, unless another change comes first. */
var FULL_NOTICE_MS = 4000;

/* The notice showing now: { element, view, timer }. Only one at a time. */
var fullNotice = null;

/* Which columns of the sheet have no room for one more row (setSheetFull). */
var SHEET_FULL = { lado: false, main: false };

/* The "add row" buttons that follow SHEET_FULL: their refresh functions. */
var fullWatchers = [];

/** The hidden notice element put after a field or a list. */
function fullNoticeElement(doc) {
  return el(doc, "p", { class: "help help-error full-notice", role: "alert", hidden: "" });
}

/** Shows the notice of the content limit in element, and hides it after a few seconds. */
function showFullNotice(doc, element, texts) {
  hideFullNotice();
  var view = doc.defaultView;
  element.textContent = texts.sheetFull;
  element.hidden = false;
  fullNotice = { element: element, view: view, timer: view.setTimeout(hideFullNotice, FULL_NOTICE_MS) };
}

/** Hides the notice showing now, if any (another change was made, or the time passed). */
function hideFullNotice() {
  if (!fullNotice) return;
  fullNotice.view.clearTimeout(fullNotice.timer);
  fullNotice.element.hidden = true;
  fullNotice = null;
}

/**
 * Tells the form which columns are full ({ lado, main }, from fit.js):
 * the "add row" buttons of those columns are disabled, with the text
 * "La hoja está llena" on hover, until there is room again.
 */
function setSheetFull(doc, full) {
  SHEET_FULL = { lado: !!(full && full.lado), main: !!(full && full.main) };
  fullWatchers.forEach(function (refresh) { refresh(); });
}

/**
 * Joins a field to the data. apply(value) stores the value and returns
 * false when the change was refused (the content limit): then the field
 * goes back to its last accepted text, with the cursor where it was, and
 * the notice shows. A limit (limitField) reads and cuts the value first.
 * A <select> is read on change, the rest on every key.
 */
function bindInput(doc, input, texts, limit, notice, apply) {
  var accepted = input.value;
  var selection = null;
  var isSelect = input.tagName === "SELECT";
  if (!isSelect) {
    // Before each edit, where the cursor is: the place it goes back to when the edit is undone.
    input.addEventListener("beforeinput", function () {
      selection = [input.selectionStart, input.selectionEnd];
    });
  }
  input.addEventListener(isSelect ? "change" : "input", function () {
    hideFullNotice();
    var value = limit ? limit.read() : input.value;
    if (apply(value) === false) {
      input.value = accepted;
      if (limit) limit.read();
      if (selection && typeof input.setSelectionRange === "function") input.setSelectionRange(selection[0], selection[1]);
      showFullNotice(doc, notice, texts);
      return;
    }
    accepted = value;
  });
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
 * Puts a limit of characters on a field: the browser does not let the user
 * type more, a line under it says how many are left, and the value is cut
 * if something longer still gets in. Returns the function that reads the
 * value, already cut.
 */
function limitField(doc, input, max, texts) {
  input.setAttribute("maxlength", max);
  var counter = el(doc, "p", { class: "help chars-left", id: input.id + "-left" });
  var describedBy = input.getAttribute("aria-describedby");
  input.setAttribute("aria-describedby", (describedBy ? describedBy + " " : "") + counter.id);
  var read = function () {
    var value = clampText(input.value, max);
    if (value !== input.value) input.value = value;
    counter.textContent = formatCharsLeft(texts, max, value);
    return value;
  };
  read();
  return { counter: counter, read: read };
}

/**
 * A text field with its label. kind: "text" or "textarea".
 * onInput(value) is called on every key; when it returns false the field
 * goes back (bindInput). maxLength (with texts) puts a limit of characters
 * with its counter.
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
  var limit = opts.maxLength ? limitField(doc, input, opts.maxLength, opts.texts) : null;
  var notice = fullNoticeElement(doc);
  bindInput(doc, input, opts.texts, limit, notice, opts.onInput);
  wrap.appendChild(input);
  if (opts.help) wrap.appendChild(el(doc, "p", { class: "help", id: helpId }, opts.help));
  if (limit) wrap.appendChild(limit.counter);
  wrap.appendChild(notice);
  return wrap;
}

/**
 * A file picker shown as a button (its <label>), a remove button and a
 * status line. onFile(file, finish, setStatus, refused) reads the file:
 * finish(error) ends it (with the message of a failure), refused() shows
 * the notice of the content limit. onRemove() clears the file.
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
  var notice = fullNoticeElement(doc);
  row.appendChild(input);
  row.appendChild(pick);
  row.appendChild(remove);
  wrap.appendChild(row);
  wrap.appendChild(status);
  wrap.appendChild(notice);

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
    hideFullNotice();
    opts.onFile(file, function (error) {
      if (error) setStatus(error, true);
      else refresh();
    }, setStatus, function () { showFullNotice(doc, notice, opts.texts); });
  });
  remove.addEventListener("click", function () {
    hideFullNotice();
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
 *   column             "lado" or "main": the column of the sheet the rows
 *                      go to; the add button is disabled while that column
 *                      is full (setSheetFull). Without it, never
 *   getList()          the array in STATE.data (created if missing)
 *   fields             [{ key, label, kind: "text" | "textarea" | "select",
 *                         options: [{ value, label }], format, parse, maxLength }]
 *                      key null = the row is only a text (methodology steps)
 *                      maxLength = limit of characters, with its counter
 *   stacked            true: the fields go one under the other, with their
 *                      labels in sight (rows with many fields)
 *   newItem()          a new empty row
 *   onRowChange(row)   optional, after a field of a row changes
 *   addText            text of the add button
 *   maxRows            optional, most rows allowed: the add button is
 *                      disabled when the list reaches it
 *   update(fn)         how to change the data (STATE.update); false when
 *                      the change was refused (the content limit)
 *   texts              TEXTS
 */
function createListEditor(doc, opts) {
  var texts = opts.texts;
  var root = el(doc, "div", { class: opts.stacked ? "rows rows-stacked" : "rows" });
  var list = el(doc, "ol", { class: "rows-list" });
  var empty = el(doc, "p", { class: "help" }, texts.listEmpty);
  var add = el(doc, "button", { type: "button", class: "button rows-add", "data-column": opts.column || null }, opts.addText || texts.rowAdd);
  var notice = fullNoticeElement(doc);
  root.appendChild(list);
  root.appendChild(empty);
  root.appendChild(add);
  root.appendChild(notice);

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
    var limit = field.maxLength && field.kind !== "select" ? limitField(doc, input, field.maxLength, texts) : null;
    var fieldNotice = fullNoticeElement(doc);
    bindInput(doc, input, texts, limit, fieldNotice, function (value) {
      return opts.update(function () {
        var items = opts.getList();
        if (!setRowValue(items, index, field, value)) return;
        if (opts.onRowChange) opts.onRowChange(items[index]);
      });
    });
    wrap.appendChild(input);
    if (field.help) wrap.appendChild(el(doc, "p", { class: "help", id: helpId }, field.help));
    if (limit) wrap.appendChild(limit.counter);
    wrap.appendChild(fieldNotice);
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

  /**
   * Runs a row action and keeps the focus on a sensible button. When the
   * change is refused (the content limit), the list stays as it was and
   * the notice shows under it.
   */
  function act(action, index) {
    var focusIndex = index;
    var focusAction = action;
    hideFullNotice();
    var accepted = opts.update(function () {
      var items = opts.getList();
      if (action === "up" || action === "down") {
        var to = moveRow(items, index, action === "up" ? -1 : 1);
        if (to >= 0) focusIndex = to;
      } else if (action === "remove") {
        removeRow(items, index);
        focusIndex = Math.min(index, items.length - 1);
      } else if (action === "add") {
        if (isFull(items)) return;
        focusIndex = addRow(items, opts.newItem());
      }
    });
    if (accepted === false) {
      focusIndex = index;
      showFullNotice(doc, notice, texts);
    }
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

  /** True when the list has all the rows it may have (maxRows). */
  function isFull(items) {
    return typeof opts.maxRows === "number" && items.length >= opts.maxRows;
  }

  /** The add button: disabled when the list is full or its column of the sheet is full. */
  function refreshAdd() {
    var listFull = isFull(opts.getList());
    var sheetFull = !!(opts.column && SHEET_FULL[opts.column]);
    add.disabled = listFull || sheetFull;
    if (listFull) add.title = texts.listFull.replace("{n}", String(opts.maxRows));
    else if (sheetFull) add.title = texts.sheetFullAdd;
    else add.removeAttribute("title");
  }
  if (opts.column) fullWatchers.push(refreshAdd);

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
    refreshAdd();
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
  hideFullNotice();
  fullWatchers = []; // the buttons of the previous form are gone with it
  var data = function () { return state.data; };
  /** set(key)(value) stores a field; false when the change was refused. */
  var set = function (key) {
    return function (value) { return state.update(function (d) { d[key] = value; }); };
  };

  // Personal data
  var personal = buildFormSection(doc, texts.formPersonal, true);
  personal.body.appendChild(buildTextField(doc, {
    label: texts.fieldName, value: data().nombre, autocomplete: "name", texts: texts, onInput: set("nombre")
  }));
  personal.body.appendChild(buildTextField(doc, {
    label: texts.fieldJob, value: data().puesto, help: texts.fieldJobHelp, autocomplete: "organization-title", texts: texts, onInput: set("puesto")
  }));
  personal.body.appendChild(buildFilePicker(doc, {
    title: texts.fieldPhoto, accept: "image/*", chooseText: texts.photoChoose, removeText: texts.photoRemove,
    setText: texts.photoSet, noneText: texts.photoNone, texts: texts,
    hasValue: function () { return !!data().foto; },
    onFile: function (file, finish, setStatus, refused) {
      setStatus(texts.photoBusy);
      readPhotoFile(file, function (error, url) {
        if (error) { finish(texts.photoError); return; }
        if (!set("foto")(url)) refused();
        finish();
      });
    },
    onRemove: function () { set("foto")(""); }
  }));
  personal.body.appendChild(buildFilePicker(doc, {
    title: texts.fieldLogo, accept: ".svg,image/svg+xml", chooseText: texts.logoChoose, removeText: texts.logoRemove,
    setText: texts.logoSet, noneText: texts.logoNone, texts: texts,
    hasValue: function () { return !!data().monograma; },
    onFile: function (file, finish, setStatus, refused) {
      readLogoFile(file, function (error, svg) {
        if (error) { finish(texts.logoError); return; }
        if (!set("monograma")(svg)) refused();
        finish();
      });
    },
    onRemove: function () { set("monograma")(""); }
  }));
  host.appendChild(personal.element);

  // Profile
  var profile = buildFormSection(doc, texts.formProfile, false);
  profile.body.appendChild(buildTextField(doc, {
    kind: "textarea", rows: 10, label: texts.fieldProfile, value: data().perfil, help: texts.profileHelp, texts: texts, onInput: set("perfil")
  }));
  host.appendChild(profile.element);

  // Contact
  var contact = buildFormSection(doc, texts.formContact, false);
  var contactEditor = createListEditor(doc, {
    texts: texts,
    update: state.update,
    column: "lado",
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

  /** A folding section with a list of rows of state.data[key]. opts.column: the column of the sheet. */
  function addListSection(title, key, opts) {
    var section = buildFormSection(doc, title, false);
    if (opts.help) section.body.appendChild(el(doc, "p", { class: "help section-help" }, opts.help));
    var editor = createListEditor(doc, {
      texts: texts,
      update: state.update,
      column: opts.column,
      stacked: opts.stacked,
      getList: opts.getList || function () {
        if (!Array.isArray(state.data[key])) state.data[key] = [];
        return state.data[key];
      },
      fields: opts.fields,
      newItem: opts.newItem,
      addText: opts.addText,
      maxRows: opts.maxRows
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
    column: "lado",
    fields: [text("idioma", texts.fieldLanguage), text("nivel", texts.fieldLevel)],
    newItem: function () { return { idioma: "", nivel: "" }; }
  });
  addListSection(texts.formSkills, "habilidades", {
    help: texts.skillsHelp, stacked: true, column: "lado",
    fields: [text("grupo", texts.fieldGroup), text("items", texts.fieldItems)],
    newItem: function () { return { grupo: "", items: "" }; }
  });
  addListSection(texts.formOther, "otros", {
    column: "lado",
    fields: [text("texto", texts.fieldOtherText), text("detalle", texts.fieldOtherDetail)],
    newItem: function () { return { texto: "", detalle: "" }; }
  });

  // Order of the main column: every section, shown or hidden, in its place
  var orderRows = buildOrderRows(data().orden, MAIN_SECTIONS);
  var orderSection = buildFormSection(doc, texts.formOrder, false);
  orderSection.body.appendChild(el(doc, "p", { class: "help section-help" }, texts.orderHelp));
  var orderList = el(doc, "ol", { class: "rows-list order-list" });
  var orderNotice = fullNoticeElement(doc);
  orderSection.body.appendChild(orderList);
  orderSection.body.appendChild(orderNotice);
  host.appendChild(orderSection.element);

  var sectionTitle = function (key) { return texts[MAIN_SECTION_TITLES[key]] || key; };

  /**
   * Saves the order, paints the rows again, moves the form sections and
   * puts the focus back. A refused change (showing a section that does
   * not fit) leaves the rows as they were, with the notice under them.
   */
  function changeOrder(change, focusKey, focusAction) {
    hideFullNotice();
    var before = orderRows.map(function (r) { return { key: r.key, shown: r.shown }; });
    var accepted = state.update(function (d) {
      change();
      d.orden = orderFromRows(orderRows);
    });
    if (!accepted) {
      orderRows.splice.apply(orderRows, [0, orderRows.length].concat(before));
      showFullNotice(doc, orderNotice, texts);
    }
    refreshOrder();
    placeMainSections();
    var row = orderList.querySelector('[data-key="' + focusKey + '"]');
    if (!row) return;
    var target = row.querySelector('[data-action="' + focusAction + '"]');
    if (!target || target.disabled) target = row.querySelector("button:not([disabled])") || row.querySelector("input");
    if (target) target.focus();
  }

  function refreshOrder() {
    orderList.textContent = "";
    orderRows.forEach(function (item, index) {
      var name = sectionTitle(item.key);
      var li = el(doc, "li", { class: "row order-row", "data-key": item.key });
      li.appendChild(el(doc, "span", { class: "order-name" }, name));
      var id = newFieldId("order");
      var check = el(doc, "label", { class: "order-show", for: id });
      var box = el(doc, "input", { type: "checkbox", id: id, "data-action": "show" });
      box.checked = item.shown;
      box.addEventListener("change", function () {
        var shown = box.checked;
        changeOrder(function () { item.shown = shown; }, item.key, "show");
      });
      check.appendChild(box);
      check.appendChild(doc.createTextNode(" " + texts.orderShow));
      check.appendChild(el(doc, "span", { class: "visually-hidden" }, " (" + name + ")"));
      li.appendChild(check);
      var buttons = el(doc, "div", { class: "row-buttons" });
      [["up", texts.rowUp, "↑", index === 0], ["down", texts.rowDown, "↓", index === orderRows.length - 1]].forEach(function (b) {
        var button = el(doc, "button", {
          type: "button", class: "icon-button", "data-action": b[0],
          "aria-label": b[1] + " (" + name + ")", title: b[1], disabled: b[3] ? "" : null
        }, b[2]);
        button.addEventListener("click", function () {
          changeOrder(function () { moveRow(orderRows, index, b[0] === "up" ? -1 : 1); }, item.key, b[0]);
        });
        buttons.appendChild(button);
      });
      li.appendChild(buttons);
      orderList.appendChild(li);
    });
  }
  refreshOrder();

  // Main column: the form sections follow the same order, hidden ones included
  var mainElements = {};
  var mainSections = {
    experiencia: function () {
      return addListSection(texts.formExperience, "experiencia", {
        stacked: true, column: "main",
        fields: [
          text("empresa", texts.fieldCompany), text("fecha", texts.fieldDate), text("puesto", texts.fieldRole),
          text("descripcion", texts.fieldDescription, { kind: "textarea" })
        ],
        newItem: function () { return { empresa: "", fecha: "", puesto: "", descripcion: "" }; }
      });
    },
    formacion: function () {
      return addListSection(texts.formEducation, "formacion", {
        stacked: true, column: "main",
        fields: [text("titulo", texts.fieldTitle), text("centro", texts.fieldCenter), text("fecha", texts.fieldDate)],
        newItem: function () { return { titulo: "", centro: "", fecha: "" }; }
      });
    },
    cursos: function () {
      return addListSection(texts.formCourses, "cursos", {
        stacked: true, column: "main",
        // The second field is also used for a line of explanation; inside, it is still "centro"
        fields: [text("titulo", texts.fieldTitle), text("centro", texts.fieldSubtitle), text("fecha", texts.fieldDate)],
        newItem: function () { return { titulo: "", centro: "", fecha: "" }; }
      });
    }
  };
  // "proyectos" has no section in the first version: data that brings it is kept but not shown here
  orderRows.forEach(function (item) { mainElements[item.key] = mainSections[item.key]().element; });

  // Methodology: a title and one row per step, within the limits of the fixed box (METHOD_LIMITS)
  var getMethod = function () {
    var m = state.data.metodologia;
    if (!m || typeof m !== "object") m = state.data.metodologia = { titulo: "", pasos: [] };
    if (!Array.isArray(m.pasos)) m.pasos = [];
    return m;
  };
  var method = addListSection(texts.formMethod, null, {
    help: texts.methodHelp,
    getList: function () { return getMethod().pasos; },
    fields: [{ key: null, label: texts.fieldStep, kind: "text", maxLength: METHOD_LIMITS.step }],
    newItem: function () { return ""; },
    addText: texts.stepAdd,
    maxRows: METHOD_LIMITS.steps
  });
  method.body.insertBefore(buildTextField(doc, {
    label: texts.fieldMethodTitle, value: getMethod().titulo, maxLength: METHOD_LIMITS.title, texts: texts,
    onInput: function (value) { return state.update(function () { getMethod().titulo = value; }); }
  }), method.body.firstChild);

  /** Puts the main column sections of the form in the chosen order, before the methodology. */
  function placeMainSections() {
    orderRows.forEach(function (item) { host.insertBefore(mainElements[item.key], method.element); });
  }
}

/* Form title of each main column section, as a key of TEXTS. */
var MAIN_SECTION_TITLES = { formacion: "formEducation", experiencia: "formExperience", cursos: "formCourses" };

/**
 * Rows of the "Orden de los apartados" editor: first the sections in
 * order (shown), then the other known ones (hidden), each once.
 * keys: the sections that can be edited (MAIN_SECTIONS).
 */
function buildOrderRows(order, keys) {
  var rows = [];
  var has = function (k) { return rows.some(function (r) { return r.key === k; }); };
  (Array.isArray(order) ? order : []).forEach(function (k) {
    if (keys.indexOf(k) >= 0 && !has(k)) rows.push({ key: k, shown: true });
  });
  keys.forEach(function (k) { if (!has(k)) rows.push({ key: k, shown: false }); });
  return rows;
}

/** The order saved in the data: the keys of the rows that are shown, as they are placed. */
function orderFromRows(rows) {
  return rows.filter(function (r) { return r.shown; }).map(function (r) { return r.key; });
}

if (typeof module !== "undefined") {
  module.exports = {
    CONTACT_TYPES: CONTACT_TYPES,
    buildContactLink: buildContactLink,
    fitImageSize: fitImageSize,
    updateContactLink: updateContactLink,
    parseTags: parseTags,
    formatTags: formatTags,
    clampText: clampText,
    formatCharsLeft: formatCharsLeft,
    getRowValue: getRowValue,
    setRowValue: setRowValue,
    buildOrderRows: buildOrderRows,
    orderFromRows: orderFromRows,
    FULL_NOTICE_MS: FULL_NOTICE_MS
  };
}
