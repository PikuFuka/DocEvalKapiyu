@echo off
setlocal

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "PYTHON_EXE=%BACKEND_DIR%\venom\Scripts\python.exe"
set "START_BAT=%PROJECT_ROOT%\start-all.bat"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\THESIS_2026 Start.lnk"

if not exist "%BACKEND_DIR%\manage.py" (
  echo [ERROR] Could not find backend\manage.py
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Could not find frontend\package.json
  pause
  exit /b 1
)

if not exist "%PYTHON_EXE%" (
  set "PYTHON_EXE=python"
)

echo Ensuring desktop shortcut is available...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$shell = New-Object -ComObject WScript.Shell; " ^
  "$shortcut = $shell.CreateShortcut($env:SHORTCUT_PATH); " ^
  "$shortcut.TargetPath = $env:START_BAT; " ^
  "$shortcut.WorkingDirectory = $env:PROJECT_ROOT; " ^
  "$shortcut.Description = 'Start THESIS_2026 backend and frontend, then open website'; " ^
  "$shortcut.IconLocation = $env:SystemRoot + '\System32\shell32.dll,220'; " ^
  "$shortcut.Save();"

if errorlevel 1 (
  echo [WARN] Could not create/update desktop shortcut: %SHORTCUT_PATH%
) else (
  echo Desktop shortcut ready: %SHORTCUT_PATH%
)

echo Starting backend server in background (same window)...
pushd "%BACKEND_DIR%"
start "" /B "%PYTHON_EXE%" manage.py runserver
popd

echo Waiting for services to boot...
timeout /t 6 /nobreak >nul

echo Opening website at http://localhost:3000 ...
start "" "http://localhost:3000"

echo Starting frontend server in this window...
cd /d "%FRONTEND_DIR%"
npm start

echo Frontend stopped. If backend is still running, press Ctrl+C once or close this window.
exit /b 0
