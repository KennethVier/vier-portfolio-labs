[CmdletBinding()]
param(
    [ValidateSet('provision','audit','remove-developer')][string]$Mode = 'audit',
    [string]$Email,
    [switch]$BusinessAdminVerified,
    [string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev')
)
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'staff-accounts.mjs'
Push-Location -LiteralPath $OperatorDirectory
try {
    if ($Mode -eq 'remove-developer' -and $BusinessAdminVerified) {
        & node $script $Mode --business-admin-verified
    } elseif ($Mode -eq 'provision') {
        & node $script $Mode $Email
    } else {
        & node $script $Mode
    }
    if ($LASTEXITCODE -ne 0) { throw 'Staff account operation failed. Read the diagnostic above.' }
} finally { Pop-Location }
