/*
 * MiCurriculum · sample data the program starts with.
 * A made-up person. Same structure as "datos" in the approved template.
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
  nombre: "Ana Ejemplo",
  puesto: "",            // empty = not shown
  foto: "",              // empty = initials are shown
  monograma: "",         // empty = initials behind the photo
  // in the profile, **text** = bold; a blank line = new paragraph
  perfil: "Técnica en administración y diseñadora gráfica. Me gusta ordenar la información, cuidar los detalles y explicar las cosas de forma sencilla. **Con ganas de seguir aprendiendo.**\n\nHe trabajado en oficinas, en una imprenta y con pequeños negocios que querían mejorar su imagen. Sé organizar mi tiempo, atender a clientes y sacar adelante proyectos con plazos cortos, tanto sola como en equipo. Busco un puesto donde unir la gestión y la parte creativa, y crecer con la empresa.",
  contacto: [
    { tipo: "lugar",    texto: "Ciudad Ejemplo (España)" },
    { tipo: "telefono", texto: "+34 600 00 00 00", enlace: "tel:+34600000000" },
    { tipo: "web",      texto: "ana-ejemplo.example.com", enlace: "https://ana-ejemplo.example.com/" },
    { tipo: "github",   texto: "github.com/ana-ejemplo", enlace: "https://github.com/ana-ejemplo" },
    { tipo: "correo",   texto: "ana@example.com", enlace: "mailto:ana@example.com" },
    { tipo: "linkedin", texto: "linkedin.com/in/ana-ejemplo", enlace: "https://www.linkedin.com/in/ana-ejemplo/" }
  ],
  idiomas: [ { idioma: "Inglés", nivel: "B2" }, { idioma: "Español", nivel: "Nativo" } ],
  otros:   [ { texto: "Carné B", detalle: "Coche propio" } ],
  experiencia: [
    { empresa: "Estudio Gráfico Ejemplo", fecha: "2025 – 2026", puesto: "Diseñadora gráfica", descripcion: "" },
    { empresa: "Imprenta La Muestra", fecha: "2024", puesto: "", descripcion: "" },
    { empresa: "Gestoría Modelo · Servicios a pequeñas empresas", fecha: "2021 – 2024", puesto: "Auxiliar administrativa", descripcion: "" },
    { empresa: "Tienda de Barrio", fecha: "2020", puesto: "Dependienta", descripcion: "" },
    { empresa: "Asociación Cultural Prueba", fecha: "2019 – 2020", puesto: "Voluntaria en actividades culturales", descripcion: "" }
  ],
  formacion: [
    { titulo: "Técnico Superior en Diseño Gráfico", centro: "Escuela de Arte Ejemplo", fecha: "2025" },
    { titulo: "Técnico en Gestión Administrativa", centro: "Instituto Ejemplo de Formación Profesional", fecha: "2021" },
    { titulo: "Bachillerato de Artes", centro: "Instituto Ejemplo", fecha: "2019" }
  ],
  cursos: [
    { titulo: "Atención al cliente", centro: "", fecha: "2023" },
    { titulo: "Comunicación digital y redes sociales para pequeños negocios y asociaciones", centro: "", fecha: "2023" },
    { titulo: "Maquetación de revistas y libros", centro: "", fecha: "2022" },
    { titulo: "Contabilidad básica", centro: "", fecha: "2022" },
    { titulo: "Fotografía de producto", centro: "", fecha: "2022" },
    { titulo: "Curso online de herramientas digitales", centro: "Productividad y trabajo en equipo", fecha: "2021 – 2022" },
    { titulo: "Prevención de riesgos laborales", centro: "", fecha: "2021" },
    { titulo: "Primeros auxilios", centro: "", fecha: "2020" },
    { titulo: "Curso de «Iniciación al dibujo»", centro: "", fecha: "2018" }
  ],
  proyectos: [],
  habilidades: [
    { grupo: "Ofimática", items: "Hojas de cálculo, procesador de textos" },
    { grupo: "Diseño", items: "Illustrator, InDesign, Photoshop" },
    { grupo: "Inteligencia artificial", items: "Asistentes de texto e imagen" }
  ],
  metodologia: { titulo: "¿Mi metodología?", pasos: ["Escuchar", "Ordenar", "Diseñar", "Ilusionar"] },
  // order of the main column sections
  orden: ["formacion", "experiencia", "cursos"]
};

if (typeof module !== "undefined") module.exports = SAMPLE_DATA;
