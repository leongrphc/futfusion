$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputFolder = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
$releaseVersion = (Get-Content -LiteralPath (Join-Path $projectRoot 'manifest.json') -Raw | ConvertFrom-Json).version
$archivePath = Join-Path $outputFolder ('futfusion-sbc-' + $releaseVersion + '.zip')
$entries = @('manifest.json', 'src', 'icons', 'LICENSE', 'LICENSE-FutFox', 'README.md', 'INTEGRATION.md', 'docs') |
    ForEach-Object { Join-Path $projectRoot $_ }
Compress-Archive -LiteralPath $entries -DestinationPath $archivePath -Force
Write-Output $archivePath
