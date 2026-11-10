/*
 * MiCurriculum · tests for svg-clean.js (cleaning the SVG logo).
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { cleanSvg } = require("../APP/js/svg-clean.js");
const TEXTS = require("../APP/js/texts.js");
const { THEMES, LAYOUTS, DEFAULT_LOOK } = require("../APP/js/themes.js");
const SAMPLE_DATA = require("../APP/js/sample-data.js");
const { buildCvHtml } = require("../APP/js/render.js");

test("a plain logo is kept as it is", () => {
  const logo = '<svg viewBox="-14 -20 152 144"><path transform="translate(0 0)" d="M 20 3 L 53 3 Z"/><circle cx="1" cy="2" r="3"/></svg>';
  assert.equal(cleanSvg(logo), logo);
});

test("<script>, <foreignObject>, <style> and unknown elements go away with their content", () => {
  const dirty = '<?xml version="1.0"?><!DOCTYPE svg><!-- hi --><svg viewBox="0 0 10 10">' +
    "<script>alert(1)</script><SCRIPT type='x'>alert(2)</SCRIPT>" +
    "<foreignObject><div><iframe src='https://evil.example'></iframe></div></foreignObject>" +
    "<style>@import url(https://evil.example/a.css);</style>" +
    '<animate attributeName="href" to="javascript:alert(3)"/>' +
    '<metadata><rdf:RDF><x/></rdf:RDF></metadata>' +
    '<rect width="5" height="5"/></svg>';
  const clean = cleanSvg(dirty);
  assert.equal(clean, '<svg viewBox="0 0 10 10"><rect width="5" height="5"/></svg>');
});

test("on… attributes and outside links are dropped; links inside the logo stay", () => {
  const dirty = '<svg onload="alert(1)" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
    '<path d="M0 0" ONCLICK="x()" fill="url(#g)" style="fill:url(https://evil.example/x)"/>' +
    '<use href="https://evil.example/a.svg#x"/><use xlink:href="#shape"/>' +
    '<use href="&#106;avascript:alert(1)"/><a href="javascript:alert(1)"><text>hola</text></a>' +
    '<rect inkscape:label="x" style="fill:red"/></svg>';
  const clean = cleanSvg(dirty);
  assert.ok(!/on(load|click)/i.test(clean));
  assert.ok(!clean.includes("evil.example"));
  assert.ok(!clean.includes("javascript"));
  assert.ok(!clean.includes("inkscape"));
  assert.ok(clean.includes('fill="url(#g)"'));
  assert.ok(clean.includes('<use xlink:href="#shape"/>'));
  assert.ok(clean.includes('style="fill:red"'));
  assert.ok(!clean.includes("<a"));
});

test("hidden tricks with character references or broken tags do not get through", () => {
  const clean = cleanSvg('<svg><rect style="fill:u&#114;l(https://evil.example/x)"/>' +
    '<text>&lt;script&gt;alert(1)&lt;/script&gt;</text><g><path d="M0 0"></svg>');
  assert.ok(!clean.includes("evil.example"));
  assert.ok(!clean.includes("<script"));
  assert.ok(clean.includes("&lt;script&gt;"));
  assert.ok(clean.endsWith("</g></svg>"));
});

test("HTML with unclosed tags inside a dropped element does not hide the rest of the logo", () => {
  const clean = cleanSvg('<svg viewBox="0 0 100 100"><foreignObject><img src="x" onerror="alert(1)"><br>' +
    "<foreignObject></foreignObject></foreignObject><circle r=\"40\"/></svg>");
  assert.equal(clean, '<svg viewBox="0 0 100 100"><circle r="40"/></svg>');
});

test("no <svg> means no logo", () => {
  assert.equal(cleanSvg(""), "");
  assert.equal(cleanSvg("hola"), "");
  assert.equal(cleanSvg("<html><script>alert(1)</script></html>"), "");
  assert.equal(cleanSvg(null), "");
});

test("render.js uses the cleaning for the logo, on both places of the sheet", () => {
  const data = Object.assign(JSON.parse(JSON.stringify(SAMPLE_DATA)), {
    monograma: '<svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(1)</script><path d="M0 0"/></svg>'
  });
  const html = buildCvHtml(data, DEFAULT_LOOK, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("onload"));
  assert.equal(html.split('<svg class="mono" viewBox="0 0 10 10"><path d="M0 0"/></svg>').length - 1, 2);
});
