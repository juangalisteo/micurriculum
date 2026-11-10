/*
 * MiCurriculum · CV look: the four color themes and the default look.
 * Copied from the approved template (docs/PLANTILLA_CV_GENERICO).
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

/* Keys are kept as in the template, so its data and look fit without changes. */
var THEMES = {
  marca:  { lateral: "#22343D", lateralTexto: "#FAFAF7", acento: "#C7A15B", acentoTexto: "#7B5A26", fondo: "#FAFAF7", titulos: "#22343D", texto: "#22343D", suave: "#596771", linea: "#D9D4C7" },
  oceano: { lateral: "#1F3A5F", lateralTexto: "#F5F8FC", acento: "#5DA9E9", acentoTexto: "#2B6CB0", fondo: "#FFFFFF", titulos: "#1F3A5F", texto: "#1F2933", suave: "#52606D", linea: "#D3DCE6" },
  bosque: { lateral: "#2F4A3A", lateralTexto: "#F6F7F2", acento: "#B9925A", acentoTexto: "#7A5C2E", fondo: "#FBFAF6", titulos: "#2F4A3A", texto: "#25302A", suave: "#5E6B62", linea: "#D8D6CB" },
  claro:  { lateral: "#F3E9D6", lateralTexto: "#22343D", acento: "#7B5A26", acentoTexto: "#7B5A26", fondo: "#FFFFFF", titulos: "#22343D", texto: "#22343D", suave: "#596771", linea: "#E0D8C8" }
};

/* Layouts: side column on the left (izq), on the right (dcha) or a single column (una). */
var LAYOUTS = ["izq", "dcha", "una"];

var DEFAULT_LOOK = { tema: "marca", formato: "izq", letra: "Plex, 'IBM Plex Sans', Arial, sans-serif" };

if (typeof module !== "undefined") module.exports = { THEMES: THEMES, LAYOUTS: LAYOUTS, DEFAULT_LOOK: DEFAULT_LOOK };
