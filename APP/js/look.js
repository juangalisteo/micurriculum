/*
 * MiCurriculum · the look controls in the top bar: theme and layout.
 *
 * "Tema" is a group of four choices, each with a small sample of its
 * colors; "Formato" is a list with the three layouts. Every change goes
 * through STATE.updateLook(), so the sheet is painted again and saved.
 *
 * pickTheme(), pickLayout() and themeSwatch() do not need the browser
 * and are tested in Node.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* ---------- Parts that do not need the browser ---------- */

/** The theme key when it is known; otherwise the default one. */
function pickTheme(key, themes, defaultLook) {
  return Object.prototype.hasOwnProperty.call(themes, key) ? key : defaultLook.tema;
}

/** The layout key when it is known; otherwise the default one. */
function pickLayout(key, layouts, defaultLook) {
  return layouts.indexOf(key) >= 0 ? key : defaultLook.formato;
}

/** CSS background of the sample: the side column color and the accent, split on the diagonal. */
function themeSwatch(theme) {
  return "linear-gradient(135deg, " + theme.lateral + " 0 55%, " + theme.acento + " 55% 100%)";
}

/* ---------- Browser only ---------- */

var lookIdCount = 0;

/** Builds the controls inside #look. state is the store from state.js. */
function buildLookControls(doc, state, texts, themes, layouts, defaultLook) {
  var host = doc.getElementById("look");
  if (!host) return;
  host.textContent = "";
  lookIdCount += 1;
  var prefix = "look" + lookIdCount;
  var currentTheme = pickTheme(state.look && state.look.tema, themes, defaultLook);
  var currentLayout = pickLayout(state.look && state.look.formato, layouts, defaultLook);

  // Theme: one radio button per theme, with its sample
  var group = doc.createElement("div");
  group.className = "look-group";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-labelledby", prefix + "-theme");
  var groupLabel = doc.createElement("span");
  groupLabel.className = "look-label";
  groupLabel.id = prefix + "-theme";
  groupLabel.textContent = texts.lookTheme;
  group.appendChild(groupLabel);
  Object.keys(themes).forEach(function (key) {
    var label = doc.createElement("label");
    label.className = "theme-chip";
    var input = doc.createElement("input");
    input.type = "radio";
    input.name = prefix + "-theme";
    input.value = key;
    input.className = "visually-hidden";
    input.checked = key === currentTheme;
    input.addEventListener("change", function () {
      if (!input.checked) return;
      state.updateLook(function (look) { look.tema = key; });
    });
    var body = doc.createElement("span");
    body.className = "theme-chip-body";
    var swatch = doc.createElement("span");
    swatch.className = "theme-swatch";
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.background = themeSwatch(themes[key]);
    var name = doc.createElement("span");
    name.textContent = texts.themeNames[key] || key;
    body.appendChild(swatch);
    body.appendChild(name);
    label.appendChild(input);
    label.appendChild(body);
    group.appendChild(label);
  });

  // Layout: a list with the three layouts
  var layoutWrap = doc.createElement("div");
  layoutWrap.className = "look-group";
  var layoutLabel = doc.createElement("label");
  layoutLabel.className = "look-label";
  layoutLabel.htmlFor = prefix + "-layout";
  layoutLabel.textContent = texts.lookLayout;
  var select = doc.createElement("select");
  select.id = prefix + "-layout";
  select.className = "look-select";
  layouts.forEach(function (key) {
    var option = doc.createElement("option");
    option.value = key;
    option.textContent = texts.layoutNames[key] || key;
    select.appendChild(option);
  });
  select.value = currentLayout;
  select.addEventListener("change", function () {
    var key = select.value;
    state.updateLook(function (look) { look.formato = key; });
  });
  layoutWrap.appendChild(layoutLabel);
  layoutWrap.appendChild(select);

  host.appendChild(group);
  host.appendChild(layoutWrap);
}

if (typeof module !== "undefined") {
  module.exports = { pickTheme: pickTheme, pickLayout: pickLayout, themeSwatch: themeSwatch };
}
