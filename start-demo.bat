@echo off
REM Starts the PMF app + a public tunnel for demo sharing.
REM Keep this window open while your demo is happening. Close it to stop.

setlocal
set PATH=C:\Users\Kat\node-v20.18.0-win-x64;%PATH%
cd /d "%~dp0"

echo ==============================================
echo   Starting PMF demo server...
echo ==============================================
start "PMF App Server" cmd /k "set PATH=C:\Users\Kat\node-v20.18.0-win-x64;%%PATH%% && npm run dev"

echo Waiting 15s for app to boot...
timeout /t 15 /nobreak >nul

echo ==============================================
echo   Opening public tunnel...
echo   The URL will appear in the next window.
echo   Share that URL with your team.
echo ==============================================
start "PMF Tunnel" cmd /k "set PATH=C:\Users\Kat\node-v20.18.0-win-x64;%%PATH%% && npx --yes localtunnel --port 3000 --subdomain sevengen-pmf"

echo.
echo Two windows opened:
echo   1) App Server  (keep open)
echo   2) Tunnel      (your public URL shows here)
echo.
echo Local: http://localhost:3000
echo Public: https://sevengen-pmf.loca.lt
echo.
echo When visitors open the .loca.lt link they'll see a warning page once -
echo tell them to click Continue. Only happens first time per browser.
echo.
pause
