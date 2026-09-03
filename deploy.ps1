# deploy.ps1 - Day code moi len GitHub roi build + restart tren VPS
# Cach dung:  .\deploy.ps1                 (commit tu dong, user ssh = root)
#             .\deploy.ps1 -User deploy    (neu ban da tao user deploy tren VPS)
#             .\deploy.ps1 -Message "sua trang gio hang"

param(
    [string]$User    = "root",                  # user SSH tren VPS
    [string]$Vps     = "103.72.98.210",         # IP VPS
    [string]$AppDir  = "/var/www/hoangnha",     # thu muc code tren VPS
    [string]$AppName = "hoangnha",              # ten process trong PM2
    [string]$Message = ""                       # noi dung commit; de trong = tu sinh
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot                      # luon chay tai thu muc chua script

# --- Buoc 1: commit + push code moi -----------------------------------------
Write-Host "`n[1/2] Day code len GitHub..." -ForegroundColor Cyan

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "  Branch hien tai: $branch"

# git status --porcelain tra ve rong = khong co gi thay doi
$changed = git status --porcelain
if ($changed) {
    Write-Host "  Co thay doi chua commit:" -ForegroundColor Yellow
    $changed | Select-Object -First 20 | ForEach-Object { Write-Host "    $_" }
    if ($changed.Count -gt 20) { Write-Host "    ... va $($changed.Count - 20) file nua" }

    if (-not $Message) { $Message = "cap nhat web $(Get-Date -Format 'dd/MM HH:mm')" }
    git add -A
    git commit -m $Message
} else {
    Write-Host "  Khong co thay doi moi, bo qua commit." -ForegroundColor DarkGray
}

git push origin $branch
if ($LASTEXITCODE -ne 0) { throw "git push that bai - kiem tra ket noi hoac quyen repo" }

# --- Buoc 2: keo ve VPS, build, restart -------------------------------------
Write-Host "`n[2/2] Deploy tren VPS $Vps..." -ForegroundColor Cyan

# Chuoi lenh chay ben Linux. Dung dau nhay don o ngoai de PowerShell khong noi suy bien.
$remote = @"
set -e
if [ ! -d $AppDir/.git ]; then
  echo 'LOI: $AppDir chua ton tai -> VPS chua setup lan dau. Xem docs/DEPLOY-VPS.md'
  exit 1
fi
cd $AppDir
git fetch origin
git reset --hard origin/$branch     # lay dung ban tren GitHub, bo qua sua doi lat vat tren VPS
npm run build:all
pm2 restart $AppName || pm2 start npm --name $AppName -- start
pm2 save
pm2 status
"@

# -o StrictHostKeyChecking=accept-new: lan dau ket noi khong hoi yes/no
ssh -o StrictHostKeyChecking=accept-new "$User@$Vps" $remote
if ($LASTEXITCODE -ne 0) { throw "Deploy tren VPS that bai - xem log o tren" }

Write-Host "`nXong. Kiem tra: https://hoangnha.io.vn" -ForegroundColor Green
