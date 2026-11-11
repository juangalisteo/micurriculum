/*
 * MiCurriculum · start-up: puts the texts and the version on the screen,
 * builds the form, paints the CV again after every change, fits the sheet
 * to the screen and warns when the CV does not fit on one page.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/**
 * Returns the text for a key of the form "appName" or "version".
 * Unknown keys return the key itself, so a missing text is easy to spot.
 */
function getText(texts, key) {
  return Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : key;
}

/** Fills every element that has data-text="key" and sets the page title. */
function applyTexts(doc, texts) {
  var nodes = doc.querySelectorAll("[data-text]");
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].textContent = getText(texts, nodes[i].getAttribute("data-text"));
  }
  doc.title = getText(texts, "pageTitle");
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    applyTexts(document, TEXTS);
    buildForm(document, STATE, TEXTS);
    STATE.onChange(function (data, look) {
      renderSheet(document, data, look);
      checkOverflow(document);
    });
    renderSheet(document, STATE.data, STATE.look);
    watchSheetFit(document);
    checkOverflow(document);
  });
}

if (typeof module !== "undefined") module.exports = { getText: getText, applyTexts: applyTexts };
