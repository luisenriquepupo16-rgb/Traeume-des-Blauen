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

PALABRAS_CLAVE = [
    "android", "kotlin", "remoto", "remote",
    "desarrollador", "developer", "programador",
    "flutter", "backend", "frontend", "móvil",
]

PALABRAS_EXCLUIR = ["presencial", "senior", "5 años", "inglés avanzado"]

async def main():
    async with TelegramClient(StringSession(SESSION), API_ID, API_HASH) as client:
        mensajes_relevantes = []

        async for msg in client.iter_messages(GRUPO, limit=50):
            if not msg.text:
                continue

            texto = msg.text.lower()

            if any(k in texto for k in PALABRAS_CLAVE):
                if not any(e in texto for e in PALABRAS_EXCLUIR):
                    mensajes_relevantes.append(msg.text)

        if not mensajes_relevantes:
            print("Sin ofertas relevantes hoy.")
            return

        cuerpo = "\n\n".join(f"• {m[:300]}" for m in mensajes_relevantes[:5])
        aviso = f"Ofertas relevantes en CubanTech Jobs:\n\n{cuerpo}"

        payload = {"content": aviso}
        requests.post(DISCORD_WEBHOOK, json=payload)
        print(f"Enviadas {len(mensajes_relevantes)} ofertas a Discord.")

asyncio.run(main())