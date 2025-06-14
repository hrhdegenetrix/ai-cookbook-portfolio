@echo off
setlocal enabledelayedexpansion
title AI Recipe Generator - Windows Setup

:: Clear the screen for clean display
cls

echo ================================================================
echo          AI RECIPE GENERATOR - PORTFOLIO PROJECT
echo              Windows Installation Script
echo ================================================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js 18.16.0 or higher from:
    echo https://nodejs.org/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
)

:: Get Node.js version and check compatibility
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✅ Node.js found: %NODE_VERSION%

:: Extract major and minor version numbers for comparison
set VERSION_NUM=%NODE_VERSION:v=%
for /f "tokens=1,2 delims=." %%a in ("%VERSION_NUM%") do (
    set MAJOR=%%a
    set MINOR=%%b
)

:: Check if version is compatible (>=18.16)
if %MAJOR% lss 18 (
    echo ❌ Node.js version %NODE_VERSION% is too old!
    echo ❌ This project requires Node.js 18.16.0 or higher.
    echo.
    echo Please update Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
if %MAJOR% equ 18 if %MINOR% lss 16 (
    echo ❌ Node.js version %NODE_VERSION% is too old!
    echo ❌ This project requires Node.js 18.16.0 or higher.
    echo.
    echo Please update Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version is compatible!
echo.

:: Check if npm is installed
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ npm is not installed!
    echo Please install npm or reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo ✅ npm found: v%NPM_VERSION%
echo.

:: Install backend dependencies
echo [3/6] Installing backend dependencies...
cd backend
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

echo Installing backend packages (this may take a few minutes)...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed!
cd ..
echo.

:: Install frontend dependencies
echo [4/6] Installing frontend dependencies...
cd frontend
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend directory not found!
    pause
    exit /b 1
)

echo Installing frontend packages (this may take a few minutes)...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed!
cd ..
echo.

:: Setup database
echo [5/6] Setting up database...
cd backend
npx prisma generate
if %ERRORLEVEL% neq 0 (
    echo ❌ Database schema generation failed!
    pause
    exit /b 1
)

npx prisma db push
if %ERRORLEVEL% neq 0 (
    echo ❌ Database setup failed!
    pause
    exit /b 1
)
echo ✅ Database setup complete!
cd ..
echo.

:: Create desktop shortcuts and launchers
echo [6/6] Creating shortcuts and launchers...

:: Create start-app.bat launcher
(
echo @echo off
echo title AI Recipe Generator - Servers
echo echo Starting AI Recipe Generator...
echo echo Backend starting on port 5001...
echo start cmd /k "cd backend && npm start"
echo timeout /t 3 /nobreak ^> nul
echo echo Frontend starting on port 3000...
echo start cmd /k "cd frontend && npm run dev"
echo echo.
echo echo ✅ AI Recipe Generator is starting!
echo echo   Backend: http://localhost:5001
echo echo   Frontend: http://localhost:3000
echo echo.
echo echo Both servers are now running in separate windows.
echo echo Close this window when you're done.
echo pause
) > start-app.bat

echo ✅ Created start-app.bat launcher
echo.

echo ================================================================
echo                    🎉 INSTALLATION COMPLETE! 🎉
echo ================================================================
echo.
echo Your AI Recipe Generator is ready to use!
echo.
echo 📁 Files created:
echo   • start-app.bat - Launch the application
echo.
echo 🚀 To start the application:
echo   1. Double-click "start-app.bat" to launch both servers
echo   2. Or manually run:
echo      - Backend: cd backend && npm start
echo      - Frontend: cd frontend && npm run dev
echo.
echo 🌐 Access URLs:
echo   • Frontend: http://localhost:3000
echo   • Backend API: http://localhost:5001
echo.
echo 📖 Need help? Check the README.md file for detailed instructions.
echo.
echo ================================================================
pause 