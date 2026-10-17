#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Generador de CVs para Träume des Blauen.

Usa la fuente DejaVu Sans (Unicode) para soportar tildes,
bullets, guiones largos y cualquier carácter especial.
"""

import json
import os
import sys
from datetime import date
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

# ===== Configuración =====

REPO_ROOT = Path(__file__).parent.parent.resolve()
CV_DATA_PATH = REPO_ROOT / "cv" / "cv-data.json"
CATALOG_PATH = REPO_ROOT / "docs" / "catalog.json"
OPENSOURCE_PATH = REPO_ROOT / "docs" / "content" / "opensource.json"
OUTPUT_DIR = REPO_ROOT / "cv"
FOTO_PATH = OUTPUT_DIR / "perfil.jpg"

# Rutas de las fuentes DejaVu en Ubuntu (instaladas por el workflow)
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

FECHA_HOY = date.today().strftime("%d/%m/%Y")


# ===== Utilidades =====

def cargar_json(path, default):
    if not path.exists():
        print(f"[WARN] No existe {path}, se usa el valor por defecto.")
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[WARN] Error al leer {path}: {e}")
        return default


def resolver_placeholder(valor):
    if isinstance(valor, str) and valor.startswith("{{") and valor.endswith("}}"):
        var = valor[2:-2]
        return os.environ.get(var)
    return valor


def texto(valor):
    if valor is None:
        return ""
    return str(valor).strip()


# ===== Carga de datos =====

def cargar_datos():
    data = cargar_json(CV_DATA_PATH, None)
    if data is None:
        print("[ERROR] No se pudo cargar cv-data.json. Abortando.")
        sys.exit(1)

    resuelto = {}
    for key, value in data.items():
        if isinstance(value, dict):
            resuelto[key] = {
                k: resolver_placeholder(v) if k in {
                    "nombre_legal", "edad", "fecha_nacimiento",
                    "direccion", "telefono", "facultad", "referencias"
                } else v
                for k, v in value.items()
            }
        else:
            resuelto[key] = resolver_placeholder(value)

    return resuelto


def cargar_catalogo():
    data = cargar_json(CATALOG_PATH, {"apps": []})
    return data.get("apps", [])


def cargar_opensource():
    data = cargar_json(OPENSOURCE_PATH, {"items": []})
    return data.get("items", [])


# ===== Validación =====

def tiene_datos_basicos(datos, idioma):
    nombre = texto(datos.get("nombre_publico"))
    educacion = datos.get("educacion", {})
    carrera = texto(educacion.get("carrera"))
    universidad = texto(educacion.get("universidad"))

    if not nombre:
        print(f"[WARN] {idioma}: falta el nombre. No se genera.")
        return False
    if not carrera or not universidad:
        print(f"[WARN] {idioma}: falta la educación básica. No se genera.")
        return False
    return True


# ===== Generación de PDF =====

class CVPDF(FPDF):
    def __init__(self):
        super().__init__()
        # Registrar la fuente DejaVu (solo regular y bold)
        self.add_font("DejaVu", "", FONT_REGULAR)
        self.add_font("DejaVu", "B", FONT_BOLD)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Página {self.page_no()}", align="C",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Generado el {FECHA_HOY}", align="C")


def add_seccion(pdf, titulo):
    if pdf.get_y() > 250:
        pdf.add_page()
    pdf.set_font("DejaVu", "B", 12)
    pdf.set_text_color(46, 90, 136)
    pdf.cell(0, 8, titulo, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_draw_color(201, 169, 97)
    pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
    pdf.ln(3)


def add_texto(pdf, texto_str):
    if not texto_str:
        return
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(51, 51, 51)
    pdf.multi_cell(0, 5, texto_str)
    pdf.ln(2)


def add_bullet(pdf, texto_str):
    if not texto_str:
        return
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(51, 51, 51)
    pdf.set_x(pdf.get_x() + 5)
    pdf.multi_cell(0, 5, "• " + texto_str)
    pdf.ln(1)


# ===== CV español =====

def generar_cv_es(datos, apps, opensource):
    if not tiene_datos_basicos(datos, "ES"):
        return False

    pdf = CVPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("DejaVu", "B", 20)
    pdf.set_text_color(46, 90, 136)
    pdf.cell(0, 10, texto(datos.get("nombre_publico")),
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(92, 64, 51)
    pdf.cell(0, 6, "Desarrollador Android | Kotlin · Jetpack Compose",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    contacto = []
    if texto(datos.get("ubicacion_publica")):
        contacto.append(texto(datos.get("ubicacion_publica")))
    if texto(datos.get("portfolio")):
        contacto.append(f"Portafolio: {texto(datos.get('portfolio'))}")
    if contacto:
        pdf.set_font("DejaVu", "", 9)
        pdf.set_text_color(128, 128, 128)
        pdf.cell(0, 5, " · ".join(contacto),
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)

    add_seccion(pdf, "Perfil")
    add_texto(pdf, "Desarrollador Android autodidacta, actualmente cursando el último año de Ingeniería Informática. Construyo aplicaciones móviles con Kotlin y Jetpack Compose, con experiencia en publicación, mantenimiento y automatización de despliegues.")

    if apps:
        add_seccion(pdf, "Proyectos destacados")
        for app in apps:
            nombre = texto(app.get("name"))
            desc = texto(app.get("description"))
            if nombre and desc:
                add_bullet(pdf, f"{nombre}: {desc}")

    if opensource:
        add_seccion(pdf, "Contribuciones open source")
        for item in opensource:
            proyecto = texto(item.get("project"))
            detalle = texto(item.get("detail"))
            desc = texto(item.get("description"))
            if proyecto and desc:
                add_bullet(pdf, f"{proyecto} — {detalle}: {desc}")

    edu = datos.get("educacion", {})
    add_seccion(pdf, "Educación")
    add_texto(pdf, f"{texto(edu.get('carrera'))} — {texto(edu.get('universidad'))}")
    add_texto(pdf, f"{texto(edu.get('año'))}. Tesis en desarrollo.")

    add_seccion(pdf, "Habilidades técnicas")
    add_texto(pdf, "Lenguajes: Kotlin, Python, C++, Java, Bash")
    add_texto(pdf, "Android: Jetpack Compose, View Binding, Material 3, Coroutines, Flow, Ktor, DataStore, WorkManager, Foreground Services, FileProvider")
    add_texto(pdf, "Backend y automatización: GitHub Actions, CI/CD, Cloudflare Workers, Gist API")
    add_texto(pdf, "Herramientas: Git, GitHub CLI, Gradle, PowerShell, Linux, REST APIs")

    idiomas = datos.get("idiomas", [])
    if idiomas:
        add_seccion(pdf, "Idiomas")
        for idioma in idiomas:
            nombre = texto(idioma.get("idioma"))
            nivel = texto(idioma.get("nivel"))
            if nombre and nivel:
                add_bullet(pdf, f"{nombre}: {nivel}")

    add_seccion(pdf, "Disponibilidad")
    add_texto(pdf, "Modalidad: remota, asíncrona.")
    add_texto(pdf, "Horas: 8 horas diarias en franjas flexibles.")
    add_texto(pdf, "Nota: residencia en Cuba, con conexión potencialmente intermitente.")

    pdf.ln(5)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, f"Última actualización: {FECHA_HOY}",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    output = OUTPUT_DIR / "cv.es.pdf"
    pdf.output(str(output))
    print(f"[OK] Generado: {output}")
    return True


# ===== CV inglés =====

def generar_cv_en(datos, apps, opensource):
    if not tiene_datos_basicos(datos, "EN"):
        return False

    pdf = CVPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("DejaVu", "B", 20)
    pdf.set_text_color(46, 90, 136)
    pdf.cell(0, 10, texto(datos.get("nombre_publico")),
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(92, 64, 51)
    pdf.cell(0, 6, "Android Developer | Kotlin · Jetpack Compose",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    contacto = []
    if texto(datos.get("ubicacion_publica")):
        contacto.append(texto(datos.get("ubicacion_publica")))
    if texto(datos.get("portfolio")):
        contacto.append(f"Portfolio: {texto(datos.get('portfolio'))}")
    if contacto:
        pdf.set_font("DejaVu", "", 9)
        pdf.set_text_color(128, 128, 128)
        pdf.cell(0, 5, " · ".join(contacto),
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)

    add_seccion(pdf, "Profile")
    add_texto(pdf, "Self-taught Android developer, currently in the final year of a Computer Engineering degree. I build mobile applications with Kotlin and Jetpack Compose, with hands-on experience in publishing, maintenance, and deployment automation.")

    if apps:
        add_seccion(pdf, "Featured Projects")
        for app in apps:
            nombre = texto(app.get("name"))
            desc = texto(app.get("description"))
            if nombre and desc:
                add_bullet(pdf, f"{nombre}: {desc}")

    if opensource:
        add_seccion(pdf, "Open Source Contributions")
        for item in opensource:
            proyecto = texto(item.get("project"))
            detalle = texto(item.get("detail"))
            desc = texto(item.get("description"))
            if proyecto and desc:
                add_bullet(pdf, f"{proyecto} — {detalle}: {desc}")

    edu = datos.get("educacion", {})
    add_seccion(pdf, "Education")
    add_texto(pdf, f"{texto(edu.get('carrera'))} — {texto(edu.get('universidad'))}")
    add_texto(pdf, f"{texto(edu.get('año'))}. Thesis in development.")

    add_seccion(pdf, "Technical Skills")
    add_texto(pdf, "Languages: Kotlin, Python, C++, Java, Bash")
    add_texto(pdf, "Android: Jetpack Compose, View Binding, Material 3, Coroutines, Flow, Ktor, DataStore, WorkManager, Foreground Services, FileProvider")
    add_texto(pdf, "Backend & Automation: GitHub Actions, CI/CD, Cloudflare Workers, Gist API")
    add_texto(pdf, "Tools: Git, GitHub CLI, Gradle, PowerShell, Linux, REST APIs")

    idiomas = datos.get("idiomas", [])
    if idiomas:
        add_seccion(pdf, "Languages")
        for idioma in idiomas:
            nombre = texto(idioma.get("idioma"))
            nivel = texto(idioma.get("nivel"))
            if nombre and nivel:
                add_bullet(pdf, f"{nombre}: {nivel}")

    add_seccion(pdf, "Availability")
    add_texto(pdf, "Mode: remote, asynchronous.")
    add_texto(pdf, "Hours: 8 hours per day, flexible time slots.")
    add_texto(pdf, "Note: based in Cuba, where internet connection may be intermittent.")

    pdf.ln(5)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, f"Last update: {FECHA_HOY}",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    output = OUTPUT_DIR / "cv.en.pdf"
    pdf.output(str(output))
    print(f"[OK] Generado: {output}")
    return True


# ===== CV cubano =====

def generar_cv_cuba(datos):
    if not tiene_datos_basicos(datos, "CUBA"):
        return False

    pdf = CVPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("DejaVu", "B", 18)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 12, "CURRÍCULUM VITAE", align="C",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)

    if FOTO_PATH.exists():
        try:
            pdf.image(str(FOTO_PATH), x=160, y=15, w=30)
        except Exception as e:
            print(f"[WARN] No se pudo incluir la foto: {e}")

    add_seccion(pdf, "I. DATOS GENERALES")
    datos_generales = [
        ("Nombres y Apellidos", texto(datos.get("nombre_legal"))),
        ("Sexo", "M"),
        ("Edad", f"{texto(datos.get('edad'))} años" if texto(datos.get("edad")) else ""),
        ("Fecha de Nacimiento", texto(datos.get("fecha_nacimiento"))),
        ("Centro de Estudio", f"{texto(datos.get('educacion', {}).get('universidad'))}. {texto(datos.get('facultad'))}."),
        ("Cargo", "Estudiante"),
        ("Dirección Particular", texto(datos.get("direccion"))),
        ("Teléfono", f"Móvil: {texto(datos.get('telefono'))}" if texto(datos.get("telefono")) else ""),
    ]
    for i, (label, valor) in enumerate(datos_generales, 1):
        if valor:
            add_texto(pdf, f"{i}. {label}: {valor}")

    add_seccion(pdf, "FORMACIÓN")
    edu = datos.get("educacion", {})
    add_texto(pdf, f"Cursando el cuarto año de la carrera {texto(edu.get('carrera'))} en la {texto(edu.get('universidad'))}. Actualmente en desarrollo de tesis de grado.")
    pre = datos.get("preuniversitario", {})
    if texto(pre.get("nombre")):
        add_texto(pdf, f"Graduado de enseñanza media-superior en el {texto(pre.get('nombre'))} en el año {texto(pre.get('año'))}.")
    for logro in pre.get("logros", []):
        if texto(logro):
            add_bullet(pdf, texto(logro))
    if texto(datos.get("media")):
        add_texto(pdf, f"Graduado de la enseñanza media en la {texto(datos.get('media'))}.")

    aptitudes = datos.get("aptitudes", [])
    if aptitudes:
        add_seccion(pdf, "APTITUDES")
        for apt in aptitudes:
            if texto(apt):
                add_bullet(pdf, texto(apt))

    idiomas = datos.get("idiomas", [])
    if idiomas:
        add_seccion(pdf, "IDIOMA")
        for idioma in idiomas:
            nombre = texto(idioma.get("idioma"))
            nivel = texto(idioma.get("nivel"))
            if nombre and nivel:
                add_bullet(pdf, f"{nombre}: {nivel}")

    add_seccion(pdf, "INVESTIGACIONES Y PROYECTOS")
    tesis = texto(edu.get("tesis"))
    if tesis:
        add_bullet(pdf, f"Tesis de grado (en desarrollo): {tesis}")

    apps = cargar_catalogo()
    for app in apps:
        nombre = texto(app.get("name"))
        desc = texto(app.get("description"))
        if nombre and desc:
            add_bullet(pdf, f"{nombre}: {desc}")

    opensource = cargar_opensource()
    for item in opensource:
        proyecto = texto(item.get("project"))
        detalle = texto(item.get("detail"))
        desc = texto(item.get("description"))
        if proyecto and desc:
            add_bullet(pdf, f"{proyecto} — {detalle}: {desc}")

    pdf.ln(5)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 5, f"Fecha del Currículum: {FECHA_HOY}",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    output = OUTPUT_DIR / "cv-cuba.pdf"
    pdf.output(str(output))
    print(f"[OK] Generado: {output}")
    return True


# ===== Main =====

def main():
    print("=== Generador de CVs ===")
    OUTPUT_DIR.mkdir(exist_ok=True)

    datos = cargar_datos()
    apps = cargar_catalogo()
    opensource = cargar_opensource()

    print(f"Apps: {len(apps)}")
    print(f"Open source: {len(opensource)}")
    print(f"Foto: {'sí' if FOTO_PATH.exists() else 'no'}")

    generar_cv_es(datos, apps, opensource)
    generar_cv_en(datos, apps, opensource)
    generar_cv_cuba(datos)

    print("=== Todos los CVs generados ===")


if __name__ == "__main__":
    main()