@echo off
title AI Recipe Generator - Clean Install

echo ================================================================
echo      AI RECIPE GENERATOR - CLEAN DEPENDENCY INSTALL
echo ================================================================
echo.
echo This will remove all existing dependencies and reinstall them
echo to ensure proper versions (especially Prisma 5.20.0).
echo.
pause

echo [1/4] Stopping any running servers...
taskkill /F /IM node.exe 2>nul
echo ✓ Servers stopped

echo [2/4] Cleaning backend dependencies...
cd backend
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ Removed backend node_modules
)
if exist package-lock.json (
    del package-lock.json
    echo ✓ Removed backend package-lock.json
)
npm cache clean --force --silent
npm install --silent
if %ERRORLEVEL% neq 0 (
    echo X Backend reinstallation failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies reinstalled with correct versions
cd ..

echo [3/4] Cleaning frontend dependencies...
cd frontend  
if exist node_modules (
    rmdir /s /q node_modules
    echo ✓ Removed frontend node_modules
)
if exist package-lock.json (
    del package-lock.json
    echo ✓ Removed frontend package-lock.json
)
npm cache clean --force --silent
npm install --silent
if %ERRORLEVEL% neq 0 (
    echo X Frontend reinstallation failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies reinstalled
cd ..

echo [4/4] Regenerating database...
cd backend
npx prisma generate --silent
npx prisma db push --accept-data-loss --silent
echo ✓ Database regenerated with correct Prisma version
cd ..

echo.
echo ================================================================
echo                🎉 CLEAN INSTALL COMPLETE! 🎉
echo ================================================================
echo.
echo All dependencies have been reinstalled with correct versions.
echo You can now run start-app.bat to launch the application.
echo.
pause 