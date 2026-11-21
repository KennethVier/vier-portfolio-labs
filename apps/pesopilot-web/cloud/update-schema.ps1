[CmdletBinding()]
param([string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'))
$ErrorActionPreference = 'Stop'
$checker = Join-Path $PSScriptRoot 'update-schema.mjs'
$stamp = [guid]::NewGuid().ToString()
$before = Join-Path $OperatorDirectory ("schema-before-" + $stamp + ".json")
$patch = Join-Path $OperatorDirectory ("schema-patch-" + $stamp + ".json")
$after = Join-Path $OperatorDirectory ("schema-after-" + $stamp + ".json")
Push-Location -LiteralPath $OperatorDirectory
try {
    & npx.cmd --yes dexie-cloud@3.0.7 export --schema $before
    if ($LASTEXITCODE -ne 0) { throw 'Schema export failed.' }
    & node $checker prepare $before $patch
    if ($LASTEXITCODE -ne 0) { throw 'Schema preflight failed.' }
    & npx.cmd --yes dexie-cloud@3.0.7 import $patch
    if ($LASTEXITCODE -ne 0) { throw 'Schema import failed. Original export retained for inspection.' }
    & npx.cmd --yes dexie-cloud@3.0.7 export --schema $after
    if ($LASTEXITCODE -ne 0) { throw 'Schema read-back export failed.' }
    & node $checker verify $after $before
    if ($LASTEXITCODE -ne 0) { throw 'Schema read-back failed.' }
    Write-Output "Schema verified. Before and after exports retained in $OperatorDirectory."
} finally { Pop-Location }
