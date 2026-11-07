# Jalankan demo SIMPOS + tunnel trycloudflare sekaligus.
# Pakai: powershell -ExecutionPolicy Bypass -File .\demo-tunnel.ps1
$ErrorActionPreference = "SilentlyContinue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$tmp  = "C:\Users\lenovo\AppData\Local\Temp\opencode"
$node = "C:\Users\lenovo\nodejs"
$cf   = "C:\Users\lenovo\cloudflared\cloudflared.exe"

Get-Process node, cloudflared | Stop-Process -Force
Start-Sleep 3

$env:Path = "$node;" + $env:Path
Start-Process -FilePath "$node\npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $root -WindowStyle Hidden `
  -RedirectStandardOutput "$tmp\vite.log" -RedirectStandardError "$tmp\vite.err"

for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep 2
  if ((Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { break }
}
Write-Host "Dev server: siap di http://127.0.0.1:5173"

Start-Process -FilePath $cf -ArgumentList "tunnel", "--url", "http://127.0.0.1:5173" -WindowStyle Hidden `
  -RedirectStandardOutput "$tmp\cf.log" -RedirectStandardError "$tmp\cf.err"

$url = $null
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep 2
  $m = Select-String -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" "$tmp\cf.log", "$tmp\cf.err" | Select-Object -Last 1
  if ($m) { $url = ($m.Line -replace '.*?(https://[a-z0-9-]+\.trycloudflare\.com).*', '$1'); break }
}

if (-not $url) { Write-Host "Tunnel gagal - cek $tmp\cf.err"; exit 1 }
Start-Sleep 5

Write-Host ""
Write-Host "Kasir  : $url/login"
Write-Host "Admin  : $url/admin/login"
Write-Host "Pemilik: $url/owner/login"
