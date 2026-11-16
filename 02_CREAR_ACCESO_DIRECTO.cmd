@echo off
rem MiCurriculum - crea en el escritorio el acceso directo "MiCurriculum", con su icono.
rem MiCurriculum - creates the "MiCurriculum" desktop shortcut, with its icon.
rem Author:  Juan Bautista Galisteo Marques (@juangalisteo)
rem License: GPL-3.0-or-later (see LICENSE)
setlocal
chcp 65001 >nul
title MiCurriculum - Crear acceso directo
rem Las rutas salen de este archivo. Si mueves la carpeta MICURRICULUM, vuelve a abrir este archivo.
set "ABRIR=%~dp001_ABRIR.cmd"
set "ICONO=%~dp0APP\micurriculum.ico"
if not exist "%ABRIR%" (
 echo No se encuentra 01_ABRIR.cmd junto a este archivo.
 pause
 exit /b 1
)
if not exist "%ICONO%" (
 echo No se encuentra APP\micurriculum.ico junto a este archivo.
 pause
 exit /b 1
)
rem El acceso abre 01_ABRIR.cmd con la ventana minimizada (WindowStyle 7) y el icono del programa.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $path = Join-Path ([Environment]::GetFolderPath('Desktop')) 'MiCurriculum.lnk'; $lnk = $ws.CreateShortcut($path); $lnk.TargetPath = '%ABRIR%'; $lnk.WorkingDirectory = '%~dp0'; $lnk.IconLocation = '%ICONO%,0'; $lnk.Description = 'MiCurriculum - Haz tu curriculum'; $lnk.WindowStyle = 7; $lnk.Save(); Write-Host ('  Listo: ' + $path)"
if errorlevel 1 (
 echo   No se pudo crear el acceso directo.
) else (
 echo.
 echo   Ya tienes MiCurriculum en el escritorio. Abrelo con doble clic.
)
echo.
pause
endlocal
exit /b 0
