<#
.SYNOPSIS
    Display all attributes (including custom extension attributes) for a B2C user.

.DESCRIPTION
    Authenticates via Client Credentials against Microsoft Graph and retrieves
    all properties for the specified user, including extension attributes
    (Status, Role, Username, ContainerPort).

.PARAMETER UserId
    The Object ID of the B2C user (e.g. 209edf33-fc9b-4eb1-b23c-7cbd17065e01)

.EXAMPLE
    ./scripts/b2c-get-user.ps1 -UserId "209edf33-fc9b-4eb1-b23c-7cbd17065e01"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$UserId
)

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
$ClientSecret = $env:B2C_GRAPH_CLIENT_SECRET ?? "****"

write-host "TenantId: $TenantId" -ForegroundColor DarkGray
write-host "ClientId: $ClientId" -ForegroundColor DarkGray
write-host "ClientSecret: $($ClientSecret.Substring(0, [Math]::Min(4, $ClientSecret.Length)))..." -ForegroundColor DarkGray

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

# Look up the b2c-extensions-app Object ID from its Client ID
$appLookup = Invoke-RestMethod -Method Get `
    -Uri "https://graph.microsoft.com/v1.0/applications?`$filter=appId eq '$ExtAppId'&`$select=id" `
    -Headers $headers

$extAppObjectId = $appLookup.value[0].id

# List all extension properties registered on that app
$extProps = Invoke-RestMethod -Method Get `
    -Uri "https://graph.microsoft.com/v1.0/applications/$extAppObjectId/extensionProperties" `
    -Headers $headers

$extNames = $extProps.value | ForEach-Object { $_.name }
Write-Host "  Found $($extNames.Count) extension properties" -ForegroundColor DarkGray

# ── Query user with ALL standard + discovered extension fields ──
$standardFields = @(
    "id", "displayName", "givenName", "surname", "userPrincipalName",
    "mail", "otherMails", "identities", "createdDateTime", "accountEnabled"
)

$selectFields = ($standardFields + $extNames) -join ","

$uri = "https://graph.microsoft.com/v1.0/users/${UserId}?`$select=$selectFields"

Write-Host "Fetching user $UserId..." -ForegroundColor Cyan

$user = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers

# ── Display results ─────────────────────────────────────────────
Write-Host ""
Write-Host "═══ User Details ═══" -ForegroundColor Green
Write-Host "  Display Name:    $($user.displayName)"
Write-Host "  Object ID:       $($user.id)"
Write-Host "  Given Name:      $($user.givenName)"
Write-Host "  Surname:         $($user.surname)"
Write-Host "  Created:         $($user.createdDateTime)"
Write-Host "  Account Enabled: $($user.accountEnabled)"

write-host "----- Custom Extension Attributes -----" -ForegroundColor Green

$user | Get-Member -MemberType NoteProperty | ForEach-Object {
    $displayName = $_.Name -replace [regex]::Escape($ExtPrefix), ""
    $value = $user.$($_.Name)
    Write-Host "  ${displayName}: $value" -ForegroundColor Yellow
}

Write-Host ""

Write-Host ""
Write-Host "═══ Identities ═══" -ForegroundColor Green
if ($user.identities) {
    $user.identities | ForEach-Object {
        Write-Host "  $($_.signInType): $($_.issuerAssignedId) ($($_.issuer))"
    }
}

Write-Host ""
Write-Host "═══ Custom Attributes ═══" -ForegroundColor Green

foreach ($extName in $extNames) {
    $shortName = $extName -replace [regex]::Escape($ExtPrefix), ""
    $value = $user.$extName
    if ($null -eq $value) {
        Write-Host "  ${shortName}: " -NoNewline
        Write-Host "(not set)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ${shortName}: " -NoNewline
        Write-Host "$value" -ForegroundColor Yellow
    }
}

Write-Host ""
