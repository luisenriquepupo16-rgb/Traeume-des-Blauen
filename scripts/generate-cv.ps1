[CmdletBinding()]
param(
    [string]$RepoRoot = ".",
    [string]$OutputDir = "cv"
)

$ErrorActionPreference = "Stop"

# Rutas
$repoAbsolute = (Resolve-Path $RepoRoot).Path
$cvDataPath = Join-Path $repoAbsolute "cv/cv-data.json"
$catalogPath = Join-Path $repoAbsolute "docs/catalog.json"
$opensourcePath = Join-Path $repoAbsolute "docs/content/opensource.json"
$outputDirPath = Join-Path $repoAbsolute $OutputDir
$fotoPath = Join-Path $outputDirPath "perfil.jpg"

Write-Host "Repo root: $repoAbsolute"
Write-Host "Output dir: $outputDirPath"
Write-Host "Foto: $fotoPath (existe: $(Test-Path $fotoPath))"

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

# Lista de proyectos con doble salto de línea
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
    $idiomasMd += "- **$($idioma.idioma):** $($idioma.nivel)`n`n"
}

$aptitudesMd = ""
foreach ($apt in $data.aptitudes) {
    $aptitudesMd += "- $apt`n`n"
}

$logrosPre = ""
foreach ($logro in $data.preuniversitario.logros) {
    $logrosPre += "- $logro`n`n"
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
$fotoMd = ""
if (Test-Path $fotoPath) {
    $fotoMd = "![Foto de perfil](perfil.jpg)`n`n"
}

$datosMd = ""
$datos = @(
    @{ num = "1"; label = "Nombres y Apellidos"; valor = $nombreLegal },
    @{ num = "2"; label = "Sexo"; valor = "M" },
    @{ num = "3"; label = "Edad"; valor = "$edad años" },
    @{ num = "4"; label = "Fecha de Nacimiento"; valor = $fechaNacimiento },
    @{ num = "5"; label = "Centro de Estudio"; valor = "$($data.educacion.universidad). $facultad." },
    @{ num = "6"; label = "Cargo"; valor = "Estudiante" },
    @{ num = "7"; label = "Dirección Particular"; valor = $direccion },
    @{ num = "8"; label = "Teléfono"; valor = "Móvil: $telefono" }
)

foreach ($d in $datos) {
    $datosMd += "$($d.num). **$($d.label):** $($d.valor)`n`n"
}

$cvCuba = @"
# CURRÍCULUM VITAE

$fotoMd

## I. DATOS GENERALES

$datosMd
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

# ===== GENERAR PDFs CON LATEX =====

function Convert-MdToPdf {
    param(
        [string]$MdPath,
        [string]$PdfPath
    )

    Write-Host "=== Convirtiendo $MdPath a PDF ==="

    if (-not (Test-Path $MdPath)) {
        throw "No existe el archivo fuente: $MdPath"
    }

    $absoluteMd = (Resolve-Path $MdPath).Path
    $absolutePdf = [System.IO.Path]::GetFullPath($PdfPath)
    $workingDir = Split-Path -Parent $absoluteMd

    if (Test-Path $absolutePdf) {
        Remove-Item $absolutePdf -Force
    }

    Push-Location $workingDir
    try {
        & pandoc (Split-Path -Leaf $absoluteMd) `
            -o (Split-Path -Leaf $absolutePdf) `
            --pdf-engine=xelatex `
            -V geometry:margin=2cm `
            -V fontsize=11pt `
            -V documentclass=article `
            -V lang=es `
            -V mainfont="Arial"

        if ($LASTEXITCODE -ne 0) {
            throw "Pandoc falló (exit $LASTEXITCODE)"
        }
    } finally {
        Pop-Location
    }

    if (-not (Test-Path $absolutePdf)) {
        throw "Pandoc no generó el PDF: $absolutePdf"
    }

    $pdfSize = (Get-Item $absolutePdf).Length
    if ($pdfSize -lt 1000) {
        throw "El PDF generado es sospechosamente pequeño ($pdfSize bytes): $absolutePdf"
    }

    Write-Host "PDF generado: $absolutePdf ($pdfSize bytes)"
}

# Generar PDFs
Convert-MdToPdf -MdPath $cvEsPath -PdfPath (Join-Path $outputDirPath "cv.es.pdf")
Convert-MdToPdf -MdPath $cvEnPath -PdfPath (Join-Path $outputDirPath "cv.en.pdf")
Convert-MdToPdf -MdPath $cvCubaPath -PdfPath (Join-Path $outputDirPath "cv-cuba.pdf")

Write-Host "=== Todos los CVs generados correctamente ==="