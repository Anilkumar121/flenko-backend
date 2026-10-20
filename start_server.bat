@echo off
title Flenko Platform Server
echo ===================================================
echo   FLENKO B2B PLATFORM - LOCAL SERVER
echo   Running at: http://localhost:3000
echo ===================================================
cd /d "%~dp0"
node server/app.js
pause
