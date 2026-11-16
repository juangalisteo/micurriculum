# Historial de versiones

[English](CHANGELOG.md) · **Español**

Todos los cambios importantes de MiCurriculum se apuntan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y versiones según [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] · 16-11-2026

Primera versión publicada.

### Añadido
- Programa que se abre en el navegador sin instalar nada: `01_ABRIR.cmd` abre `APP\index.html`
  con el navegador por defecto.
- Formulario con todos los apartados del CV: datos personales (nombre, puesto, foto y logo SVG),
  perfil, contacto, idiomas, herramientas y habilidades, otros datos, formación, experiencia,
  cursos y metodología.
- Hoja A4 que se pinta al momento con cada cambio y se encaja a la anchura de la ventana.
- Cuatro temas (**Marca**, **Océano**, **Burdeos** y **Claro**) y tres formatos (columna lateral
  a la izquierda, a la derecha y una columna).
- Orden de los apartados de la columna principal: subir, bajar y ocultar formación, experiencia
  y cursos.
- Tope de contenido: un cambio que no cabe en la página se deshace con un aviso bajo el campo,
  y **Añadir fila** se desactiva cuando la columna está llena.
- Guardado automático en el navegador y copias `CV_NOMBRE_AAAAMMDD.json` con **Guardar copia**
  y **Abrir CV.json**; lo que se abre se limpia antes de usarse.
- **Exportar PDF** con la impresión del navegador: A4 de una página, a sangre, con texto que se
  puede seleccionar y enlaces que funcionan.
- Datos de ejemplo de una persona inventada («Ana Ejemplo») y botón ↻ para volver a ellos.
- Icono `APP\micurriculum.ico`, también como favicon, y `02_CREAR_ACCESO_DIRECTO.cmd` para el
  acceso directo del escritorio.
- Pruebas automáticas con `node --test`.
- README en español e inglés, historial de versiones y guías rápidas (`00_LEEME.txt` y
  `00_README_EN.txt`).
