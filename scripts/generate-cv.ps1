[CmdletBinding()]
param(
    [string]$RepoRoot = ".",
    [string]$OutputDir = "cv"
)

$ErrorActionPreference = "Stop"

# Rutas absolutas
$repoAbsolute = (Resolve-Path $RepoRoot).Path
$cvDataPath = Join-Path $repoAbsolute "cv/cv-data.json"
$catalogPath = Join-Path $repoAbsolute "docs/catalog.json"
$opensourcePath = Join-Path $repoAbsolute "docs/content/opensource.json"
$outputDirPath = Join-Path $repoAbsolute $OutputDir
$fotoPath = Join-Path $outputDirPath "perfil.jpg"
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

Write-Host "Repo root: $repoAbsolute"
Write-Host "Output dir: $outputDirPath"
Write-Host "Chrome: $chromePath"

if (-not (Test-Path $chromePath)) {
    throw "Chrome no encontrado en $chromePath"
}

if (-not (Test-Path $outputDirPath)) {
    New-Item -ItemType Directory -Path $outputDirPath -Force | Out-Null
}

# Leer datos
$data = Get-Content $cvDataPath -Raw | ConvertFrom-Json
$catalog = Get-Content $catalogPath -Raw | ConvertFrom-Json
$opensource = Get-Content $opensourcePath -Raw | ConvertFrom-Json

# Reemplazar placeholders con variables de entorno
function Resolve-Placeholder {
    param([string]$value)
    if ($value -match '^\{\{(.+)\}\}$') {
        $envName = $Matches[1]
        return [System.Environment]::GetEnvironmentVariable($envName)
    }
    return $value
}

$nombreLegal = Resolve-Placeholder $data.nombre_legal
$edad = Resolve-Placeholder $data.edad
$fechaNacimiento = Resolve-Placeholder $data.fecha_nacimiento
$direccion = Resolve-Placeholder $data.direccion
$telefono = Resolve-Placeholder $data.telefono
$facultad = Resolve-Placeholder $data.facultad

$fechaHoy = (Get-Date).ToString("dd/MM/yyyy")

# Lista de proyectos desde el catálogo
$proyectosMd = ""
foreach ($app in $catalog.apps) {
    $proyectosMd += "- **$($app.name)**: $($app.description)`n`n"
}

$osMd = ""
foreach ($item in $opensource.items) {
    $osMd += "- **$($item.project)** — $($item.detail): $($item.description)`n`n"
}

$idiomasMd = ""
foreach ($idioma in $data.idiomas) {
    $idiomasMd += "- **$($idioma.idioma):** $($idioma.nivel)`n"
}

$aptitudesMd = ""
foreach ($apt in $data.aptitudes) {
    $aptitudesMd += "- $apt`n"
}

$logrosPre = ""
foreach ($logro in $data.preuniversitario.logros) {
    $logrosPre += "- $logro`n"
}

# ===== CV ESPAÑOL =====
$cvEs = @"
# $($data.nombre_publico)

**Desarrollador Android | Kotlin · Jetpack Compose**

Cuba · $($data.email) · [Portafolio]($($data.portfolio))

---

## Perfil

Desarrollador Android autodidacta, actualmente cursando el último año de Ingeniería Informática. Construyo aplicaciones móviles con Kotlin y Jetpack Compose, con experiencia en publicación, mantenimiento y automatización de despliegues. Contribuidor a proyectos open source del ecosistema Python.

---

## Proyectos destacados

$proyectosMd

---

## Contribuciones open source

$osMd

---

## Educación

**$($data.educacion.carrera)** — $($data.educacion.universidad)
$($data.educacion.año). Tesis en desarrollo.

**Programación competitiva**
Formación autodidacta desde los 14 años, principalmente en C++. Participación en eventos nacionales y en el ICPC.

---

## Habilidades técnicas

**Lenguajes**: Kotlin, Python, C++, Java, Bash
**Android**: Jetpack Compose, View Binding, Material 3, Coroutines, Flow, Ktor, DataStore, WorkManager, Foreground Services, FileProvider
**Backend y automatización**: GitHub Actions, CI/CD, Cloudflare Workers, Gist API
**Herramientas**: Git, GitHub CLI, Gradle, PowerShell, Linux, REST APIs

---

## Idiomas

$idiomasMd

---

## Disponibilidad

- **Modalidad**: remota, asíncrona.
- **Horas**: 8 horas diarias en franjas flexibles.
- **Nota**: residencia en Cuba, con conexión potencialmente intermitente. Trabajo bien en modalidades orientadas a objetivos.
- **Viajes**: disponibilidad limitada, se evalúa caso por caso.

---

*Última actualización: $fechaHoy*
"@

$cvEsPath = Join-Path $outputDirPath "cv.es.md"
Set-Content -Path $cvEsPath -Value $cvEs -Encoding UTF8
Write-Host "Generado: $cvEsPath"

# ===== CV INGLÉS =====
$cvEn = @"
# $($data.nombre_publico)

**Android Developer | Kotlin · Jetpack Compose**

Cuba · $($data.email) · [Portfolio]($($data.portfolio))

---

## Profile

Self-taught Android developer, currently in the final year of a Computer Engineering degree. I build mobile applications with Kotlin and Jetpack Compose, with hands-on experience in publishing, maintenance, and deployment automation. Contributor to open source projects in the Python ecosystem.

---

## Featured Projects

$proyectosMd

---

## Open Source Contributions

$osMd

---

## Education

**$($data.educacion.carrera)** — $($data.educacion.universidad)
$($data.educacion.año). Thesis in development.

**Competitive Programming**
Self-taught since age 14, mainly in C++. Participation in national events and in the ICPC.

---

## Technical Skills

**Languages**: Kotlin, Python, C++, Java, Bash
**Android**: Jetpack Compose, View Binding, Material 3, Coroutines, Flow, Ktor, DataStore, WorkManager, Foreground Services, FileProvider
**Backend & Automation**: GitHub Actions, CI/CD, Cloudflare Workers, Gist API
**Tools**: Git, GitHub CLI, Gradle, PowerShell, Linux, REST APIs

---

## Languages

$idiomasMd

---

## Availability

- **Mode**: remote, asynchronous.
- **Hours**: 8 hours per day, flexible time slots.
- **Note**: based in Cuba, where internet connection may be intermittent. I work well in goal-oriented setups.
- **Travel**: limited availability, evaluated case by case.

---

*Last update: $fechaHoy*
"@

$cvEnPath = Join-Path $outputDirPath "cv.en.md"
Set-Content -Path $cvEnPath -Value $cvEn -Encoding UTF8
Write-Host "Generado: $cvEnPath"

# ===== CV CUBA =====
$cvCuba = @"
<div class="titulo-cv">CURRÍCULUM VITAE</div>

<div class="foto-cv">
<img src="perfil.jpg" alt="Foto" />
</div>

## I. DATOS GENERALES

1. **Nombres y Apellidos:** $nombreLegal

2. **Sexo:** M

3. **Edad:** $edad años

4. **Fecha de Nacimiento:** $fechaNacimiento

5. **Centro de Estudio:** $($data.educacion.universidad). $facultad.

6. **Cargo:** Estudiante

7. **Dirección Particular:** $direccion

8. **Teléfono:** Móvil: $telefono

---

## FORMACIÓN

- Cursando el cuarto año de la carrera $($data.educacion.carrera) en la $($data.educacion.universidad). Actualmente en desarrollo de tesis de grado.

- Graduado de enseñanza media-superior en el $($data.preuniversitario.nombre) en el año $($data.preuniversitario.año).

$logrosPre

- Graduado de la enseñanza media en la $($data.media).

---

## APTITUDES

$aptitudesMd

---

## IDIOMA

$idiomasMd

---

## INVESTIGACIONES Y PROYECTOS

- **Tesis de grado (en desarrollo):** $($data.educacion.tesis)

$proyectosMd

- **Contribuciones open source:** $osMd

---

**Fecha del Currículum:** $fechaHoy
"@

$cvCubaPath = Join-Path $outputDirPath "cv-cuba.md"
Set-Content -Path $cvCubaPath -Value $cvCuba -Encoding UTF8
Write-Host "Generado: $cvCubaPath"

# ===== CSS =====

$cssPublicPath = Join-Path $outputDirPath "cv-public.css"
$cssPublic = @"
@page { size: A4; margin: 2cm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #333; }
h1 { color: #2E5A88; font-size: 22pt; border-bottom: 3px solid #C9A961; padding-bottom: 8px; margin-bottom: 15px; }
h2 { color: #2E5A88; font-size: 15pt; margin-top: 25px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
h3 { color: #5C4033; font-size: 12pt; }
ul { margin-left: 20px; margin-bottom: 10px; }
li { margin-bottom: 6px; }
strong { color: #2E5A88; }
hr { border: none; border-top: 1px solid #eee; margin: 15px 0; }
"@
Set-Content -Path $cssPublicPath -Value $cssPublic -Encoding UTF8

$cssCubaPath = Join-Path $outputDirPath "cv-cuba.css"
$cssCuba = @"
@page { size: A4; margin: 2cm 2.5cm; }
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
.titulo-cv { text-align: center; font-size: 18pt; font-weight: bold; margin-bottom: 25px; margin-top: 10px; }
.foto-cv { float: right; width: 3cm; margin: 0 0 15px 15px; }
.foto-cv img { width: 100%; border: 1px solid #ccc; }
h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #000; padding-bottom: 3px; }
p, li { text-align: justify; margin-bottom: 6px; }
ul { margin-left: 20px; list-style-type: disc; }
ol { margin-left: 20px; }
ol li { margin-bottom: 4px; }
hr { border: none; border-top: 1px solid #ccc; margin: 15px 0; }
"@
Set-Content -Path $cssCubaPath -Value $cssCuba -Encoding UTF8

# ===== FUNCIÓN: MD -> PDF con verificación =====

function Convert-MdToPdf {
    param(
        [string]$MdPath,
        [string]$PdfPath,
        [string]$CssPath
    )

    Write-Host "=== Convirtiendo $MdPath a PDF ==="

    if (-not (Test-Path $MdPath)) {
        throw "No existe el archivo fuente: $MdPath"
    }

    $htmlPath = $PdfPath -replace '\.pdf$', '.html'

    # Paso 1: Pandoc md -> html
    Write-Host "Pandoc: $MdPath -> $htmlPath"
    & pandoc $MdPath -o $htmlPath --standalone --css=$CssPath --metadata title="CV"
    if ($LASTEXITCODE -ne 0) {
        throw "Pandoc falló (exit $LASTEXITCODE)"
    }
    if (-not (Test-Path $htmlPath)) {
        throw "Pandoc no generó el HTML: $htmlPath"
    }
    Write-Host "HTML generado: $htmlPath"

    # Paso 2: Chrome html -> pdf
    $absoluteHtml = (Resolve-Path $htmlPath).Path
    $absolutePdf = [System.IO.Path]::GetFullPath($PdfPath)

    # Eliminar PDF previo si existe
    if (Test-Path $absolutePdf) {
        Remove-Item $absolutePdf -Force
    }

    # Construir URI file:/// correcta para Windows
    $fileUri = "file:///" + ($absoluteHtml -replace '\\', '/')

    Write-Host "Chrome: $fileUri -> $absolutePdf"

    $chromeArgs = @(
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        "--print-to-pdf=$absolutePdf",
        $fileUri
    )

    & $chromePath @chromeArgs
    $chromeExit = $LASTEXITCODE
    Write-Host "Chrome exit code: $chromeExit"

    # Verificación real: el PDF debe existir y no estar vacío
    if (-not (Test-Path $absolutePdf)) {
        throw "Chrome no generó el PDF: $absolutePdf"
    }

    $pdfSize = (Get-Item $absolutePdf).Length
    if ($pdfSize -lt 1000) {
        throw "El PDF generado es sospechosamente pequeño ($pdfSize bytes): $absolutePdf"
    }

    Write-Host "PDF generado: $absolutePdf ($pdfSize bytes)"

    # Borrar HTML intermedio
    Remove-Item $htmlPath -Force -ErrorAction SilentlyContinue
}

# Generar PDFs públicos
Convert-MdToPdf -MdPath $cvEsPath -PdfPath (Join-Path $outputDirPath "cv.es.pdf") -CssPath $cssPublicPath
Convert-MdToPdf -MdPath $cvEnPath -PdfPath (Join-Path $outputDirPath "cv.en.pdf") -CssPath $cssPublicPath

# Generar PDF cubano
Convert-MdToPdf -MdPath $cvCubaPath -PdfPath (Join-Path $outputDirPath "cv-cuba.pdf") -CssPath $cssCubaPath

Write-Host "=== Todos los CVs generados correctamente ==="