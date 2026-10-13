import os
import asyncio
import hashlib
import requests
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
SESSION = os.environ["TELEGRAM_SESSION"]
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]
GIST_TOKEN = os.environ["GIST_TOKEN"]
GIST_ID = os.environ["GIST_ID"]

GRUPO = "cubanjobs"

PALABRAS_FUERTES = [
    "android", "kotlin", "flutter", "móvil", "mobile",
]

PALABRAS_DEBILES = [
    "desarrollador", "developer", "programador", "backend", "frontend",
]

PALABRAS_EXCLUIR = [
    "presencial", "senior", "5 años", "inglés avanzado",
    "power bi", "webflow", "django", "fullstack", "full stack",
    "ventas", "sales", "marketing", "recruiter", "remesas",
]


def leer_hashes():
    """Lee los hashes ya enviados desde el Gist."""
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
    """Guarda los hashes en el Gist."""
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


def hash_oferta(texto):
    """Genera un hash único para una oferta."""
    return hashlib.sha256(texto.encode("utf-8")).hexdigest()[:16]


async def main():
    hashes = leer_hashes()
    hashes_telegram = set(hashes.get("telegram", []))

    async with TelegramClient(StringSession(SESSION), API_ID, API_HASH) as client:
        mensajes_relevantes = []

        async for msg in client.iter_messages(GRUPO, limit=50):
            if not msg.text:
                continue

            texto = msg.text.lower()

            if any(e in texto for e in PALABRAS_EXCLUIR):
                continue

            es_relevante = False
            if any(k in texto for k in PALABRAS_FUERTES):
                es_relevante = True
            elif any(k in texto for k in PALABRAS_DEBILES) and \
                 any(r in texto for r in ["remoto", "remote"]):
                es_relevante = True

            if not es_relevante:
                continue

            h = hash_oferta(msg.text)
            if h in hashes_telegram:
                continue

            mensajes_relevantes.append((msg.text, h))

        if not mensajes_relevantes:
            print("Sin ofertas nuevas relevantes.")
            return

        cuerpo = "\n\n---\n\n".join(m[0] for m in mensajes_relevantes[:5])
        aviso = f"Ofertas relevantes en CubanTech Jobs:\n\n{cuerpo}"

        payload = {"content": aviso}
        requests.post(DISCORD_WEBHOOK, json=payload)
        print(f"Enviadas {len(mensajes_relevantes[:5])} ofertas nuevas a Discord.")

        # Guardar hashes nuevos
        for _, h in mensajes_relevantes[:5]:
            hashes_telegram.add(h)

        hashes["telegram"] = list(hashes_telegram)
        guardar_hashes(hashes)


asyncio.run(main())