@echo off
title Stock Tracker Backend Server
color 0A

echo =========================================
echo   Stock Tracker Backend Server
echo =========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed!
    echo Please install Python from python.org
    pause
    exit /b
)

echo Installing/Updating dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo.
echo =========================================
echo   Server Starting...
echo   Backend URL: http://localhost:8000
echo   Network URL: http://YOUR_IP:8000
echo   API Docs: http://localhost:8000/docs
echo =========================================
echo.
echo Finding your IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Your IP: !IP!
    echo Mobile App URL: http://!IP!:8000
)
echo.
echo Press CTRL+C to stop the server
echo =========================================
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

pause
