/*
 * MiCurriculum · cleans an SVG logo before it is put on the page.
 *
 * cleanSvg() works only with text (no browser needed), so it can be tested
 * in Node. It keeps a list of known drawing elements and rebuilds the SVG
 * from scratch: anything not on the list is dropped with its content
 * (<script>, <foreignObject>, <style>, <animate>…), and so are "on…"
 * attributes and links to anything outside the logo itself.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* Drawing elements that are kept (lower case). Everything else is dropped. */
var SVG_ALLOWED_ELEMENTS = [
  "svg", "g", "defs", "symbol", "use", "title", "desc",
  "path", "rect", "circle", "ellipse", "line", "polyline", "polygon",
  "text", "tspan", "textpath",
  "lineargradient", "radialgradient", "stop", "clippath", "mask", "pattern"
];

/* Namespaced attributes that are kept; any other "prefix:name" is dropped. */
var SVG_ALLOWED_PREFIXED = ["xlink:href", "xml:space", "xmlns:xlink"];

/* Biggest logo accepted, in characters. */
var SVG_MAX_LENGTH = 500000;

/** Turns character references into characters, so hidden tricks are seen. */
function decodeEntities(value) {
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);?/gi, function (all, ref) {
    var r = ref.toLowerCase();
    if (r.charAt(0) === "#") {
      var code = r.charAt(1) === "x" ? parseInt(r.slice(2), 16) : parseInt(r.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[r];
  });
}

function escapeSvgText(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/**
 * True when an attribute can stay. value is already decoded.
 * Links (href) may only point inside the logo ("#id"), and url(...) too.
 */
function isSafeSvgAttribute(name, value) {
  var n = name.toLowerCase();
  if (!/^[a-z][a-z0-9_.:-]*$/.test(n)) return false;
  if (n.indexOf("on") === 0) return false;
  if (n.indexOf(":") >= 0 && SVG_ALLOWED_PREFIXED.indexOf(n) < 0) return false;
  if (n === "xmlns:xlink") return true;
  var v = value.replace(/[\s\u0000-\u001f]+/g, "");
  if (n === "href" || n === "xlink:href") return v.charAt(0) === "#";
  if (/javascript:|vbscript:|data:|expression\(|@import|\\/i.test(v)) return false;
  var urls = v.match(/url\(([^)]*)\)?/gi) || [];
  for (var i = 0; i < urls.length; i++) {
    if (!/^url\(['"]?#/i.test(urls[i])) return false;
  }
  return true;
}

/** Reads the attributes of a tag: [{ name, value }], value already decoded. */
function readSvgAttributes(source) {
  var list = [];
  var re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  var m;
  while ((m = re.exec(source))) {
    var raw = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : "";
    list.push({ name: m[1], value: decodeEntities(raw) });
  }
  return list;
}

/**
 * Returns a clean copy of the SVG text, or "" when there is no <svg> in it
 * or it is too big. The result is always well formed: every open tag is
 * closed, and text and attribute values are escaped again.
 */
function cleanSvg(text) {
  var source = String(text == null ? "" : text);
  if (!source || source.length > SVG_MAX_LENGTH) return "";
  // Comments, CDATA, <?xml …?> and <!DOCTYPE …> go first.
  source = source
    .replace(/<!--[\s\S]*?(-->|$)/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?(\]\]>|$)/g, "")
    .replace(/<\?[\s\S]*?(\?>|$)/g, "")
    .replace(/<!DOCTYPE(\s*\[[\s\S]*?\])?[^>]*>/gi, "");

  var tagRe = /<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  var out = "";
  var open = [];      // elements kept and not closed yet
  var dropping = 0;   // depth inside an element that is dropped with its content
  var droppedName = "";
  var started = false;
  var finished = false;
  var last = 0;
  var m;

  while (!finished && (m = tagRe.exec(source))) {
    var between = source.slice(last, m.index);
    last = tagRe.lastIndex;
    if (started && !dropping && between) out += escapeSvgText(decodeEntities(between));

    var closing = m[1] === "/";
    var name = m[2];
    var lower = name.toLowerCase();
    var rest = m[3];
    var selfClosing = !closing && /\/\s*$/.test(rest);

    if (!started) {
      if (closing || lower !== "svg") continue; // anything before the root <svg> is ignored
      started = true;
    }

    if (dropping) {
      // Only tags with the same name as the dropped one are counted: inside it
      // there may be HTML with tags that are never closed (<img>, <br>…).
      if (lower === droppedName && !selfClosing) dropping += closing ? -1 : 1;
      continue;
    }

    if (closing) {
      var at = -1;
      for (var i = open.length - 1; i >= 0; i--) {
        if (open[i].toLowerCase() === lower) { at = i; break; }
      }
      if (at < 0) continue; // a closing tag that does not match is ignored
      while (open.length > at) out += "</" + open.pop() + ">";
      if (!open.length) finished = true;
      continue;
    }

    if (SVG_ALLOWED_ELEMENTS.indexOf(lower) < 0) {
      if (!selfClosing) { dropping = 1; droppedName = lower; }
      continue;
    }

    var attrs = readSvgAttributes(rest.replace(/\/\s*$/, "")).filter(function (a) {
      return isSafeSvgAttribute(a.name, a.value);
    }).map(function (a) {
      return " " + a.name + '="' + escapeSvgText(a.value) + '"';
    }).join("");

    out += "<" + name + attrs + (selfClosing ? "/>" : ">");
    if (selfClosing) {
      if (!open.length) finished = true; // <svg/> on its own
    } else {
      open.push(name);
    }
  }

  if (!started) return "";
  if (!finished && !dropping) {
    var tail = source.slice(last);
    if (tail && tail.indexOf("<") < 0) out += escapeSvgText(decodeEntities(tail));
  }
  while (open.length) out += "</" + open.pop() + ">";
  return out;
}

if (typeof module !== "undefined") {
  module.exports = { cleanSvg: cleanSvg, isSafeSvgAttribute: isSafeSvgAttribute, decodeEntities: decodeEntities };
}
