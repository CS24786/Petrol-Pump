@echo off
title Diyal Filling Station - Desktop Shortcut Setup
color 0A
cls
echo ==============================================================
echo      DIYAL FILLING STATION - DESKTOP SHORTCUT INSTALLER
echo ==============================================================
echo.
echo Installing desktop shortcut for Diyal Filling Station...
echo.

cscript //nologo "%~dp0create_shortcut.vbs"

echo.
echo ==============================================================
echo [SUCCESS] Desktop Shortcut created successfully on your Windows Desktop!
echo Icon Name: "Diyal Filling Station" (Native Desktop App)
echo ==============================================================
echo.
pause
