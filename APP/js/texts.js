/*
 * MiCurriculum · texts the user sees and the program version.
 *
 * Every text shown in the interface lives here. To change a sentence,
 * change it only in this file. The version is set only here.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

var TEXTS = {
  version: "0.1.0",
  appName: "MiCurriculum",
  versionLabel: "versión",
  pageTitle: "MiCurriculum · Haz tu currículum",
  formTitle: "Tus datos",
  formEmpty: "Aquí irá el formulario para rellenar el currículum.",
  previewTitle: "Vista previa",
  previewEmpty: "Aquí se verá la hoja A4 del currículum."
};

if (typeof module !== "undefined") module.exports = TEXTS;
