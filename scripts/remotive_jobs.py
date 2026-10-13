import os
import requests

DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]

# Palabras clave fuertes
PALABRAS_FUERTES = [
    "android", "kotlin", "flutter",
]

# Palabras clave débiles: solo si van con "remote"
PALABRAS_DEBILES = [
    "mobile", "developer", "engineer", "programmer",
]

# Palabras que descartan
PALABRAS_EXCLUIR = [
    "senior", "lead", "principal", "5+ years",
    "sales", "marketing", "recruiter", "power bi",
    "webflow", "django", "fullstack", "full stack",
    "data scientist", "devops", "qa ",
]

API_URL = "https://remotive.com/api/remote-jobs"

def fetch_jobs():
    response = requests.get(API_URL, timeout=30)
    response.raise_for_status()
    return response.json().get("jobs", [])

def filtrar_jobs(jobs):
    relevantes = []
    for job in jobs:
        titulo = job.get("title", "").lower()
        descripcion = job.get("description", "").lower()
        tags = " ".join(job.get("tags", [])).lower()
        texto = f"{titulo} {descripcion} {tags}"

        if any(e in texto for e in PALABRAS_EXCLUIR):
            continue

        if any(k in texto for k in PALABRAS_FUERTES):
            relevantes.append(job)
            continue

        if any(k in texto for k in PALABRAS_DEBILES) and "remote" in texto:
            relevantes.append(job)

    return relevantes

def enviar_discord(jobs):
    if not jobs:
        print("Sin ofertas relevantes.")
        return

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