[CmdletBinding()]
param(
    [ValidateSet('transfer','verify','rollback')][string]$Mode = 'verify',
    [string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev')
)
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'transfer-admin.mjs'
Push-Location -LiteralPath $OperatorDirectory
try {
    & node $script $Mode
    if ($LASTEXITCODE -ne 0) { throw 'Admin transfer check failed. Review the diagnostic above.' }
} finally { Pop-Location }
