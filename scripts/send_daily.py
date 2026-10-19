import json
import os
import requests
from datetime import datetime
from zoneinfo import ZoneInfo

JSON_PATH = "docs/assets/tasks.json"
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK"]

CUBA_TZ = ZoneInfo("America/Havana")


def load():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save(data):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    # Fecha de hoy en hora de Cuba
    today = datetime.now(CUBA_TZ).strftime("%Y-%m-%d")
    print(f"Fecha de hoy (Cuba): {today}")

    data = load()

    if today not in data or not data[today].get("tasks"):
        print(f"No hay tareas para {today}.")
        return

    tasks = data[today]["tasks"]

    # Construir el mensaje
    msg = f"📅 {today}\n\nTareas:\n"
    for task in tasks:
        msg += f"- {task}\n"
    msg += "\nFinish"

    # Enviar a Discord
    payload = {"content": msg}
    response = requests.post(DISCORD_WEBHOOK, json=payload, timeout=30)
    if response.status_code not in (200, 204):
        print(f"Error enviando a Discord: {response.status_code} - {response.text}")
        return
    print("Mensaje enviado a Discord.")

    # Eliminar el día del JSON
    del data[today]
    save(data)
    print(f"Tareas de {today} eliminadas del JSON.")


if __name__ == "__main__":
    main()