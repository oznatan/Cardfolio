# Local server for the Collectr portfolio tracker. Windows PowerShell 5.1, no dependencies.
# Binds to localhost only. Never parses JSON: the browser app owns the logic, this just stores bytes.
param([int]$Port = 8787)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::SystemDefault

$Root       = $PSScriptRoot
$PublicDir  = Join-Path $Root 'public'
$DataDir    = Join-Path $Root 'data'
$BackupDir  = Join-Path $DataDir 'backups'
$StateFile  = Join-Path $DataDir 'state.json'
$SyncFile   = Join-Path $DataDir 'latest-sync.json'
$FxCache    = Join-Path $DataDir 'fx-cache.csv'

$SelfOrigin     = "http://localhost:$Port"
$MaxBody        = 20MB
$UserAgent      = 'PersonalPortfolioTracker/1.0'

New-Item -ItemType Directory -Force -Path $DataDir, $BackupDir | Out-Null

$MimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}

# The server normally runs with no window, so problems go to a file.
function Write-Log([string]$message) {
  Write-Host $message
  Add-Content -LiteralPath (Join-Path $DataDir 'server.log') -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $message" -Encoding UTF8
}

function Send-Bytes($ctx, [int]$status, [byte[]]$bytes, [string]$type) {
  $res = $ctx.Response
  $res.StatusCode = $status
  $res.ContentType = $type
  $res.Headers['Cache-Control'] = 'no-store'
  $res.ContentLength64 = $bytes.Length
  if ($bytes.Length -gt 0 -and $ctx.Request.HttpMethod -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
  $res.OutputStream.Close()
}

function Send-Text($ctx, [int]$status, [string]$text, [string]$type = 'text/plain; charset=utf-8') {
  Send-Bytes $ctx $status ([Text.Encoding]::UTF8.GetBytes($text)) $type
}

function Read-Body($ctx) {
  $len = $ctx.Request.ContentLength64
  if ($len -gt $MaxBody) { throw 'Body too large' }
  $ms = New-Object IO.MemoryStream
  $ctx.Request.InputStream.CopyTo($ms)
  if ($ms.Length -gt $MaxBody) { throw 'Body too large' }
  return ,$ms.ToArray()
}

function Write-Atomic([string]$path, [byte[]]$bytes) {
  $tmp = "$path.tmp"
  [IO.File]::WriteAllBytes($tmp, $bytes)
  Move-Item -LiteralPath $tmp -Destination $path -Force
}

function Send-Json($ctx, [int]$status, [string]$json) {
  Send-Text $ctx $status $json 'application/json; charset=utf-8'
}

# --- CompSniper. The key stays on this computer; the browser never receives it. ---
$CompsKeyFile   = Join-Path $DataDir 'compsniper-key.txt'
$CompsUsageFile = Join-Path $DataDir 'compsniper-usage.txt'
$CompsMonthlyCap = 95   # Stops short of the free plan's 100 requests, whatever the app asks for.

function Get-CompsUsed {
  $month = (Get-Date).ToString('yyyy-MM')
  if (Test-Path -LiteralPath $CompsUsageFile) {
    $parts = ([IO.File]::ReadAllText($CompsUsageFile)).Trim() -split ' '
    if ($parts.Count -eq 2 -and $parts[0] -eq $month) { return [int]$parts[1] }
  }
  return 0
}

function Add-CompsUsed {
  $text = '{0} {1}' -f (Get-Date).ToString('yyyy-MM'), ((Get-CompsUsed) + 1)
  Write-Atomic $CompsUsageFile ([Text.Encoding]::ASCII.GetBytes($text))
}

function Invoke-Comps($ctx, [string]$source, [string]$keyword) {
  if (-not (Test-Path -LiteralPath $CompsKeyFile)) { Send-Json $ctx 400 '{"code":"no_key"}'; return }
  if ((Get-CompsUsed) -ge $CompsMonthlyCap) { Send-Json $ctx 429 '{"code":"local_cap"}'; return }
  $q = [Uri]::EscapeDataString($keyword)
  if ($source -eq 'ebay') {
    $url = "https://api.compsniper.com/v1/scrape?keyword=$q&sold=true&buyingFormat=auction&sortOrder=endedRecently&count=60&exactMatch=true"
  } elseif ($source -eq 'fanatics') {
    $url = "https://api.compsniper.com/v1/fanatics/sold?keyword=$q&sortBy=recent"
  } else { Send-Json $ctx 400 '{"code":"bad_source"}'; return }

  $web = [Net.HttpWebRequest]::Create($url)
  $web.Method = 'GET'
  $web.UserAgent = $UserAgent
  $web.Accept = 'application/json'
  $web.Timeout = 90000
  $web.Headers['Authorization'] = 'Bearer ' + ([IO.File]::ReadAllText($CompsKeyFile)).Trim()
  try {
    $resp = $web.GetResponse()
  } catch {
    $ex = $_.Exception
    while ($ex -and -not ($ex -is [Net.WebException])) { $ex = $ex.InnerException }
    if (-not $ex -or -not $ex.Response) { throw }
    $resp = $ex.Response
  }
  try {
    $status = [int]$resp.StatusCode
    $ms = New-Object IO.MemoryStream
    $resp.GetResponseStream().CopyTo($ms)
    foreach ($h in 'X-Usage-Limit', 'X-Usage-Remaining', 'X-Credit-Balance') {
      if ($resp.Headers[$h]) { $ctx.Response.Headers[$h] = $resp.Headers[$h] }
    }
    if ($status -eq 200) { Add-CompsUsed }
    Send-Bytes $ctx $status $ms.ToArray() 'application/json; charset=utf-8'
  } finally { $resp.Close() }
}

# --- One data file per tracked portfolio. "main" keeps the original file name. ---
$PortfoliosFile = Join-Path $DataDir 'portfolios.json'

function Get-StatePath([string]$id) {
  if (-not $id -or $id -eq 'main') { return $StateFile }
  if ($id -cmatch '^[a-z0-9]{1,24}$') { return (Join-Path $DataDir "state-$id.json") }
  return $null
}

function Test-Handle([string]$handle) { return $handle -match '^[A-Za-z0-9][A-Za-z0-9_.-]{0,39}$' -and $handle -notmatch '\.\.' }

# Latest full sync per Collectr profile; no handle means the file the first version used.
function Get-SyncPath([string]$handle) {
  if (-not $handle) { return $SyncFile }
  if (Test-Handle $handle) { return (Join-Path $DataDir ("sync-{0}.json" -f $handle.ToLowerInvariant())) }
  return $null
}

function Get-StateVersion([string]$path) {
  if (Test-Path -LiteralPath $path) { return (Get-Item -LiteralPath $path).LastWriteTimeUtc.Ticks.ToString() }
  return '0'
}

function Get-Remote([string]$url) {
  $wc = New-Object Net.WebClient
  $wc.Headers['User-Agent'] = $UserAgent
  try { return ,$wc.DownloadData($url) } finally { $wc.Dispose() }
}

# Returns cached bytes when fresh; refreshes otherwise; serves stale cache if the source is down.
function Get-Cached([string]$file, [string]$url, [int]$maxAgeMinutes) {
  $exists = Test-Path -LiteralPath $file
  if ($exists -and ((Get-Date) - (Get-Item -LiteralPath $file).LastWriteTime).TotalMinutes -lt $maxAgeMinutes) {
    return ,[IO.File]::ReadAllBytes($file)
  }
  try {
    [byte[]]$bytes = Get-Remote $url
    Write-Atomic $file $bytes
    return ,$bytes
  } catch {
    if ($exists) { return ,[IO.File]::ReadAllBytes($file) }
    throw
  }
}

function Handle-Static($ctx, [string]$path) {
  if ($path -eq '/') { $path = '/index.html' }
  $relative = $path.TrimStart('/').Replace('/', '\')
  $full = [IO.Path]::GetFullPath((Join-Path $PublicDir $relative))
  $publicRoot = [IO.Path]::GetFullPath($PublicDir) + '\'
  if (-not $full.StartsWith($publicRoot, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
    Send-Text $ctx 404 'Not found'
    return
  }
  $type = $MimeTypes[[IO.Path]::GetExtension($full).ToLowerInvariant()]
  if (-not $type) { Send-Text $ctx 404 'Not found'; return }
  Send-Bytes $ctx 200 ([IO.File]::ReadAllBytes($full)) $type
}

$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Log "Could not start on port ${Port}: $_"
  exit 1
}
Write-Host "Portfolio tracker running at $SelfOrigin (Ctrl+C or close this window to stop)" -ForegroundColor Green

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $req    = $ctx.Request
    $path   = $req.Url.AbsolutePath
    $method = $req.HttpMethod
    $origin = $req.Headers['Origin']

    if ($path -eq '/api/sync') {
      if ($method -eq 'POST') {
        $syncPath = Get-SyncPath $req.QueryString['handle']
        if ($origin -ne $SelfOrigin) { Send-Text $ctx 403 'Forbidden origin' }
        elseif (-not $syncPath) { Send-Text $ctx 400 'Bad handle' }
        else {
          [byte[]]$body = Read-Body $ctx
          Write-Atomic $syncPath $body
          Send-Text $ctx 200 'ok'
        }
      } else { Send-Text $ctx 405 'Method not allowed' }
    }
    elseif ($path -eq '/api/state') {
      $statePath = Get-StatePath $req.QueryString['p']
      if (-not $statePath) { Send-Text $ctx 400 'Bad portfolio id' }
      elseif ($method -eq 'GET') {
        $ctx.Response.Headers['X-State-Version'] = Get-StateVersion $statePath
        if (Test-Path -LiteralPath $statePath) { Send-Bytes $ctx 200 ([IO.File]::ReadAllBytes($statePath)) 'application/json; charset=utf-8' }
        else { Send-Text $ctx 200 '{}' 'application/json; charset=utf-8' }
      } elseif ($method -eq 'PUT') {
        if ($origin -ne $SelfOrigin) { Send-Text $ctx 403 'Forbidden origin' }
        # A save must name the version it was based on, so a stale tab can never overwrite newer data.
        elseif ($req.Headers['X-State-Version'] -ne (Get-StateVersion $statePath)) { Send-Text $ctx 409 'State changed' }
        else {
          [byte[]]$body = Read-Body $ctx
          if (Test-Path -LiteralPath $statePath) {
            $name = [IO.Path]::GetFileNameWithoutExtension($statePath)
            $backup = Join-Path $BackupDir ("{0}-{1}.json" -f $name, (Get-Date -Format 'yyyy-MM-dd'))
            if (-not (Test-Path -LiteralPath $backup)) { Copy-Item -LiteralPath $statePath -Destination $backup }
          }
          Write-Atomic $statePath $body
          Send-Text $ctx 200 'ok'
        }
      } else { Send-Text $ctx 405 'Method not allowed' }
    }
    elseif ($path -eq '/api/portfolios') {
      if ($method -eq 'GET') {
        if (Test-Path -LiteralPath $PortfoliosFile) { Send-Bytes $ctx 200 ([IO.File]::ReadAllBytes($PortfoliosFile)) 'application/json; charset=utf-8' }
        else { Send-Json $ctx 200 '[]' }
      } elseif ($method -eq 'PUT') {
        if ($origin -ne $SelfOrigin) { Send-Text $ctx 403 'Forbidden origin' }
        else {
          [byte[]]$body = Read-Body $ctx
          if ($body.Length -gt 200KB) { Send-Text $ctx 413 'Too large' }
          else { Write-Atomic $PortfoliosFile $body; Send-Text $ctx 200 'ok' }
        }
      } else { Send-Text $ctx 405 'Method not allowed' }
    }
    elseif ($path -eq '/api/comps/key') {
      if ($origin -ne $SelfOrigin) { Send-Text $ctx 403 'Forbidden origin' }
      elseif ($method -eq 'DELETE') {
        if (Test-Path -LiteralPath $CompsKeyFile) { Remove-Item -LiteralPath $CompsKeyFile -Force }
        Send-Json $ctx 200 '{"hasKey":false}'
      } elseif ($method -eq 'PUT') {
        $key = [Text.Encoding]::UTF8.GetString((Read-Body $ctx)).Trim()
        if ($key -notmatch '^[A-Za-z0-9_\-]{10,200}$') { Send-Json $ctx 400 '{"code":"bad_key"}' }
        else {
          Write-Atomic $CompsKeyFile ([Text.Encoding]::ASCII.GetBytes($key))
          Send-Json $ctx 200 '{"hasKey":true}'
        }
      } else { Send-Text $ctx 405 'Method not allowed' }
    }
    elseif ($path -eq '/api/comps/fetch') {
      # POST with our own Origin only, so no other website can spend the monthly requests.
      if ($method -ne 'POST') { Send-Text $ctx 405 'Method not allowed' }
      elseif ($origin -ne $SelfOrigin) { Send-Text $ctx 403 'Forbidden origin' }
      else {
        $keyword = $req.QueryString['keyword']
        if (-not $keyword -or $keyword.Length -gt 200) { Send-Json $ctx 400 '{"code":"bad_keyword"}' }
        else { Invoke-Comps $ctx $req.QueryString['source'] $keyword }
      }
    }
    elseif ($method -ne 'GET' -and $method -ne 'HEAD') { Send-Text $ctx 405 'Method not allowed' }
    elseif ($path -eq '/api/comps/status') {
      $has = if (Test-Path -LiteralPath $CompsKeyFile) { 'true' } else { 'false' }
      Send-Json $ctx 200 ('{{"hasKey":{0},"usedThisMonth":{1},"cap":{2}}}' -f $has, (Get-CompsUsed), $CompsMonthlyCap)
    }
    elseif ($path -eq '/api/sync-stamp') {
      $syncPath = Get-SyncPath $req.QueryString['handle']
      $stamp = if ($syncPath -and (Test-Path -LiteralPath $syncPath)) { (Get-Item -LiteralPath $syncPath).LastWriteTimeUtc.Ticks.ToString() } else { '' }
      Send-Text $ctx 200 $stamp
    }
    elseif ($path -eq '/api/latest-sync') {
      $syncPath = Get-SyncPath $req.QueryString['handle']
      if ($syncPath -and (Test-Path -LiteralPath $syncPath)) { Send-Bytes $ctx 200 ([IO.File]::ReadAllBytes($syncPath)) 'application/json; charset=utf-8' }
      else { Send-Text $ctx 404 'No sync yet' }
    }
    elseif ($path -eq '/api/fx') {
      $end = (Get-Date).ToString('yyyy-MM-dd')
      $url = "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/RER_USD_ILS?startperiod=2010-01-01&endperiod=$end&format=csv"
      [byte[]]$bytes = Get-Cached $FxCache $url 60
      Send-Bytes $ctx 200 $bytes 'text/csv; charset=utf-8'
    }
    elseif ($path -eq '/api/collectr-page') {
      $handle = $req.QueryString['handle']
      if (-not $handle) { $handle = 'aactnv' }
      if (-not (Test-Handle $handle)) { Send-Text $ctx 400 'Bad handle' }
      else {
        $cache = Join-Path $DataDir ("collectr-page-{0}.html" -f $handle.ToLowerInvariant())
        [byte[]]$bytes = Get-Cached $cache "https://app.getcollectr.com/showcase/profile/@$handle" 30
        Send-Bytes $ctx 200 $bytes 'text/plain; charset=utf-8'
      }
    }
    else { Handle-Static $ctx $path }
  } catch {
    Write-Log "Error on $($ctx.Request.HttpMethod) $($ctx.Request.Url.AbsolutePath): $_"
    try { Send-Text $ctx 502 "Error: $_" } catch { }
  }
}
