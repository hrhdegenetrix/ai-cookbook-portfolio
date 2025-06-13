@echo off
title Chef Izzy's AI Recipe Generator - Setup
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║                    🍳 Chef Izzy's AI Cookbook                   ║
echo  ║                       Windows Setup Installer                   ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Check for Node.js
echo [1/5] Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install the LTS version
    echo 3. Restart your computer
    echo 4. Run this setup again
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected

:: Check for npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detected
echo.

:: Install dependencies
echo [2/5] Installing application dependencies...
echo This may take a few minutes...
echo.

call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

:: Setup database
echo [3/5] Setting up database...
cd backend
call npx prisma generate >nul 2>&1
call npx prisma db push >nul 2>&1
cd ..
echo ✅ Database configured
echo.

:: Create launcher script
echo [4/5] Creating application launcher...

echo @echo off > "Chef Izzy Recipe Generator.bat"
echo title Chef Izzy's AI Recipe Generator >> "Chef Izzy Recipe Generator.bat"
echo color 0A >> "Chef Izzy Recipe Generator.bat"
echo cls >> "Chef Izzy Recipe Generator.bat"
echo. >> "Chef Izzy Recipe Generator.bat"
echo echo  ╔══════════════════════════════════════════════════════════════════╗ >> "Chef Izzy Recipe Generator.bat"
echo echo  ║                    🍳 Chef Izzy's AI Cookbook                   ║ >> "Chef Izzy Recipe Generator.bat"
echo echo  ║                     Starting Application...                     ║ >> "Chef Izzy Recipe Generator.bat"
echo echo  ╚══════════════════════════════════════════════════════════════════╝ >> "Chef Izzy Recipe Generator.bat"
echo echo. >> "Chef Izzy Recipe Generator.bat"
echo echo ⚡ Starting backend server... >> "Chef Izzy Recipe Generator.bat"
echo echo ⚡ Starting frontend server... >> "Chef Izzy Recipe Generator.bat"
echo echo ⚡ Opening browser... >> "Chef Izzy Recipe Generator.bat"
echo echo. >> "Chef Izzy Recipe Generator.bat"
echo echo Your recipe generator will open in your browser shortly! >> "Chef Izzy Recipe Generator.bat"
echo echo Close this window to stop the application. >> "Chef Izzy Recipe Generator.bat"
echo echo. >> "Chef Izzy Recipe Generator.bat"
echo call npm run dev >> "Chef Izzy Recipe Generator.bat"

:: Create desktop shortcut (if possible)
echo [5/5] Creating shortcuts...

:: Create a VBS script to make a proper shortcut with icon
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%USERPROFILE%\Desktop\Chef Izzy Recipe Generator.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%CD%\Chef Izzy Recipe Generator.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%CD%" >> CreateShortcut.vbs
echo oLink.Description = "Chef Izzy's AI Recipe Generator - Transform ingredients into delicious recipes!" >> CreateShortcut.vbs
echo oLink.IconLocation = "%CD%\Chef_izzy.png" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

cscript CreateShortcut.vbs >nul 2>&1
del CreateShortcut.vbs >nul 2>&1

echo ✅ Launcher created: "Chef Izzy Recipe Generator.bat"
if exist "%USERPROFILE%\Desktop\Chef Izzy Recipe Generator.lnk" (
    echo ✅ Desktop shortcut created
)
echo.

:: Success message
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║                        🎉 SETUP COMPLETE! 🎉                    ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Quick Start Options:
echo.
echo   1. Double-click: "Chef Izzy Recipe Generator.bat"
echo   2. Or run: npm run dev
echo   3. Or use the desktop shortcut (if created)
echo.
echo 📝 Next Steps:
echo   • The app will open in your browser automatically
echo   • You'll be prompted for your OpenAI API key on first use
echo   • Get your API key at: https://platform.openai.com/api-keys
echo.
echo 💡 Tips:
echo   • Keep the terminal window open while using the app
echo   • Close the terminal to stop the application
echo   • Your recipes are saved automatically to a local database
echo.
echo Ready to start cooking with AI? 👨‍🍳✨
echo.
pause

:: Ask if user wants to start now
set /p "choice=Would you like to start Chef Izzy now? (y/n): "
if /i "%choice%" == "y" (
    echo.
    echo Starting Chef Izzy's AI Recipe Generator...
    call "Chef Izzy Recipe Generator.bat"
)

exit /b 0 