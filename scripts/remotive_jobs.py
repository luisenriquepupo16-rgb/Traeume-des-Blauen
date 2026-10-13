import os
import requests
from datetime import datetime, timedelta

DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]

# Palabras clave que te interesan
PALABRAS_CLAVE = [
    "android", "kotlin", "mobile", "móvil",
    "flutter", "remote", "remoto",
]

# Palabras que descartan la oferta
PALABRAS_EXCLUIR = ["senior", "lead", "principal", "5+ years"]

# URL de la API de Remotive
API_URL = "https://remotive.com/api/remote-jobs"

def fetch_jobs():
    """Obtiene todos los trabajos de Remotive."""
    response = requests.get(API_URL, timeout=30)
    response.raise_for_status()
    return response.json().get("jobs", [])

def filtrar_jobs(jobs):
    """Filtra los trabajos por palabras clave y excluidas."""
    relevantes = []

    for job in jobs:
        titulo = job.get("title", "").lower()
        descripcion = job.get("description", "").lower()
        tags = " ".join(job.get("tags", [])).lower()
        texto = f"{titulo} {descripcion} {tags}"

        # Debe contener alguna palabra clave
        if not any(k in texto for k in PALABRAS_CLAVE):
            continue

        # No debe contener palabras excluidas
        if any(e in texto for e in PALABRAS_EXCLUIR):
            continue

        relevantes.append(job)

    return relevantes

def enviar_discord(jobs):
    """Envía los trabajos relevantes a Discord."""
    if not jobs:
        print("Sin ofertas relevantes.")
        return

    # Máximo 5 ofertas por mensaje
    cuerpo = ""
    for job in jobs[:5]:
        titulo = job.get("title", "Sin título")
        empresa = job.get("company_name", "Empresa desconocida")
        url = job.get("url", "")
        salario = job.get("salary", "No especificado")
        ubicacion = job.get("candidate_required_location", "No especificada")

        cuerpo += f"\n**{titulo}**\n"
        cuerpo += f"Empresa: {empresa}\n"
        cuerpo += f"Ubicación: {ubicacion}\n"
        if salario:
            cuerpo += f"Salario: {salario}\n"
        cuerpo += f"[Ver oferta]({url})\n"

    aviso = f"Ofertas remotas en Remotive:\n{cuerpo}"

    payload = {"content": aviso}
    requests.post(DISCORD_WEBHOOK, json=payload)
    print(f"Enviadas {len(jobs[:5])} ofertas a Discord.")

def main():
    print("Consultando Remotive...")
    jobs = fetch_jobs()
    print(f"Total de trabajos: {len(jobs)}")

    relevantes = filtrar_jobs(jobs)
    print(f"Relevantes: {len(relevantes)}")

    enviar_discord(relevantes)

if __name__ == "__main__":
    main()