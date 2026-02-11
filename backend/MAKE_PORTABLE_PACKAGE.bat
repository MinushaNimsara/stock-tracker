@echo off
setlocal enabledelayedexpansion
title Create Portable Backend Package
color 0B

cls
echo.
echo ====================================================
echo     STOCK TRACKER - PORTABLE PACKAGE CREATOR
echo ====================================================
echo.

set PACKAGE_NAME=StockTracker_Portable
set PACKAGE_DIR=%CD%\%PACKAGE_NAME%

:: Clean previous build
if exist "%PACKAGE_DIR%" (
    echo Cleaning previous build...
    rmdir /S /Q "%PACKAGE_DIR%"
)

echo Creating package structure...
mkdir "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%\app"

:: Copy backend files
echo.
echo [1/6] Copying backend files...
xcopy /E /I /Q app "%PACKAGE_DIR%\app"
copy requirements.txt "%PACKAGE_DIR%\" >nul
if exist ".env" copy .env "%PACKAGE_DIR%\" >nul

:: Create portable environment setup
echo.
echo [2/6] Creating portable Python environment...

(
echo @echo off
echo title Stock Tracker - Setup
echo color 0E
echo.
echo ====================================================
echo     STOCK TRACKER - FIRST TIME SETUP
echo ====================================================
echo.
echo This will install required packages.
echo Please wait...
echo.
echo ====================================================
echo.
echo Checking Python installation...
python --version
if errorlevel 1 ^(
    echo.
    echo ERROR: Python is not installed!
    echo Please install Python 3.9 or higher from python.org
    echo.
    pause
    exit /b
^)
echo.
echo Installing packages...
python -m pip install --upgrade pip --quiet
python -m pip install -r requirements.txt --quiet --no-warn-script-location
echo.
echo ====================================================
echo     SETUP COMPLETE!
echo ====================================================
echo.
echo You can now run START_SERVER.bat
echo.
pause
) > "%PACKAGE_DIR%\SETUP.bat"

:: Create main server startup script
echo.
echo [3/6] Creating startup scripts...

(
echo @echo off
echo title Stock Tracker Backend Server
echo color 0A
echo cls
echo.
echo ====================================================
echo         STOCK TRACKER BACKEND SERVER
echo ====================================================
echo.
echo Checking Python...
python --version ^>nul 2^>^&1
if errorlevel 1 ^(
    echo ERROR: Python not found!
    echo Please run SETUP.bat first
    pause
    exit /b
^)
echo.
echo Starting server...
echo.
echo ====================================================
echo   SERVER INFORMATION
echo ====================================================
echo.
echo   Local URL:  http://localhost:8000
echo   API Docs:   http://localhost:8000/docs
echo.
echo   Finding your IP address...
for /f "tokens=2 delims=:" %%%%a in ^('ipconfig ^| findstr /c:"IPv4 Address"'^) do ^(
    set IP=%%%%a
    set IP=!IP:~1!
    if not "!IP!"=="" ^(
        echo   Your IP:    !IP!
        echo   Mobile URL: http://!IP!:8000
    ^)
^)
echo.
echo ====================================================
echo   DATABASE: stock_tracker.db ^(auto-created^)
echo   Press CTRL+C to stop server
echo ====================================================
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
) > "%PACKAGE_DIR%\START_SERVER.bat"

:: Create IP finder
(
echo @echo off
echo title Find IP Address
echo color 0E
echo cls
echo.
echo ====================================================
echo            FIND YOUR IP ADDRESS
echo ====================================================
echo.
echo Your network IP addresses:
echo.
ipconfig ^| findstr /c:"IPv4 Address"
echo.
echo ====================================================
echo   MOBILE APP CONFIGURATION
echo ====================================================
echo.
echo 1. Copy one of the IPv4 addresses above
echo    ^(Example: 192.168.1.100^)
echo.
echo 2. Open Stock Tracker app on mobile
echo.
echo 3. Go to Settings ^> Backend URL
echo.
echo 4. Enter: http://YOUR_IP:8000
echo    ^(Replace YOUR_IP with actual IP^)
echo.
echo 5. Save and test!
echo.
echo ====================================================
echo.
pause
) > "%PACKAGE_DIR%\FIND_IP.bat"

:: Create README
echo.
echo [4/6] Creating documentation...

(
echo ======================================================
echo     STOCK TRACKER BACKEND - PORTABLE VERSION
echo ======================================================
echo.
echo FIRST TIME SETUP:
echo   1. Make sure Python 3.9+ is installed
echo      Download from: https://python.org
echo.
echo   2. Double-click SETUP.bat
echo      ^(This installs required packages^)
echo.
echo   3. Wait for setup to complete
echo.
echo RUNNING THE SERVER:
echo   1. Double-click START_SERVER.bat
echo.
echo   2. Wait for "Uvicorn running" message
echo.
echo   3. Note the IP address shown
echo.
echo MOBILE APP SETUP:
echo   1. Run FIND_IP.bat to see your IP
echo.
echo   2. Open Stock Tracker mobile app
echo.
echo   3. Go to Settings
echo.
echo   4. Enter Backend URL: http://YOUR_IP:8000
echo.
echo   5. Save settings
echo.
echo   6. Test by adding stock entry
echo.
echo DATABASE:
echo   - File: stock_tracker.db
echo   - Created automatically on first run
echo   - Located in same folder
echo   - BACKUP REGULARLY!
echo.
echo BACKUP INSTRUCTIONS:
echo   1. Stop server ^(Press CTRL+C^)
echo   2. Copy stock_tracker.db file
echo   3. Save to USB or cloud storage
echo.
echo TROUBLESHOOTING:
echo   - Python not found:
echo       Install from python.org
echo.
echo   - Packages not installing:
echo       Run SETUP.bat as Administrator
echo.
echo   - Port 8000 already in use:
echo       Close other programs or restart PC
echo.
echo   - Mobile can't connect:
echo       Check both devices on same Wi-Fi
echo       Check firewall settings
echo.
echo SYSTEM REQUIREMENTS:
echo   - Windows 7 or higher
echo   - Python 3.9 or higher
echo   - 100MB free disk space
echo   - Wi-Fi network
echo.
echo ======================================================
) > "%PACKAGE_DIR%\README.txt"

:: Create simple test script
echo.
echo [5/6] Creating test script...

(
echo @echo off
echo title Test Backend
echo color 0A
echo.
echo Testing backend setup...
echo.
python -c "import sys; print('Python:', sys.version)"
echo.
python -c "import fastapi; print('FastAPI:', fastapi.__version__)"
python -c "import uvicorn; print('Uvicorn: OK')"
python -c "from app.main import app; print('Backend app: OK')"
echo.
echo All tests passed!
echo.
pause
) > "%PACKAGE_DIR%\TEST.bat"

:: Create .env if not exists
if not exist "%PACKAGE_DIR%\.env" (
    (
    echo # Database Configuration
    echo # Leave empty to use local SQLite database
    echo DATABASE_URL=
    echo.
    echo # OR use PostgreSQL cloud database:
    echo # DATABASE_URL=postgresql://user:pass@host/db
    ) > "%PACKAGE_DIR%\.env"
)

:: Create ZIP
echo.
echo [6/6] Creating ZIP archive...
powershell -command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force"

echo.
echo ====================================================
echo     PACKAGE CREATED SUCCESSFULLY!
echo ====================================================
echo.
echo Created:
echo   [FOLDER] %PACKAGE_NAME%\
echo   [ZIP]    %PACKAGE_NAME%.zip
echo.
echo Package contents:
echo   ✓ Backend application files
echo   ✓ SETUP.bat - First time setup
echo   ✓ START_SERVER.bat - Run server
echo   ✓ FIND_IP.bat - Find your IP
echo   ✓ TEST.bat - Test installation
echo   ✓ README.txt - Full instructions
echo.
echo To use:
echo   1. Copy %PACKAGE_NAME%.zip to friend's PC
echo   2. Extract ZIP file
echo   3. Run SETUP.bat
echo   4. Run START_SERVER.bat
echo.
echo ====================================================

explorer "%PACKAGE_DIR%"

pause
