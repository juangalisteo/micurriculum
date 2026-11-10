@echo off
rem MiCurriculum - abre el programa en el navegador por defecto.
rem MiCurriculum - opens the program in the default browser.
rem Author:  Juan Bautista Galisteo Marques (@juangalisteo)
rem License: GPL-3.0-or-later (see LICENSE)
setlocal
chcp 65001 >nul
title MiCurriculum
rem La ruta sale de este archivo: funciona aunque se mueva la carpeta.
set "PAGINA=%~dp0APP\index.html"
if not exist "%PAGINA%" (
 echo No se encuentra APP\index.html junto a este archivo.
 pause
 exit /b 1
)
start "" "%PAGINA%"
endlocal
