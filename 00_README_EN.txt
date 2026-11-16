MICURRICULUM v1.0.0 - MAKE YOUR CV
(Espanol: lee 00_LEEME.txt)

HOW TO OPEN IT
1. Copy the WHOLE MICURRICULUM folder wherever you like.
2. Open MICURRICULUM and double-click 01_ABRIR.cmd. The program opens in
   your browser (Chrome, Edge or Firefox) with Ana's sample data.
   There is nothing to install and no Internet is needed.
3. On another system (macOS, Linux) open APP\index.html in the browser.

The interface is in Spanish for now. The launcher files keep their Spanish
names: ABRIR = open, CREAR_ACCESO_DIRECTO = create shortcut.

HOW TO USE IT
- Left panel, "Tus datos" (your data): each section opens with a click.
  Datos personales (personal data), Perfil (profile), Contacto (contact),
  Idiomas (languages), Herramientas y habilidades (tools and skills),
  Otros datos (other data), Orden de los apartados (section order),
  Formacion (education), Experiencia (experience), Cursos (courses) and
  Metodologia (methodology). Replace the sample data with yours: the sheet
  on the right changes as you type.
- Photo and logo: in Datos personales. Without a photo, your initials are
  shown. The logo is an SVG file.
- Top bar: Tema (theme: Marca, Oceano, Burdeos and Claro) and Formato
  (layout: side column on the left, on the right, or a single column).
- Orden de los apartados: move Formacion, Experiencia and Cursos up or
  down, or hide them. The methodology always goes last.
- The CV is one page. If you type something that does not fit, the program
  undoes it and says "No cabe mas en la hoja. Quita algo para anadir esto."
  (no more room on the sheet). When a column is full, the "Anadir fila"
  (add row) button is disabled. Removing or shortening is always allowed.

SAVING AND COPIES (MY_CV FOLDER)
- Everything is saved in the browser on its own: when you open the program
  again, your data is still there.
- "Guardar copia" (save a copy) downloads CV_NAME_YYYYMMDD.json to your
  Downloads folder. Move it to the MY_CV folder. It is your backup and the
  way to take the CV to another computer, with "Abrir CV.json" (open).
- The circular-arrow button restores the sample data. It deletes yours and
  asks first. If you want to keep them, save a copy before.
- If you clear your browser data, the CV is lost. That is what the copy is for.

EXPORTING THE PDF
1. Press "Exportar PDF". The browser's print dialog opens with the name
   CV_NAME_YYYYMMDD already set.
2. Choose "Save as PDF" (Chrome and Edge) or "Save to PDF" (Firefox) as the
   destination. Do NOT use "Microsoft Print to PDF": it saves the sheet as
   an image and recruiting software cannot read the text.
3. If the browser adds the date and the address at the edges, turn off
   "Headers and footers" in the options.
4. Save the file. It comes out as one A4 page, with selectable text,
   working links and no white margins.

DESKTOP SHORTCUT
Double-click 02_CREAR_ACCESO_DIRECTO.cmd ONCE and MiCurriculum will appear
on your desktop with its icon. If you move the folder, run it again.

PRIVACY
Your data is stored only in your browser and in the CV.json files you
download. The program does not connect anywhere and sends nothing.

FOLDER STRUCTURE
MICURRICULUM
  00_LEEME.txt                  Quick guide in Spanish
  00_README_EN.txt              This guide
  01_ABRIR.cmd                  Opens MiCurriculum in the browser
  02_CREAR_ACCESO_DIRECTO.cmd   Creates the desktop shortcut
  APP\                          The program: page, styles, code, fonts and icon
  MY_CV\                        Your CV.json copies
  tests\                        Automated tests (node --test)
  docs\                         README images
  README.md / README.es.md      Project presentation in English / Spanish (GitHub)
  CHANGELOG.md / CHANGELOG.es.md  Changelog
  LICENSE                       GPL-3.0 license

REQUIREMENTS
Windows 10 or 11 and a modern browser (Chrome, Edge or Firefox).
No Python, Node.js or Internet needed. Node.js is only needed for the
automated tests (node --test).

AUTHOR
Juan Bautista Galisteo Marques (github.com/juangalisteo)
GPL-3.0 license (LICENSE file).
