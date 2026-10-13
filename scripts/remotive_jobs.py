import os
import hashlib
import requests

DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]
GIST_TOKEN = os.environ["GIST_TOKEN"]
GIST_ID = os.environ["GIST_ID"]

PALABRAS_FUERTES = [
    "android", "kotlin", "flutter",
]

PALABRAS_DEBILES = [
    "mobile", "developer", "engineer", "programmer",
]

PALABRAS_EXCLUIR = [
    "senior", "lead", "principal", "5+ years",
    "sales", "marketing", "recruiter", "power bi",
    "webflow", "django", "fullstack", "full stack",
    "data scientist", "devops", "qa ",
]

API_URL = "https://remotive.com/api/remote-jobs"


def leer_hashes():
    response = requests.get(
        f"https://api.github.com/gists/{GIST_ID}",
        headers={"Authorization": f"Bearer {GIST_TOKEN}"}
    )
    if response.status_code != 200:
        return {"telegram": [], "remotive": []}

    content = response.json().get("files", {}).get("jobs_sent.json", {}).get("content", "{}")
    try:
        import json
        data = json.loads(content)
        return {
            "telegram": data.get("telegram", []),
            "remotive": data.get("remotive", [])
        }
    except Exception:
        return {"telegram": [], "remotive": []}


def guardar_hashes(data):
    import json
    body = {
        "files": {
            "jobs_sent.json": {
                "content": json.dumps(data, indent=2)
            }
        }
    }
    requests.patch(
        f"https://api.github.com/gists/{GIST_ID}",
        headers={"Authorization": f"Bearer {GIST_TOKEN}"},
        json=body
    )


def hash_oferta(job):
    texto = f"{job.get('title', '')}{job.get('company_name', '')}{job.get('url', '')}"
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()[:16]


def fetch_jobs():
    response = requests.get(API_URL, timeout=30)
    response.raise_for_status()
    return response.json().get("jobs", [])


def filtrar_jobs(jobs, hashes_remotive):
    relevantes = []
    for job in jobs:
        titulo = job.get("title", "").lower()
        descripcion = job.get("description", "").lower()
        tags = " ".join(job.get("tags", [])).lower()
        texto = f"{titulo} {descripcion} {tags}"

        if any(e in texto for e in PALABRAS_EXCLUIR):
            continue

        es_relevante = False
        if any(k in texto for k in PALABRAS_FUERTES):
            es_relevante = True
        elif any(k in texto for k in PALABRAS_DEBILES) and "remote" in texto:
            es_relevante = True

        if not es_relevante:
            continue

        h = hash_oferta(job)
        if h in hashes_remotive:
            continue

        relevantes.append((job, h))

    return relevantes


def enviar_discord(relevantes):
    if not relevantes:
        print("Sin ofertas nuevas relevantes.")
        return

    cuerpo = ""
    for job, _ in relevantes[:5]:
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
    print(f"Enviadas {len(relevantes[:5])} ofertas nuevas a Discord.")


def main():
    print("Consultando Remotive...")
    jobs = fetch_jobs()
    print(f"Total de trabajos: {len(jobs)}")

    hashes = leer_hashes()
    hashes_remotive = set(hashes.get("remotive", []))

    relevantes = filtrar_jobs(jobs, hashes_remotive)
    print(f"Relevantes nuevas: {len(relevantes)}")

    enviar_discord(relevantes)

    # Guardar hashes nuevos
    for _, h in relevantes[:5]:
        hashes_remotive.add(h)

    hashes["remotive"] = list(hashes_remotive)
    guardar_hashes(hashes)


if __name__ == "__main__":
    main()