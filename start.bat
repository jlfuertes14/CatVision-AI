@echo off
echo Starting CatVision AI...

:: Start Backend in a new window
echo Starting FastAPI Backend...
start "CatVision AI - Backend" cmd /k "cd backend && .venv\Scripts\uvicorn app.main:app --reload"

:: Start Frontend in a new window
echo Starting Next.js Frontend...
start "CatVision AI - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Application is starting!
echo Backend logs will appear in the "Backend" window (http://127.0.0.1:8000).
echo Frontend logs will appear in the "Frontend" window (http://localhost:3000).
echo.
pause
