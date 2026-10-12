<#
.SYNOPSIS
    Descarga el Gist del historial de descargas y lo guarda en Download_Records/.
.DESCRIPTION
    Este script:
    1. Verifica que estás en un repositorio git.
    2. Verifica que pull.ps1 esté en el .gitignore. Si no, lo añade.
    3. Verifica que la carpeta Download_Records/ esté en el .gitignore. Si no, la añade.
    4. Crea la carpeta Download_Records/ si no existe.
    5. Descarga el Gist con el historial de descargas.
    6. Lo guarda con fecha y hora en el nombre, dentro de Download_Records/.
    7. Guarda también una copia "latest" siempre actualizada.
.NOTES
    Para ejecutarlo: .\pull.ps1
#>

# ===== Colores para los mensajes =====
function Write-Step    { Write-Host "[*] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[+] $args" -ForegroundColor Green }
function Write-Warn    { Write-Host "[!] $args" -ForegroundColor Yellow }
function Write-Err     { Write-Host "[X] $args" -ForegroundColor Red }

# ===== Configuración =====
$GistId      = "40391b1420b19d763eff10e35d1aec63"
$ScriptName  = "pull.ps1"
$FolderName  = "Download_Records"
$Gitignore   = ".gitignore"

# ===== Verificar que estamos en un repositorio git =====
if (-not (Test-Path ".git")) {
    Write-Err "No estas en un repositorio git. Abortando."
    exit 1
}

# ===== Verificar que el .gitignore existe =====
if (-not (Test-Path $Gitignore)) {
    Write-Step "$Gitignore no existe. Creandolo..."
    New-Item -ItemType File -Path $Gitignore -Force | Out-Null
}

$gitignoreContent = Get-Content $Gitignore -Raw

# ===== Asegurar que pull.ps1 esta en el .gitignore =====
$patternScript = "(?m)^\s*$([regex]::Escape($ScriptName))\s*$"
if ($gitignoreContent -notmatch $patternScript) {
    Write-Step "$ScriptName no esta en .gitignore. Anadiendolo..."
    Add-Content -Path $Gitignore -Value "`n# Script de descarga de historial`n$ScriptName"
    Write-Success "$ScriptName anadido a .gitignore."
} else {
    Write-Success "$ScriptName ya esta en .gitignore."
}

# ===== Asegurar que Download_Records/ esta en el .gitignore =====
$patternFolder = "(?m)^\s*$([regex]::Escape($FolderName))/"
if ($gitignoreContent -notmatch $patternFolder) {
    Write-Step "$FolderName/ no esta en .gitignore. Anadiendolo..."
    Add-Content -Path $Gitignore -Value "`n# Historial de descargas (local, no se sube)`n$FolderName/"
    Write-Success "$FolderName/ anadido a .gitignore."
} else {
    Write-Success "$FolderName/ ya esta en .gitignore."
}

# ===== Crear la carpeta si no existe =====
if (-not (Test-Path $FolderName)) {
    Write-Step "Creando carpeta $FolderName/..."
    New-Item -ItemType Directory -Path $FolderName -Force | Out-Null
    Write-Success "Carpeta $FolderName/ creada."
} else {
    Write-Success "Carpeta $FolderName/ ya existe."
}

# ===== Descargar el Gist =====
Write-Step "Descargando Gist $GistId ..."

try {
    $raw = gh gist view $GistId --raw 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) {
        Write-Err "No se pudo descargar el Gist. Revisa que gh este autenticado."
        exit 1
    }
} catch {
    Write-Err "Error al ejecutar gh: $_"
    exit 1
}

# ===== Validar que es JSON =====
try {
    $null = $raw | ConvertFrom-Json
} catch {
    Write-Err "El contenido del Gist no es JSON valido."
    exit 1
}

# ===== Guardar con timestamp =====
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$fileWithDate = Join-Path $FolderName "downloads_$timestamp.json"
$fileLatest   = Join-Path $FolderName "downloads_latest.json"

[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location).Path $fileWithDate),
    $raw,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Success "Guardado: $fileWithDate"

[System.IO.File]::WriteAllText(
    (Join-Path (Get-Location).Path $fileLatest),
    $raw,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Success "Guardado: $fileLatest (siempre actualizado)"

Write-Host ""
Write-Success "Historial descargado correctamente."
Write-Host ""