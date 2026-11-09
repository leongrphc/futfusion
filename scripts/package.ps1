$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputFolder = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
$archivePath = Join-Path $outputFolder 'futfusion-sbc-0.7.2.zip'
$entries = @('manifest.json', 'src', 'icons', 'LICENSE', 'LICENSE-FutFox', 'README.md', 'INTEGRATION.md') |
    ForEach-Object { Join-Path $projectRoot $_ }
Compress-Archive -LiteralPath $entries -DestinationPath $archivePath -Force
Write-Output $archivePath
