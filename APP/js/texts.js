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
  previewTitle: "Vista previa",

  // Form: personal data
  formPersonal: "Datos personales",
  fieldName: "Nombre",
  fieldJob: "Puesto",
  fieldJobHelp: "Si lo dejas vacío, no sale en el CV.",
  fieldPhoto: "Foto",
  photoChoose: "Elegir foto",
  photoRemove: "Quitar foto",
  photoNone: "Sin foto: salen tus iniciales.",
  photoSet: "Foto puesta.",
  photoBusy: "Preparando la foto…",
  photoError: "No se ha podido leer la imagen. Prueba con un archivo JPG o PNG.",
  fieldLogo: "Logo",
  logoChoose: "Elegir logo (.svg)",
  logoRemove: "Quitar logo",
  logoNone: "Sin logo: salen tus iniciales detrás de la foto.",
  logoSet: "Logo puesto.",
  logoError: "El archivo no es un SVG que se pueda usar.",

  // Form: profile
  formProfile: "Perfil",
  fieldProfile: "Texto del perfil",
  profileHelp: "**texto** = negrita. Una línea en blanco = párrafo nuevo.",

  // Form: contact, and the rows of any list
  formContact: "Contacto",
  rowType: "Tipo",
  rowText: "Texto",
  rowNumber: "fila",
  rowAdd: "Añadir fila",
  rowRemove: "Quitar",
  rowUp: "Subir",
  rowDown: "Bajar",
  listEmpty: "Todavía no hay ninguna fila.",
  contactTypes: {
    lugar: "Lugar",
    telefono: "Teléfono",
    web: "Web",
    github: "GitHub",
    correo: "Correo",
    linkedin: "LinkedIn"
  },

  // Titles printed on the CV sheet
  cvProfile: "Perfil",
  cvContact: "Contacto",
  cvLanguages: "Idiomas",
  cvTools: "Herramientas",
  cvOther: "Otros datos",
  cvFooter: "Currículum vitae",
  cvExperience: "Experiencia",
  cvEducation: "Titulaciones académicas",
  cvCourses: "Cursos y otras actividades formativas",
  cvProjects: "Proyectos",
  cvSkills: "Habilidades"
};

if (typeof module !== "undefined") module.exports = TEXTS;
