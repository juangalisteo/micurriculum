# Changelog

**English** · [Español](CHANGELOG.es.md)

All notable changes to MiCurriculum are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] · 2026-11-16

First public release.

### Added
- A program that opens in the browser with nothing to install: `01_ABRIR.cmd` opens
  `APP\index.html` with the default browser.
- A form with every section of the CV: personal data (name, job title, photo and SVG logo),
  profile, contact, languages, tools and skills, other data, education, experience, courses
  and methodology.
- An A4 sheet redrawn with every change, scaled to the width of the window.
- Four themes (**Marca**, **Océano**, **Burdeos** and **Claro**) and three layouts (side column
  on the left, on the right, and a single column).
- Section order for the main column: move education, experience and courses up or down, or
  hide them.
- Content limit: a change that does not fit on the page is undone with a message under the
  field, and **Añadir fila** (add row) is disabled when the column is full.
- Autosave in the browser and `CV_NAME_YYYYMMDD.json` copies with **Guardar copia** (save a
  copy) and **Abrir CV.json** (open); whatever is opened is cleaned before use.
- **Exportar PDF** through the browser's print dialog: one-page A4, full bleed, with selectable
  text and working links.
- Sample data of a made-up person ("Ana Ejemplo") and a ↻ button to restore it.
- `APP\micurriculum.ico` icon, also used as favicon, and `02_CREAR_ACCESO_DIRECTO.cmd` for the
  desktop shortcut.
- Automated tests with `node --test`.
- README in Spanish and English, changelog and quick guides (`00_LEEME.txt` and
  `00_README_EN.txt`).
