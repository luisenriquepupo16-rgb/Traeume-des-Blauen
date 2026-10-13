import os
import asyncio
import requests
from telethon import TelegramClient
from telethon.sessions import StringSession

API_ID = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
SESSION = os.environ["TELEGRAM_SESSION"]
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]

GRUPO = "cubanjobs"

# Palabras clave fuertes: si aparece una, es relevante
PALABRAS_FUERTES = [
    "android", "kotlin", "flutter", "móvil", "mobile",
]

# Palabras clave débiles: solo relevantes si van acompañadas de "remoto"
PALABRAS_DEBILES = [
    "desarrollador", "developer", "programador", "backend", "frontend",
]

# Palabras que descartan la oferta directamente
PALABRAS_EXCLUIR = [
    "presencial", "senior", "5 años", "inglés avanzado",
    "power bi", "webflow", "django", "fullstack", "full stack",
    "ventas", "sales", "marketing", "recruiter", "remesas",
]

async def main():
    async with TelegramClient(StringSession(SESSION), API_ID, API_HASH) as client:
        mensajes_relevantes = []

        async for msg in client.iter_messages(GRUPO, limit=50):
            if not msg.text:
                continue

            texto = msg.text.lower()

            # Descartar si contiene palabra excluida
            if any(e in texto for e in PALABRAS_EXCLUIR):
                continue

            # Aceptar si contiene palabra fuerte
            if any(k in texto for k in PALABRAS_FUERTES):
                mensajes_relevantes.append(msg.text)
                continue

            # Aceptar si contiene palabra débil + remoto
            if any(k in texto for k in PALABRAS_DEBILES) and \
               any(r in texto for r in ["remoto", "remote"]):
                mensajes_relevantes.append(msg.text)

        if not mensajes_relevantes:
            print("Sin ofertas relevantes hoy.")
            return

        # Sin límite de caracteres: se muestra el mensaje completo
        cuerpo = "\n\n---\n\n".join(mensajes_relevantes[:5])
        aviso = f"Ofertas relevantes en CubanTech Jobs:\n\n{cuerpo}"

        payload = {"content": aviso}
        requests.post(DISCORD_WEBHOOK, json=payload)
        print(f"Enviadas {len(mensajes_relevantes[:5])} ofertas a Discord.")

asyncio.run(main())