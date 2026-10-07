<#
.SYNOPSIS
    Genera docs/catalog.json a partir de las apps en apps/.
.DESCRIPTION
    Recorre cada subcarpeta de apps/, lee su info.md (frontmatter YAML),
    busca el APK y el icon.png, calcula el SHA-256 del APK, y produce
    un JSON con toda la información para el catálogo web y la futura app.

    Si ya existe un catalog.json previo, lo elimina antes de generar el nuevo.
.NOTES
    Requiere el módulo powershell-yaml:
    Install-Module -Name powershell-yaml -Scope CurrentUser
#>

[CmdletBinding()]
param(
    [string]$AppsDir      = "apps",
    [string]$OutputFile   = "docs/catalog.json",
    [string]$BaseUrl      = "https://luisenriquepupo16-rgb.github.io/Traeume-des-Blauen",
    [string]$SiteTitle    = "Traeume des Blauen",
    [string]$Author       = "Dreamer",
    [string]$Github       = "luisenriquepupo16-rgb",
    [string]$Whatsapp     = "5354935996"
)

# --- Cargar módulo YAML ---
Import-Module powershell-yaml -ErrorAction Stop

# --- Función auxiliar: leer un archivo como UTF-8 sin BOM ---
function Read-Utf8NoBom {
    param([string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

# --- Función auxiliar: parsear frontmatter de un info.md ---
function Get-Frontmatter {
    param([string]$Path)

    $content = Read-Utf8NoBom -Path $Path

    if ($content -notmatch '(?s)^\s*---\s*\r?\n(.*?)\r?\n---\s*\r?\n(.*)$') {
        throw "El archivo $Path no tiene frontmatter YAML valido."
    }

    $yamlText = $Matches[1]
    $bodyText = $Matches[2]

    $meta = ConvertFrom-Yaml $yamlText
    return @{
        Meta = $meta
        Body = $bodyText.Trim()
    }
}

# --- Función auxiliar: extraer una sección del markdown ---
function Get-MarkdownSection {
    param(
        [string]$Body,
        [string]$Heading
    )
    $pattern = "(?s)##\s+$([regex]::Escape($Heading))\s*\r?\n(.*?)(?=\r?\n##\s|\z)"
    if ($Body -match $pattern) {
        return $Matches[1].Trim()
    }
    return $null
}

# --- Eliminar catalog.json previo si existe ---
if (Test-Path $OutputFile) {
    Remove-Item -Path $OutputFile -Force
    Write-Host "catalog.json anterior eliminado." -ForegroundColor Yellow
}

# --- Preparar lista de apps ---
$apps = @()
$updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

if (-not (Test-Path $AppsDir)) {
    throw "No existe la carpeta '$AppsDir'."
}

$appFolders = Get-ChildItem -Path $AppsDir -Directory | Sort-Object Name

foreach ($folder in $appFolders) {
    $appId = $folder.Name
    Write-Host "-> Procesando app: $appId" -ForegroundColor Cyan

    $infoPath = Join-Path $folder.FullName "info.md"
    if (-not (Test-Path $infoPath)) {
        Write-Warning "  No se encontro info.md en $appId. Se omite."
        continue
    }

    $parsed = Get-Frontmatter -Path $infoPath
    $meta   = $parsed.Meta
    $body   = $parsed.Body

    # Buscar APK
    $apkFile = Get-ChildItem -Path $folder.FullName -Filter "*.apk" | Select-Object -First 1
    if (-not $apkFile) {
        Write-Warning "  No se encontro APK en $appId. Se omite."
        continue
    }

    # Calcular hash SHA-256 y tamano
    $hash = (Get-FileHash -Path $apkFile.FullName -Algorithm SHA256).Hash.ToLower()
    $sizeBytes = (Get-Item $apkFile.FullName).Length

    # Icono (opcional)
    $iconFile = Join-Path $folder.FullName "icon.png"
    $iconUrl = $null
    if (Test-Path $iconFile) {
        $iconUrl = "$BaseUrl/apps/$appId/icon.png"
    }

    # URL de descarga del APK
    $apkUrl = "$BaseUrl/apps/$appId/$($apkFile.Name)"

    # Extraer secciones del cuerpo (sin tildes para evitar problemas de codificacion)
    $description = Get-MarkdownSection -Body $body -Heading "Description"
    if (-not $description) { $description = "" }

    $usage = Get-MarkdownSection -Body $body -Heading "Uso"

    # Fecha de ultima modificacion del APK
    $updatedAtApp = $apkFile.LastWriteTimeUtc.ToString("yyyy-MM-dd")

    # Construir objeto
    $appObj = [ordered]@{
        id             = $appId
        name           = $meta.name
        version        = $meta.version
        version_code   = $meta.version_code
        package        = $meta.package
        category       = $meta.category
        technologies   = @($meta.technologies)
        input_formats  = @($meta.input_formats)
        output_formats = @($meta.output_formats)
        min_android    = $meta.min_android
        min_sdk        = $meta.min_sdk
        target_sdk     = $meta.target_sdk
        restrictions   = $meta.restrictions
        dedication     = $meta.dedication
        description    = $description
        usage          = $usage
        icon           = $iconUrl
        apk            = [ordered]@{
            filename   = $apkFile.Name
            url        = $apkUrl
            size_bytes = $sizeBytes
            sha256     = $hash
        }
        updated_at     = $updatedAtApp
    }

    $apps += $appObj
    $sizeMb = [math]::Round($sizeBytes / 1MB, 2)
    Write-Host "   OK ($($apkFile.Name), $sizeMb MB)" -ForegroundColor Green
}

# --- Construir objeto final ---
$catalog = [ordered]@{
    version      = 1
    generated_at = $updatedAt
    site         = [ordered]@{
        title    = $SiteTitle
        author   = $Author
        github   = $Github
        whatsapp = $Whatsapp
    }
    apps         = $apps
}

# --- Asegurar que existe la carpeta de salida ---
$outputDir = Split-Path -Parent $OutputFile
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# --- Escribir JSON (UTF-8 sin BOM) ---
$json = $catalog | ConvertTo-Json -Depth 10
$fullOutputPath = Join-Path (Get-Location).Path $OutputFile
[System.IO.File]::WriteAllText(
    $fullOutputPath,
    $json,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host ""
Write-Host "Catalogo generado: $OutputFile" -ForegroundColor Green
Write-Host "Apps procesadas: $($apps.Count)" -ForegroundColor Green