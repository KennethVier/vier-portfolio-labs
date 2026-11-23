[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Email,
    [string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev'),
    [switch]$VerifyOnly
)
$ErrorActionPreference = 'Stop'
$bootstrap = Join-Path $PSScriptRoot 'bootstrap-dev.mjs'
$manifest = Join-Path ([System.IO.Path]::GetTempPath()) ("pesopilot-bootstrap-" + [guid]::NewGuid() + ".json")
Push-Location -LiteralPath $OperatorDirectory
try {
    if (-not $VerifyOnly) {
        & node $bootstrap --prepare $Email $manifest
        if ($LASTEXITCODE -ne 0) { throw 'Owner preflight failed. See the diagnostic above.' }
        if (Test-Path -LiteralPath $manifest) {
            & npx.cmd --yes dexie-cloud@3.0.7 import $manifest
            if ($LASTEXITCODE -ne 0) { throw 'Dexie realm import failed. Correct the reported issue and rerun.' }
        }
    }
    & node $bootstrap --verify $Email
    if ($LASTEXITCODE -ne 0) { throw 'First Admin read-back did not pass.' }
    Write-Output 'Verified the application user, business realm owner, and accepted Admin membership.'
} finally {
    Pop-Location
    if (Test-Path -LiteralPath $manifest) { Remove-Item -LiteralPath $manifest }
}
