@echo off
title AI Recipe Generator - Windows Setup

:: Clear screen for clean display
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
    echo X Node.js is not installed!
    echo.
    echo Please install Node.js 18.16.0 or higher from:
    echo https://nodejs.org/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
)

:: Show Node.js version (simplified - no complex parsing)
for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo ✓ Node.js found: %NODE_VERSION%
echo.

:: Check npm
echo [2/6] Checking npm installation...
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo X npm is not available!
    echo Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo ✓ npm found: v%NPM_VERSION%
echo.

:: Install backend dependencies
echo [3/6] Installing backend dependencies...
echo This may take a few minutes...
cd backend
if %ERRORLEVEL% neq 0 (
    echo X Backend directory not found!
    echo Make sure you're running this script from the project root directory.
    pause
    exit /b 1
)

npm install --silent
if %ERRORLEVEL% neq 0 (
    echo X Backend installation failed!
    echo.
    echo This might be due to:
    echo - Network connectivity issues
    echo - Node.js version compatibility
    echo - Permission issues
    echo.
    echo Try running: cd backend then npm install
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed!
cd ..

:: Install frontend dependencies  
echo [4/6] Installing frontend dependencies...
echo This may take a few minutes...
cd frontend
if %ERRORLEVEL% neq 0 (
    echo X Frontend directory not found!
    pause
    exit /b 1
)

npm install --silent
if %ERRORLEVEL% neq 0 (
    echo X Frontend installation failed!
    echo.
    echo Try running: cd frontend then npm install
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed!
cd ..

:: Setup database
echo [5/6] Setting up database...
cd backend
npx prisma generate --silent
if %ERRORLEVEL% neq 0 (
    echo X Database schema generation failed!
    echo.
    echo Try running: cd backend then npx prisma generate
    pause
    exit /b 1
)

npx prisma db push --accept-data-loss --silent
if %ERRORLEVEL% neq 0 (
    echo X Database setup failed!
    echo.
    echo Try running: cd backend then npx prisma db push
    pause
    exit /b 1
)
echo ✓ Database setup complete!
cd ..

:: Create launcher
echo [6/6] Creating application launcher...

:: Create simple launcher script
echo @echo off > start-app.bat
echo title AI Recipe Generator >> start-app.bat
echo cls >> start-app.bat
echo echo ================================================================ >> start-app.bat
echo echo          AI RECIPE GENERATOR - STARTING SERVERS >> start-app.bat
echo echo ================================================================ >> start-app.bat
echo echo. >> start-app.bat
echo echo Starting backend server... >> start-app.bat
echo start cmd /k "cd backend && npm start" >> start-app.bat
echo timeout /t 3 /nobreak ^> nul >> start-app.bat
echo echo Starting frontend server... >> start-app.bat  
echo start cmd /k "cd frontend && npm run dev" >> start-app.bat
echo echo. >> start-app.bat
echo echo ✓ AI Recipe Generator is starting! >> start-app.bat
echo echo   Backend API: http://localhost:5001 >> start-app.bat
echo echo   Frontend: http://localhost:3000 >> start-app.bat
echo echo. >> start-app.bat
echo echo Both servers are running in separate windows. >> start-app.bat
echo echo You can close this window now. >> start-app.bat
echo pause >> start-app.bat

echo ✓ Created start-app.bat launcher

echo.
echo ================================================================
echo                    🎉 INSTALLATION COMPLETE! 🎉
echo ================================================================
echo.
echo Your AI Recipe Generator is ready!
echo.
echo To start the application:
echo   Double-click "start-app.bat"
echo.
echo Or start manually:
echo   1. Open terminal in backend folder, run: npm start  
echo   2. Open another terminal in frontend folder, run: npm run dev
echo.
echo Access your app at: http://localhost:3000
echo.
echo Need help? Check README.md for detailed instructions.
echo.
pause 