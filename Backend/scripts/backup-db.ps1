# Backup harian database SIMPOS.
# - Lokal (XAMPP): jalankan otomatis lewat Task Scheduler/Startup Windows.
# - Server produksi (VPS): sesuaikan $DumpExe ke mysqldump sistem, jalankan via cron.
# Bila password MySQL sudah diset, tambahkan --password=ISI_PASSWORD
# sebelum nama database pada baris mysqldump di bawah.

$DbUser  = 'root'
$DbName  = 'dbsimpos'
$DumpExe = 'C:\xampp\mysql\bin\mysqldump.exe'
$OutDir  = 'C:\backups\simpos'
$Keep    = 14   # jumlah backup yang disimpan

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

# Sekali sehari saja: lewati bila backup untuk tanggal hari ini sudah ada.
$today = Get-Date -Format 'yyyy-MM-dd'
$sudahAda = Get-ChildItem $OutDir -Filter "$DbName-$today-*.sql" -ErrorAction SilentlyContinue |
    Select-Object -First 1
if ($sudahAda) {
    Write-Output "LEWATI: backup hari ini sudah ada ($($sudahAda.Name))"
    exit 0
}

$stamp   = Get-Date -Format 'yyyy-MM-dd-HHmm'
$outFile = Join-Path $OutDir "$DbName-$stamp.sql"

& $DumpExe --user=$DbUser --single-transaction --routines --triggers --result-file="$outFile" $DbName 2>$null

if ($LASTEXITCODE -eq 0 -and (Test-Path $outFile)) {
    # simpan hanya $Keep backup terbaru
    Get-ChildItem $OutDir -Filter "$DbName-*.sql" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip $Keep |
        ForEach-Object { Remove-Item $_.FullName -Force }
    Write-Output ("OK  {0}  ({1:N0} KB)" -f $outFile, ((Get-Item $outFile).Length / 1KB))
} else {
    if (Test-Path $outFile) { Remove-Item $outFile -Force }
    Write-Output "GAGAL: mysqldump tidak berhasil (cek path mysqldump.exe / status MySQL)"
    exit 1
}
