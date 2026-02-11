@echo off
title Stock Tracker Backend Server
color 0A
echo ========================================
echo   Stock Tracker Backend Server
echo ========================================
echo.

:: Set path
cd /d "C:\Users\KALUPAHANA AUTO CAR\Desktop\RICH LIGHT\Factory projects\Stock Tracker\a4-format-stock-tracker\backend"

:: Fix FastAPI dependency conflict first
echo Fixing dependencies...
python -m pip install --upgrade pip
python -m pip install fastapi==0.115.0
python -m pip install -r requirements.txt --no-deps

echo.
echo ========================================
echo   Backend Starting...
echo   URL: http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo ========================================
echo.

:: Use python -m to run uvicorn (works even if not in PATH)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
