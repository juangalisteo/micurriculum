/*
 * MiCurriculum · start-up: puts the texts and the version on the screen,
 * loads the data saved in the browser (or the sample data), builds the
 * form, the theme and layout controls and the copy buttons, paints the CV again and saves it after every
 * change, fits the sheet to the screen and warns when the CV does not fit
 * on one page.
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
    var closeNotice = document.getElementById("notice-close");
    closeNotice.setAttribute("aria-label", TEXTS.noticeClose);
    closeNotice.title = TEXTS.noticeClose;
    closeNotice.addEventListener("click", function () { hideNotice(document); });

    var storage = getBrowserStorage(window);
    var saver = createSaver(storage || {}, function () { showNotice(document, TEXTS.storageBlocked); });
    if (saver.check()) {
      var saved = saver.load();
      if (saved) STATE.replace(saved.data, saved.look);
    }

    buildForm(document, STATE, TEXTS);
    buildLookControls(document, STATE, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);
    buildCopyActions(document, window, STATE, TEXTS, { data: SAMPLE_DATA, look: DEFAULT_LOOK }, function (data, look) {
      STATE.replace(data, look);
      buildForm(document, STATE, TEXTS);
      buildLookControls(document, STATE, TEXTS, THEMES, LAYOUTS, DEFAULT_LOOK);
    });
    STATE.onChange(function (data, look) {
      renderSheet(document, data, look);
      checkOverflow(document);
      saver.save(data, look);
    });
    renderSheet(document, STATE.data, STATE.look);
    watchSheetFit(document);
    checkOverflow(document);
  });
}

if (typeof module !== "undefined") module.exports = { getText: getText, applyTexts: applyTexts };
