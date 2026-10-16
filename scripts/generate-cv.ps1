[CmdletBinding()]
param(
    [string]$RepoRoot = ".",
    [string]$OutputDir = "cv"
)

$ErrorActionPreference = "Stop"

# Rutas
$cvDataPath = Join-Path $RepoRoot "cv/cv-data.json"
$catalogPath = Join-Path $RepoRoot "docs/catalog.json"
$blogPath = Join-Path $RepoRoot "docs/content/blog.json"
$opensourcePath = Join-Path $RepoRoot "docs/content/opensource.json"
$outputDirPath = Join-Path $RepoRoot $OutputDir
$fotoPath = Join-Path $outputDirPath "perfil.jpg"

if (-not (Test-Path $outputDirPath)) {
    New-Item -ItemType Directory -Path $outputDirPath -Force | Out-Null
}

# Leer datos
$data = Get-Content $cvDataPath -Raw | ConvertFrom-Json
$catalog = Get-Content $catalogPath -Raw | ConvertFrom-Json
$blog = Get-Content $blogPath -Raw | ConvertFrom-Json
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
$referenciasJson = Resolve-Placeholder $data.referencias

# Fecha de hoy
$fechaHoy = (Get-Date).ToString("dd/MM/yyyy")

# Lista de proyectos desde el catálogo
$proyectosMd = ""
foreach ($app in $catalog.apps) {
    $proyectosMd += "- **$($app.name)**: $($app.description)`n"
}

# Lista de contribuciones open source
$osMd = ""
foreach ($item in $opensource.items) {
    $osMd += "- **$($item.project)** — $($item.detail): $($item.description)`n"
}

# Lista de idiomas
$idiomasMd = ""
foreach ($idioma in $data.idiomas) {
    $idiomasMd += "- **$($idioma.idioma):** $($idioma.nivel)`n"
}

# Lista de aptitudes
$aptitudesMd = ""
foreach ($apt in $data.aptitudes) {
    $aptitudesMd += "- $apt`n"
}

# ===== CV ESPAÑOL =====
$cvEs = @"
# $($data.nombre_publico)

**Desarrollador Android | Kotlin · Jetpack Compose**

📍 $($data.ubicacion_publica) · 📧 $($data.email) · 🌐 [Portafolio]($($data.portfolio))

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

Set-Content -Path (Join-Path $outputDirPath "cv.es.md") -Value $cvEs -Encoding UTF8

# ===== CV INGLÉS =====
$cvEn = @"
# $($data.nombre_publico)

**Android Developer | Kotlin · Jetpack Compose**

📍 $($data.ubicacion_publica) · 📧 $($data.email) · 🌐 [Portfolio]($($data.portfolio))

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

Set-Content -Path (Join-Path $outputDirPath "cv.en.md") -Value $cvEn -Encoding UTF8

# ===== CV CUBA (formal) =====
$referenciasMd = ""
if ($referenciasJson -and $referenciasJson -ne "[]") {
    $refs = $referenciasJson | ConvertFrom-Json
    foreach ($ref in $refs) {
        $referenciasMd += "- **$($ref.nombre)**: $($ref.relacion). Teléfono: $($ref.telefono)`n"
    }
}

$logrosPre = ""
foreach ($logro in $data.preuniversitario.logros) {
    $logrosPre += "- $logro`n"
}

$cvCuba = @"
# CURRÍCULUM VITAE

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

Set-Content -Path (Join-Path $outputDirPath "cv-cuba.md") -Value $cvCuba -Encoding UTF8

# ===== GENERAR PDFs =====

function Convert-MdToPdf {
    param(
        [string]$MdPath,
        [string]$PdfPath,
        [string]$CssPath,
        [string]$FotoPath = ""
    )

    $args = @(
        $MdPath,
        "-o", $PdfPath,
        "--pdf-engine=wkhtmltopdf",
        "--css=$CssPath"
    )

    if ($FotoPath -and (Test-Path $FotoPath)) {
        $args += "--metadata=foto:$FotoPath"
    }

    & pandoc @args

    if ($LASTEXITCODE -ne 0) {
        throw "Pandoc falló al generar $PdfPath"
    }
}

# CSS para los CVs públicos (estilo moderno)
$cssPublicPath = Join-Path $outputDirPath "cv-public.css"
$cssPublic = @"
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #333;
    margin: 2cm;
}
h1 {
    color: #2E5A88;
    font-size: 20pt;
    border-bottom: 2px solid #C9A961;
    padding-bottom: 5px;
}
h2 {
    color: #2E5A88;
    font-size: 14pt;
    margin-top: 20px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 3px;
}
h3 {
    color: #5C4033;
    font-size: 12pt;
}
code {
    background: #f4f4f4;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Consolas', monospace;
    font-size: 10pt;
}
ul {
    margin-left: 20px;
}
strong {
    color: #2E5A88;
}
"@
Set-Content -Path $cssPublicPath -Value $cssPublic -Encoding UTF8

# CSS para el CV cubano (estilo formal, patrón de la amiga)
$cssCubaPath = Join-Path $outputDirPath "cv-cuba.css"
$cssCuba = @"
@page {
    size: A4;
    margin: 2cm 2.5cm;
}
body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.4;
    color: #000;
}
h1 {
    text-align: center;
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 20px;
}
h2 {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 25px;
    margin-bottom: 10px;
}
p, li {
    text-align: justify;
}
ul {
    margin-left: 20px;
    list-style-type: disc;
}
.foto-cv {
    float: right;
    width: 3cm;
    height: auto;
    margin: 0 0 15px 15px;
    border: 1px solid #ccc;
}
"@
Set-Content -Path $cssCubaPath -Value $cssCuba -Encoding UTF8

# Generar PDFs de los CVs públicos
Convert-MdToPdf -MdPath (Join-Path $outputDirPath "cv.es.md") -PdfPath (Join-Path $outputDirPath "cv.es.pdf") -CssPath $cssPublicPath
Convert-MdToPdf -MdPath (Join-Path $outputDirPath "cv.en.md") -PdfPath (Join-Path $outputDirPath "cv.en.pdf") -CssPath $cssPublicPath

# Generar PDF del CV cubano (con foto si existe)
Convert-MdToPdf -MdPath (Join-Path $outputDirPath "cv-cuba.md") -PdfPath (Join-Path $outputDirPath "cv-cuba.pdf") -CssPath $cssCubaPath -FotoPath $fotoPath

Write-Host "CVs generados en $outputDirPath"