@echo off
title Ativa Hub v2.0
echo Instalando dependencias...
call npm install
echo.
echo Iniciando Ativa Hub...
call npm run dev
pause
