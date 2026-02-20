<#
.SYNOPSIS
    Set one or more custom extension attributes on a B2C user.

.DESCRIPTION
    Authenticates via Client Credentials against Microsoft Graph and updates
    custom extension attributes (Status, Role, Username, ContainerPort) for
    the specified user.

.PARAMETER UserId
    The Object ID of the B2C user (e.g. 209edf33-fc9b-4eb1-b23c-7cbd17065e01)

.PARAMETER Status
    User status: pending, approved, active, or revoked

.PARAMETER Role
    User role: user or admin

.PARAMETER Username
    URL-safe username slug (e.g. "reuben")

.PARAMETER ContainerPort
    Internal port for user's Docker stack (e.g. "8001")

.EXAMPLE
    # Set status and role
    ./scripts/b2c-set-user.ps1 -UserId "209edf33-fc9b-4eb1-b23c-7cbd17065e01" -Status "active" -Role "admin"

.EXAMPLE
    # Set all attributes
    ./scripts/b2c-set-user.ps1 -UserId "209edf33-fc9b-4eb1-b23c-7cbd17065e01" -Status "active" -Role "admin" -Username "reuben" -ContainerPort "8001"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$UserId,

    [Parameter(Mandatory = $false)]
    [ValidateSet("pending", "approved", "active", "revoked")]
    [string]$Status,

    [Parameter(Mandatory = $false)]
    [ValidateSet("user", "admin")]
    [string]$Role,

    [Parameter(Mandatory = $false)]
    [string]$Username,

    [Parameter(Mandatory = $false)]
    [string]$ContainerPort
)

# ── Validate at least one attribute provided ────────────────────
if (-not $Status -and -not $Role -and -not $Username -and -not $ContainerPort) {
    Write-Error "Provide at least one attribute to set: -Status, -Role, -Username, or -ContainerPort"
    exit 1
}

# ── Load .env from project root ─────────────────────────────────
$envFile = Join-Path $PSScriptRoot "../.env"
if (-not (Test-Path $envFile)) {
    Write-Error "No .env file found at $envFile. Copy .env.example and populate it."
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
    }
}

$TenantId = $env:B2C_TENANT_ID
$ClientId = $env:B2C_GRAPH_CLIENT_ID
$ClientSecret = $env:B2C_GRAPH_CLIENT_SECRET

if (-not $TenantId -or -not $ClientId -or -not $ClientSecret) {
    Write-Error "Missing B2C_TENANT_ID, B2C_GRAPH_CLIENT_ID, or B2C_GRAPH_CLIENT_SECRET in .env"
    exit 1
}

# ── Extension app Client ID (embedded in the attribute prefix) ──
$ExtAppId = "3575970a-911e-4699-ad1c-cc1a507d2312"
$ExtPrefix = "extension_$($ExtAppId -replace '-','')_"

# ── Get access token ────────────────────────────────────────────
Write-Host "Authenticating with Graph API..." -ForegroundColor Cyan

$tokenBody = @{
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = "https://graph.microsoft.com/.default"
    grant_type    = "client_credentials"
}

$tokenResponse = Invoke-RestMethod -Method Post `
    -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $tokenBody

$token = $tokenResponse.access_token
$headers = @{ Authorization = "Bearer $token" }

# ── Discover ALL extension properties dynamically ───────────────
Write-Host "Discovering extension properties..." -ForegroundColor Cyan

$appLookup = Invoke-RestMethod -Method Get `
    -Uri "https://graph.microsoft.com/v1.0/applications?`$filter=appId eq '$ExtAppId'&`$select=id" `
    -Headers $headers

$extAppObjectId = $appLookup.value[0].id

$extProps = Invoke-RestMethod -Method Get `
    -Uri "https://graph.microsoft.com/v1.0/applications/$extAppObjectId/extensionProperties" `
    -Headers $headers

$extNames = $extProps.value | ForEach-Object { $_.name }
Write-Host "  Found $($extNames.Count) extension properties" -ForegroundColor DarkGray

# Helper: find the real extension property name by case-insensitive suffix match
function Resolve-ExtName($suffix) {
    $target = "${ExtPrefix}${suffix}"
    $match = $extNames | Where-Object { $_ -ieq $target }
    if (-not $match) {
        Write-Error "No extension property found matching '$suffix'. Available: $($extNames -join ', ')"
        exit 1
    }
    return $match
}

# ── Build update payload ────────────────────────────────────────
$body = @{}

if ($Status)        { $body[(Resolve-ExtName "Status")]        = $Status }
if ($Role)          { $body[(Resolve-ExtName "Role")]           = $Role }
if ($Username)      { $body[(Resolve-ExtName "Username")]       = $Username }
if ($ContainerPort) { $body[(Resolve-ExtName "ContainerPort")]  = $ContainerPort }

$jsonBody = $body | ConvertTo-Json

Write-Host ""
Write-Host "Setting attributes on user $UserId :" -ForegroundColor Cyan
$body.GetEnumerator() | ForEach-Object {
    $displayName = $_.Key -replace [regex]::Escape($ExtPrefix), ""
    Write-Host "  $displayName = $($_.Value)" -ForegroundColor Yellow
}

# ── PATCH user ──────────────────────────────────────────────────
$uri = "https://graph.microsoft.com/v1.0/users/$UserId"

Invoke-RestMethod -Method Patch -Uri $uri `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $jsonBody

Write-Host ""
Write-Host "✓ Attributes updated successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Note: Log out and log back in to see updated claims in the JWT." -ForegroundColor DarkGray
Write-Host ""
