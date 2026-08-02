@echo off
title Codex Detective - Launcher
echo ============================================
echo   Codex Detective - Multi-Agent AI Workspace
echo ============================================
echo.

REM ---- Check Python ----
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Install Python 3.10+ and re-run.
    pause
    exit /b 1
)

REM ---- Setup Backend ----
echo [1/3] Setting up backend environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo       Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
)
call backend\venv\Scripts\activate.bat >nul 2>nul
cd backend
echo       Installing backend dependencies (first time only)...
call venv\Scripts\pip install -r requirements.txt
cd ..

echo.
echo [2/3] Starting Backend on http://localhost:8000 ...
start "Codex Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM ---- Setup Frontend ----
echo [3/3] Starting Frontend on http://localhost:5173 ...
cd frontend
if not exist "node_modules" (
    echo       Installing frontend dependencies...
    call npm install
)
start "Codex Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
cd ..

echo.
echo ============================================
echo   Codex Detective is starting up...
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo ============================================
echo.
echo   Opening browser in 5 seconds...
timeout /t 5 >nul
start http://localhost:5173
echo.
echo   To stop: close the two "Codex Backend" / "Codex Frontend" windows.
pause

