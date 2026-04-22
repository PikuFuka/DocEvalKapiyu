@echo off
setlocal EnableExtensions

set "PROJECT_ROOT=%~dp0"
if "%PROJECT_ROOT:~-1%"=="\" set "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "PYTHON_EXE=%BACKEND_DIR%\venom\Scripts\python.exe"
set "START_BAT=%PROJECT_ROOT%\start-all.bat"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Document Evaluation.lnk"
set "ICON_SOURCE=%PROJECT_ROOT%\frontend\public\images\image.png"
set "ICON_TARGET=%PROJECT_ROOT%\THESIS_2026.ico"
set "BACKEND_URL=http://127.0.0.1:8000/"
set "FRONTEND_URL=http://127.0.0.1:3000/"
set "STARTED_ANY=0"
set "BROWSER=none"
set "BROWSER_ARGS="
set "REFRESH_SHORTCUT=0"

if /I "%~1"=="--refresh-shortcut" set "REFRESH_SHORTCUT=1"
if not exist "%SHORTCUT_PATH%" set "REFRESH_SHORTCUT=1"
if not exist "%ICON_TARGET%" set "REFRESH_SHORTCUT=1"

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

if "%REFRESH_SHORTCUT%"=="1" (
  echo Preparing shortcut icon from image.png...
  if exist "%ICON_SOURCE%" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$pngPath = $env:ICON_SOURCE; $icoPath = $env:ICON_TARGET; " ^
      "$pngBytes = [System.IO.File]::ReadAllBytes($pngPath); " ^
      "$ms = New-Object System.IO.MemoryStream; $bw = New-Object System.IO.BinaryWriter($ms); " ^
      "$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]1); " ^
      "$bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0); $bw.Write([Byte]0); " ^
      "$bw.Write([UInt16]1); $bw.Write([UInt16]32); " ^
      "$bw.Write([UInt32]$pngBytes.Length); $bw.Write([UInt32]22); " ^
      "$bw.Write($pngBytes); " ^
      "[System.IO.File]::WriteAllBytes($icoPath, $ms.ToArray()); " ^
      "$bw.Dispose(); $ms.Dispose();"
  ) else (
    echo [WARN] Icon source not found: %ICON_SOURCE%
  )

  echo Ensuring desktop shortcut is available...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$shell = New-Object -ComObject WScript.Shell; " ^
    "$shortcut = $shell.CreateShortcut($env:SHORTCUT_PATH); " ^
    "$shortcut.TargetPath = $env:START_BAT; " ^
    "$shortcut.WorkingDirectory = $env:PROJECT_ROOT; " ^
    "$shortcut.Description = 'Start THESIS_2026 backend and frontend, then open website'; " ^
    "if (Test-Path $env:ICON_TARGET) { $shortcut.IconLocation = $env:ICON_TARGET + ',0' } else { $shortcut.IconLocation = $env:SystemRoot + '\System32\shell32.dll,220' }; " ^
    "$shortcut.Save();"

  if errorlevel 1 (
    echo [WARN] Could not create/update desktop shortcut: %SHORTCUT_PATH%
  ) else (
    echo Desktop shortcut ready: %SHORTCUT_PATH%
  )
) else (
  echo Shortcut already exists. Skipping shortcut refresh.
)

call :is_url_ready "%BACKEND_URL%"
if errorlevel 1 (
  echo Starting backend server in this terminal...
  start "THESIS_2026 Backend" /B "%PYTHON_EXE%" "%BACKEND_DIR%\manage.py" runserver 127.0.0.1:8000 --skip-checks
  set "STARTED_ANY=1"
) else (
  echo Backend is already reachable on port 8000.
)

call :is_url_ready "%FRONTEND_URL%"
if errorlevel 1 (
  echo Starting frontend server in this terminal...
  start "THESIS_2026 Frontend" /B cmd /v:off /c "cd /d ""%FRONTEND_DIR%"" && npm run start:fast"
  set "STARTED_ANY=1"
) else (
  echo Frontend is already reachable on port 3000.
)

echo Waiting for backend to become ready...
call :wait_for_url "%BACKEND_URL%" "Backend" 90 2
if errorlevel 1 goto :startup_failed

echo Waiting for frontend to become ready...
call :wait_for_url "%FRONTEND_URL%" "Frontend" 120 2
if errorlevel 1 goto :startup_failed

echo Services are ready. Opening website at %FRONTEND_URL% ...
start "" "%FRONTEND_URL%"

if "%STARTED_ANY%"=="1" (
  echo.
  echo Keep this terminal open while using the app.
  echo Press Ctrl+C to stop backend and frontend.
  call :keep_console_alive
)

exit /b 0

:startup_failed
echo [ERROR] Startup did not complete successfully.
echo [ERROR] Check this terminal for backend/frontend logs.
exit /b 1

:is_url_ready
set "CHECK_URL=%~1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { " ^
  "$req = [System.Net.WebRequest]::Create('%CHECK_URL%'); $req.Method = 'GET'; $req.Timeout = 3000; " ^
  "$resp = $req.GetResponse(); $resp.Close(); exit 0 " ^
  "} catch [System.Net.WebException] { " ^
  "if ($_.Exception.Response) { $_.Exception.Response.Close(); exit 0 } else { exit 1 } " ^
  "} catch { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:wait_for_url
setlocal EnableDelayedExpansion
set "WAIT_URL=%~1"
set "WAIT_NAME=%~2"
set /a WAIT_RETRIES=%~3
set /a WAIT_SECONDS=%~4
set /a WAIT_COUNT=0

:wait_loop
call :is_url_ready "%WAIT_URL%"
if not errorlevel 1 (
  echo !WAIT_NAME! is ready: !WAIT_URL!
  endlocal & exit /b 0
)

set /a WAIT_COUNT+=1
if !WAIT_COUNT! GEQ !WAIT_RETRIES! (
  echo [ERROR] !WAIT_NAME! did not become ready in time: !WAIT_URL!
  endlocal & exit /b 1
)

echo Waiting for !WAIT_NAME! ... (!WAIT_COUNT!/!WAIT_RETRIES!)
timeout /t !WAIT_SECONDS! /nobreak >nul
goto :wait_loop

:keep_console_alive
timeout /t 3600 /nobreak >nul
goto :keep_console_alive
