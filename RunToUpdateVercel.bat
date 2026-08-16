@echo off
setlocal enabledelayedexpansion
title RunToUpdateVercel

chcp 65001 >nul

cd /d "%~dp0"

echo ============================================================
echo  RunToUpdateVercel - auto git push + Vercel production deploy
echo ============================================================
echo.

rem --- optional custom commit message: RunToUpdateVercel.bat "your message" ---
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" (
    for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set "_d=%%a-%%b-%%c"
    for /f "tokens=1-2 delims=: " %%a in ("%time%") do set "_t=%%a-%%b"
    set "COMMIT_MSG=auto-update %_d% %_t%"
)

rem ---------------------------------------------------------------
echo [1/5] Staging all changes...
git add -A
if errorlevel 1 (
    echo [ERROR] git add failed.
    exit /b 1
)

echo [2/5] Checking for changes to commit...
git diff --cached --quiet
if errorlevel 1 (
    echo [INFO] Committing: %COMMIT_MSG%
    git commit -m "%COMMIT_MSG%"
    if errorlevel 1 (
        echo [ERROR] git commit failed.
        exit /b 1
    )
) else (
    echo [INFO] Nothing to commit, working tree clean.
)

echo [3/5] Pushing to websie/main...
git push websie main
if errorlevel 1 (
    echo [ERROR] git push failed.
    exit /b 1
)

echo [4/5] Running pre-deploy build check...
call bun run build
if errorlevel 1 (
    echo [ERROR] build failed, skipping deploy.
    exit /b 1
)

echo [5/5] Deploying to Vercel (production)...
call vercel --prod --yes
if errorlevel 1 (
    echo [ERROR] vercel deploy failed.
    exit /b 1
)

echo.
echo ============================================================
echo  DONE - committed, pushed, and deployed to Vercel.
echo ============================================================

endlocal
exit /b 0
