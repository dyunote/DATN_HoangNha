@echo off
chcp 65001 >nul
echo ============================================
echo  Gop tat ca thanh 1 commit + day len GitHub
echo ============================================
echo.

cd /d "%~dp0"

if exist ".git\index.lock" del ".git\index.lock"

REM Tao lich su moi chi gom 1 commit (tat ca file cung 1 message)
git checkout --orphan _new
git add -A
git commit -m "Cap nhat source website Hoang Nha"

REM Thay nhanh main bang lich su moi
git branch -D main 2>nul
git branch -M _new main

REM Day de len master tren GitHub
git push -f origin main:master

echo.
echo ============================================
echo  XONG. Refresh: https://github.com/dyunote/DATN_HoangNha
echo ============================================
pause
