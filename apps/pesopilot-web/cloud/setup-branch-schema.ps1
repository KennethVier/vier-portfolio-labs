[CmdletBinding()]
param([string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'))
$ErrorActionPreference = 'Stop'
$stamp = [guid]::NewGuid().ToString()
$before = Join-Path $OperatorDirectory ("branch-schema-before-" + $stamp + '.json')
$patch = Join-Path $OperatorDirectory ("branch-schema-additive-" + $stamp + '.json')
$after = Join-Path $OperatorDirectory ("branch-schema-after-" + $stamp + '.json')
$checker = Join-Path $PSScriptRoot 'branch-schema-cli.mjs'
Push-Location -LiteralPath $OperatorDirectory
try {
    & npx.cmd --yes dexie-cloud@3.0.7 export --schema $before
    if ($LASTEXITCODE -ne 0) { throw 'Authenticated schema export failed.' }
    & node $checker prepare $before $patch
    if ($LASTEXITCODE -ne 0) { throw 'Read-only schema preflight failed.' }
    $existing = (Get-Content -Raw -LiteralPath $before | ConvertFrom-Json).schema
    $planned = (Get-Content -Raw -LiteralPath $patch | ConvertFrom-Json).schema
    $missing = @($planned.PSObject.Properties | Where-Object { $null -eq $existing.PSObject.Properties[$_.Name] })
    if ($missing.Count -gt 0) {
        & npx.cmd --yes dexie-cloud@3.0.7 import $patch
        if ($LASTEXITCODE -ne 0) { throw 'Additive import failed. Retain exports; retry after inspection.' }
    } else { Write-Output 'All operational tables already exist. Skipped import.' }
    & npx.cmd --yes dexie-cloud@3.0.7 export --schema $after
    if ($LASTEXITCODE -ne 0) { throw 'Read-back failed. Do not use operations until verified.' }
    & node $checker verify $after $before
    if ($LASTEXITCODE -ne 0) { throw 'Read-back verification failed.' }
} finally { Pop-Location }
