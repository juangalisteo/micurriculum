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
rem Navegador por defecto para las webs (http), leido del registro de Windows.
rem No se usa el programa asociado a .html: puede ser un editor (VS Code).
set "PROGID="
set "ORDEN="
set "NAVEGADOR="
for /f "tokens=2,*" %%A in ('reg query "HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice" /v ProgId 2^>nul ^| find "REG_SZ"') do set "PROGID=%%B"
if defined PROGID for /f "tokens=2,*" %%A in ('reg query "HKCR\%PROGID%\shell\open\command" /ve 2^>nul ^| find "REG_"') do set "ORDEN=%%B"
if defined ORDEN call :primero %ORDEN%
if defined NAVEGADOR if exist "%NAVEGADOR%" (
 start "" "%NAVEGADOR%" "%PAGINA%"
 goto :fin
)
rem Si no se encuentra el navegador, se abre como antes.
start "" "%PAGINA%"
:fin
endlocal
exit /b 0

rem El programa es la primera parte de la orden del registro, sin comillas.
:primero
set "NAVEGADOR=%~1"
exit /b 0
