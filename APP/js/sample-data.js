/*
 * MiCurriculum · sample data the program starts with.
 * A made-up example built around the program. Same structure as "datos" in the approved template.
 *
 * Project:   MiCurriculum
 * Author:    Juan Bautista Galisteo Marqués (@juangalisteo)
 * License:   GPL-3.0-or-later (see LICENSE)
 * Copyright (C) 2026 Juan Bautista Galisteo Marqués.
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU General Public License, version 3 or (at your option) any later version.
 */
"use strict";

var SAMPLE_DATA = {
  nombre: "MiCurriculum",
  puesto: "",            // empty = not shown
  foto: "",              // empty = initials are shown
  monograma: "",         // empty = initials behind the photo
  // in the profile, **text** = bold; a blank line = new paragraph
  perfil: "Técnico en desarrollo de aplicaciones web y diseñador gráfico. Me gusta ordenar la información, cuidar los detalles y explicar las cosas de forma sencilla. **Con ganas de seguir aprendiendo.**\n\nHe trabajado en una agencia web, en un estudio de diseño y con pequeños negocios que querían mejorar su imagen. Sé organizar mi tiempo, atender a clientes y sacar adelante proyectos con plazos cortos, tanto solo como en equipo. Mi último proyecto es MiCurriculum, un programa para hacer el currículum en el navegador.",
  contacto: [
    { tipo: "lugar",    texto: "Ciudad Ejemplo (España)" },
    { tipo: "telefono", texto: "+34 600 00 00 00", enlace: "tel:+34600000000" },
    { tipo: "web",      texto: "micurriculum.example.com", enlace: "https://micurriculum.example.com/" },
    { tipo: "github",   texto: "github.com/juangalisteo/micurriculum", enlace: "https://github.com/juangalisteo/micurriculum" },
    { tipo: "correo",   texto: "micurriculum@example.com", enlace: "mailto:micurriculum@example.com" },
    { tipo: "linkedin", texto: "linkedin.com/in/usuario-ejemplo", enlace: "https://www.linkedin.com/in/usuario-ejemplo/" }
  ],
  idiomas: [ { idioma: "Inglés", nivel: "B2" }, { idioma: "Español", nivel: "Nativo" } ],
  otros:   [ { texto: "Carné B", detalle: "Coche propio" } ],
  experiencia: [
    { empresa: "MiCurriculum · Proyecto propio", fecha: "2026", puesto: "Desarrollador web", descripcion: "" },
    { empresa: "Agencia Web Ejemplo", fecha: "2025 – 2026", puesto: "Desarrollador front-end", descripcion: "" },
    { empresa: "Estudio Gráfico Ejemplo", fecha: "2023 – 2025", puesto: "Diseñador gráfico", descripcion: "" },
    { empresa: "Asociación Cultural Prueba", fecha: "2021 – 2022", puesto: "Voluntario en actividades culturales", descripcion: "" }
  ],
  formacion: [
    { titulo: "Técnico Superior en Desarrollo de Aplicaciones Web", centro: "Instituto Ejemplo de Formación Profesional", fecha: "2026" },
    { titulo: "Técnico en Sistemas Microinformáticos y Redes", centro: "Instituto Ejemplo", fecha: "2023" },
    { titulo: "Bachillerato de Artes", centro: "Instituto Ejemplo", fecha: "2021" }
  ],
  cursos: [
    { titulo: "Diseño web adaptable", centro: "", fecha: "2025" },
    { titulo: "JavaScript desde cero", centro: "", fecha: "2025" },
    { titulo: "Accesibilidad web", centro: "", fecha: "2024" },
    { titulo: "Git y GitHub", centro: "", fecha: "2024" },
    { titulo: "Maquetación de revistas y libros", centro: "", fecha: "2023" },
    { titulo: "Curso online de herramientas digitales", centro: "Productividad y trabajo en equipo", fecha: "2022 – 2023" }
  ],
  proyectos: [],
  habilidades: [
    { grupo: "Desarrollo web", items: "HTML, CSS, JavaScript" },
    { grupo: "Diseño", items: "Illustrator, InDesign, Photoshop" },
    { grupo: "Trabajo", items: "Git, GitHub, VS Code" }
  ],
  metodologia: { titulo: "¿Mi metodología?", pasos: ["Escuchar", "Ordenar", "Diseñar", "Programar"] },
  // order of the main column sections
  orden: ["formacion", "experiencia", "cursos"]
};

if (typeof module !== "undefined") module.exports = SAMPLE_DATA;
