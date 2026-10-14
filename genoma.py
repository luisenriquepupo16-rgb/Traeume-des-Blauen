import os

# 1. LISTA NEGRA AUTOMÁTICA
FILTROS_SISTEMA = [
    ".git", "__pycache__", "node_modules", ".venv", "venv", 
    "env", ".vscode", ".idea", "migrations", "package-lock.json",
    "yarn.lock", "dist", "build", ".next", ".nuxt", "estructura.txt"
]

# 2. EXTENSIONES DE ARCHIVOS BINARIOS A IGNORAR
EXTENSIONES_BINARIAS = [
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".ico", ".svg",
    ".mp3", ".mp4", ".wav", ".ogg", ".flac",
    ".zip", ".rar", ".7z", ".tar", ".gz", ".apk", ".aab",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".exe", ".dll", ".so", ".dylib",
    ".keystore", ".jks", ".p12", ".pfx",
    ".ttf", ".otf", ".woff", ".woff2"
]

# 3. LISTA PERSONALIZABLE
carpetas_personalizadas = []
mostrar_archivos = True

def es_archivo_binario(nombre_archivo: str) -> bool:
    """Verifica si un archivo tiene extensión binaria."""
    nombre_lower = nombre_archivo.lower()
    for ext in EXTENSIONES_BINARIAS:
        if nombre_lower.endswith(ext):
            return True
    return False

def leer_contenido_archivo(ruta_archivo):
    """Intenta leer el contenido de un archivo de texto. Si es binario, retorna un mensaje."""
    # Verificar si es archivo binario por extensión
    if es_archivo_binario(ruta_archivo):
        return "[ARCHIVO BINARIO - CONTENIDO NO LEGIBLE]"
    
    try:
        with open(ruta_archivo, "r", encoding="utf-8", errors="ignore") as f:
            contenido = f.read()
            # Si el archivo tiene caracteres nulos o es muy corto (posible binario), marcarlo
            if "\x00" in contenido:
                return "[ARCHIVO BINARIO - CONTENIDO NO LEGIBLE]"
            return contenido
    except Exception as e:
        return f"[No se pudo leer: {e}]"

def generar_arbol(ruta_dir, prefijo="", ignorar=None, contenido_archivos=None):
    """
    Genera el árbol ignorando carpetas clave y recolecta contenido de archivos.
    """
    if ignorar is None:
        ignorar = []
    if contenido_archivos is None:
        contenido_archivos = []
    
    todos_los_filtros = set(FILTROS_SISTEMA + ignorar)
    
    try:
        contenido_total = sorted(os.listdir(ruta_dir))
        if not mostrar_archivos:
            contenido_total = [f for f in contenido_total if os.path.isdir(os.path.join(ruta_dir, f))]

        contenido = [f for f in contenido_total if f not in todos_los_filtros]
    except PermissionError:
        return [f"{prefijo}└── [Acceso Denegado]"], []

    lineas = []
    for i, elemento in enumerate(contenido):
        ruta_completa = os.path.join(ruta_dir, elemento)
        es_el_ultimo = (i == len(contenido) - 1)
        
        conector = "└── " if es_el_ultimo else "├── "
        lineas.append(f"{prefijo}{conector}{elemento}")
        
        if os.path.isdir(ruta_completa):
            nuevo_prefijo = prefijo + ("    " if es_el_ultimo else "│   ")
            sub_lineas, sub_contenido = generar_arbol(ruta_completa, nuevo_prefijo, ignorar)
            lineas.extend(sub_lineas)
            contenido_archivos.extend(sub_contenido)
        elif mostrar_archivos and os.path.isfile(ruta_completa):
            # Extraer contenido solo si no es binario
            texto = leer_contenido_archivo(ruta_completa)
            contenido_archivos.append(f"\n{'='*20}\nARCHIVO: {ruta_completa}\n{'='*20}\n{texto}")
            
    return lineas, contenido_archivos

def guardar_estructura():
    directorio_actual = os.getcwd()
    nombre_archivo = "estructura.txt"
    
    print(f"\n📂 Escaneando: {directorio_actual}...")
    
    arbol, contenido_files = generar_arbol(directorio_actual, ignorar=carpetas_personalizadas)
    
    resultado_final = [
        f"ESTRUCTURA DEL PROYECTO: {directorio_actual}",
        "=" * (len(directorio_actual) + 25),
        "",
        "."
    ] + arbol + ["\n\n" + "="*50 + "\nCONTENIDO DE LOS ARCHIVOS\n" + "="*50] + contenido_files
    
    try:
        with open(nombre_archivo, "w", encoding="utf-8") as f:
            f.write("\n".join(resultado_final))
        print(f"\n✅ Estructura y contenido guardados en '{nombre_archivo}'.")
    except Exception as e:
        print(f"\n❌ Error al guardar: {e}")

def menu_principal():
    global carpetas_personalizadas, mostrar_archivos
    while True:
        estado_archivos = "ON" if mostrar_archivos else "OFF"
        print(f"""
==========================================
    GENERADOR DE ESTRUCTURA + CONTENIDO
==========================================
1. 🚀 Comenzar escaneo
2. ⚙️ Agregar filtros extra
3. 📄 Mostrar archivos: [{estado_archivos}]
4. 🧹 Limpiar filtros
5. ❌ Salir
==========================================""")
        
        opcion = input("Selecciona una opción: ")
        if opcion == "1":
            guardar_estructura()
        elif opcion == "2":
            nueva = input("\nNombre a ignorar: ")
            if nueva:
                carpetas_personalizadas.extend([n.strip() for n in nueva.split(",")])
                carpetas_personalizadas = list(set(carpetas_personalizadas))
        elif opcion == "3":
            mostrar_archivos = not mostrar_archivos
        elif opcion == "5":
            break

if __name__ == "__main__":
    menu_principal()