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
  sheetOverflow: "El contenido no cabe en una página",
  noticeClose: "Cerrar aviso",

  // Saving: buttons of the top bar and their messages
  copySave: "Guardar copia",
  copyOpen: "Abrir CV.json",
  sampleReset: "Volver al ejemplo (se borran tus datos)",
  sampleResetIcon: "↻",
  copiesHelp: "Las copias se guardan en Descargas; muévelas a la carpeta MY_CV.",
  copyOpenConfirm: "Los datos que tienes ahora se van a sustituir por los de la copia. ¿Seguir?",
  sampleResetConfirm: "Los datos que tienes ahora se van a sustituir por los de ejemplo. Si los quieres conservar, antes pulsa «Guardar copia». ¿Seguir?",
  copyInvalid: "Ese archivo no es una copia de MiCurriculum. No se ha cambiado nada.",
  copyNewer: "Esa copia es de una versión más nueva de MiCurriculum y esta no la sabe abrir. No se ha cambiado nada.",
  copyReadError: "No se ha podido leer el archivo. No se ha cambiado nada.",
  storageBlocked: "El navegador no deja guardar los datos en esta página: al cerrarla se pierden. El programa funciona igual; usa «Guardar copia» para no perderlos.",

  // Export to PDF: button of the top bar and its messages
  pdfExport: "Exportar PDF",
  pdfExportHelp: "En la ventana de imprimir, elige Guardar como PDF. Elige Guardar en PDF, no Microsoft Print to PDF: ese lo guarda como imagen.",
  pdfOverflowConfirm: "El contenido no cabe en una página y se cortará. ¿Exportar igualmente?",

  // Look: theme and layout, in the top bar
  lookTheme: "Tema",
  lookLayout: "Formato",
  themeNames: {
    marca: "Marca",
    oceano: "Océano",
    burdeos: "Burdeos",
    claro: "Claro"
  },
  layoutNames: {
    izq: "Columna a la izquierda",
    dcha: "Columna a la derecha",
    una: "Una columna"
  },

  // Form: order of the main column sections
  formOrder: "Orden de los apartados",
  orderHelp: "La metodología va siempre al final y sale si tiene pasos.",
  orderShow: "Sale en la hoja",

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

  // Form: languages, tools and other data (side column)
  formLanguages: "Idiomas",
  fieldLanguage: "Idioma",
  fieldLevel: "Nivel",
  formSkills: "Herramientas y habilidades",
  skillsHelp: "Salen en la columna lateral, en «Herramientas».",
  fieldGroup: "Grupo",
  fieldItems: "Lista",
  formOther: "Otros datos",
  fieldOtherText: "Texto",
  fieldOtherDetail: "Detalle",

  // Form: main column
  formExperience: "Experiencia",
  fieldCompany: "Empresa",
  fieldDate: "Fecha",
  fieldRole: "Puesto",
  fieldDescription: "Descripción",
  formEducation: "Formación",
  formCourses: "Cursos",
  fieldTitle: "Título",
  fieldCenter: "Centro",
  fieldSubtitle: "Subtítulo",

  // Form: methodology
  formMethod: "Metodología",
  fieldMethodTitle: "Título",
  methodHelp: "Una fila por paso. Si no hay pasos, el recuadro no sale.",
  fieldStep: "Paso",
  stepAdd: "Añadir paso",

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
