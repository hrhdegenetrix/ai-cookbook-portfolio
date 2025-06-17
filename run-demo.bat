@echo off
echo 🍳 Starting AI Recipe Generator Demo...
echo.

echo 📦 Installing dependencies (if needed)...
call npm install
cd backend && call npm install && cd ..
cd frontend && call npm install && cd ..

echo.
echo 🚀 Starting the application...
echo Backend will start on http://localhost:5007
echo Frontend will start on http://localhost:3000
echo.

start /b cmd /c "cd backend && npm run dev"
timeout /t 3
start /b cmd /c "cd frontend && npm run dev"

echo ✅ Demo is starting up!
echo ✅ Open http://localhost:3000 in your browser
echo ✅ Press Ctrl+C to stop the demo
echo.
pause 