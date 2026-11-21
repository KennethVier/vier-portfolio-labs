[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CapturePath,
    [string]$RepairBeforePath,
    [string]$RepairAfterPath,
    [string]$OperatorDirectory = (Join-Path $env:USERPROFILE 'DexieCloud\pesopilot-business-v2-dev')
)
$ErrorActionPreference = 'Stop'
$compare = Join-Path $PSScriptRoot 'compare-schema.mjs'
$capture = (Resolve-Path -LiteralPath $CapturePath).Path
if ($RepairBeforePath -or $RepairAfterPath) {
    if (-not $RepairBeforePath -or -not $RepairAfterPath) { throw 'Supply both previous repair export paths.' }
    $RepairBeforePath = (Resolve-Path -LiteralPath $RepairBeforePath).Path
    $RepairAfterPath = (Resolve-Path -LiteralPath $RepairAfterPath).Path
}
$stamp = [guid]::NewGuid().ToString()
$export = Join-Path $OperatorDirectory ("schema-diagnostic-" + $stamp + ".json")
$report = Join-Path $OperatorDirectory ("schema-comparison-" + $stamp + ".json")
Push-Location -LiteralPath $OperatorDirectory
try {
    $config = Get-Content -Raw -LiteralPath 'dexie-cloud.json' | ConvertFrom-Json
    if ($config.dbUrl -ne 'https://z5jxogiwe.dexie.cloud') { throw 'Wrong development database.' }
    & npx.cmd --yes dexie-cloud@3.0.7 export --schema $export
    if ($LASTEXITCODE -ne 0) { throw 'Authenticated schema export failed.' }
    if ($RepairBeforePath) {
        $result = & node $compare $capture $export $RepairBeforePath $RepairAfterPath
    } else {
        $result = & node $compare $capture $export
    }
    if ($LASTEXITCODE -ne 0) { throw 'Schema comparison failed.' }
    $result | Set-Content -LiteralPath $report -Encoding utf8
    $result
    Write-Output "Comparison saved to $report"
} finally { Pop-Location }
