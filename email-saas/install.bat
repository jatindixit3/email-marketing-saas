@echo off
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo Installation failed. Please run this file as administrator or use Command Prompt.
    pause
    exit /b %errorlevel%
)
echo.
echo Installation complete!
echo.
echo To start the development server, run: npm run dev
echo Or double-click start-dev.bat
pause
