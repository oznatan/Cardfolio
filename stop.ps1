# Stops the background tracker server. Saved data is not affected.
$server = Join-Path $PSScriptRoot 'server.ps1'
$running = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
  Where-Object { $_.CommandLine -and $_.CommandLine.Contains($server) }

if (-not $running) {
  Write-Host 'The tracker server is not running.'
} else {
  $running | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  Write-Host 'The tracker server was stopped.'
}
