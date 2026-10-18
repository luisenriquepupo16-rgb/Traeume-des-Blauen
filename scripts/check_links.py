#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Verifica todas las URLs encontradas en los archivos JSON y HTML del portafolio.
Reporta las que fallen (404, 500, timeout, etc.).
"""

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

import requests

# Archivos a revisar
FILES = [
    "docs/catalog.json",
    "docs/content/blog.json",
    "docs/content/projects.json",
    "docs/content/challenges.json",
    "docs/content/opensource.json",
    "docs/content/learning.json",
]

# Archivos HTML del blog (opcional)
BLOG_HTML_DIR = Path("docs/blog")

# Timeout por petición (segundos)
TIMEOUT = 10

# User-Agent para evitar bloqueos
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; LinkChecker/1.0; +https://github.com/luisenriquepupo16-rgb)"
}


def extraer_urls_de_json(path):
    """Extrae todas las cadenas que empiecen por http de un JSON."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"⚠️  No se pudo leer {path}: {e}")
        return []

    urls = set()

    def recorrer(obj):
        if isinstance(obj, dict):
            for v in obj.values():
                recorrer(v)
        elif isinstance(obj, list):
            for v in obj:
                recorrer(v)
        elif isinstance(obj, str) and obj.startswith("http"):
            urls.add(obj)

    recorrer(data)
    return list(urls)


def extraer_urls_de_html(path):
    """Extrae URLs de atributos href y src de un HTML."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return []

    # Buscar href="..." y src="..."
    patron = re.compile(r'(?:href|src)="(https?://[^"]+)"')
    return patron.findall(content)


def verificar_url(url):
    """Hace una petición HEAD (o GET si HEAD falla) y devuelve True si responde < 400."""
    try:
        r = requests.head(url, timeout=TIMEOUT, headers=HEADERS, allow_redirects=True)
        if r.status_code < 400:
            return True

        # Algunos servidores no soportan HEAD; probar GET con Range
        r = requests.get(url, timeout=TIMEOUT, headers={**HEADERS, "Range": "bytes=0-0"}, allow_redirects=True, stream=True)
        return r.status_code < 400
    except Exception:
        return False


def main():
    urls = set()

    # Extraer de JSONs
    for f in FILES:
        if Path(f).exists():
            urls.update(extraer_urls_de_json(f))

    # Extraer de HTMLs del blog
    if BLOG_HTML_DIR.exists():
        for html in BLOG_HTML_DIR.glob("*.html"):
            urls.update(extraer_urls_de_html(html))

    if not urls:
        print("No se encontraron URLs para verificar.")
        return

    print(f"Verificando {len(urls)} URLs...\n")

    broken = []
    for url in sorted(urls):
        # Omitir URLs de ejemplo o placeholders
        if any(x in url for x in ["example.com", "localhost", "127.0.0.1", "TU_DOMINIO"]):
            continue

        ok = verificar_url(url)
        estado = "✅" if ok else "❌"
        print(f"{estado} {url}")
        if not ok:
            broken.append(url)

    print(f"\n--- Resumen ---")
    print(f"Total: {len(urls)}")
    print(f"OK: {len(urls) - len(broken)}")
    print(f"Roto: {len(broken)}")

    if broken:
        print("\nEnlaces roto:")
        for url in broken:
            print(f"  - {url}")
        sys.exit(1)  # Para que el workflow lo detecte


if __name__ == "__main__":
    main()