@echo off
chcp 65001 >nul
echo ============================================
echo  Day source Hoang Nha len GitHub (thay the)
echo  Repo: dyunote/DATN_HoangNha
echo ============================================
echo.

cd /d "%~dp0"

REM Xoa lock neu lan truoc bi ket
if exist ".git\index.lock" del ".git\index.lock"

REM Khoi tao git neu chua co
if not exist ".git" (
    git init
)

git add .
git commit -m "Cap nhat source website Hoang Nha"
git branch -M main

REM Tro remote toi repo cua ban (xoa cu neu da co)
git remote remove origin 2>nul
git remote add origin https://github.com/dyunote/DATN_HoangNha.git

REM Day nhanh main local DE LEN nhanh master tren GitHub (nhanh mac dinh dang hien thi)
REM -f = ghi de thay the toan bo source cu
git push -f origin main:master

echo.
echo ============================================
echo  XONG. Kiem tra: https://github.com/dyunote/DATN_HoangNha
echo ============================================
pause
