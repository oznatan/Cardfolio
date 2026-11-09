# Starts the tracker server in the background (no window) if needed, then opens the app.
$url = 'http://localhost:8787'

function Test-Server {
  try {
    Invoke-WebRequest -UseBasicParsing "$url/api/sync-stamp" -TimeoutSec 2 | Out-Null
    return $true
  } catch { return $false }
}

if (-not (Test-Server)) {
  $server = Join-Path $PSScriptRoot 'server.ps1'
  Start-Process powershell.exe -WindowStyle Hidden -WorkingDirectory $PSScriptRoot `
    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$server`""
  $deadline = (Get-Date).AddSeconds(15)
  while (-not (Test-Server)) {
    if ((Get-Date) -gt $deadline) {
      Write-Host "The tracker server did not start. Details may be in data\server.log" -ForegroundColor Red
      exit 1
    }
    Start-Sleep -Milliseconds 300
  }
}

Start-Process $url
