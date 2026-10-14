import os
import json
import time
import requests

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]
GIST_TOKEN = os.environ["GIST_TOKEN"]
GIST_ID = os.environ["GIST_ID"]
QUESTION = os.environ["QUESTION"]
SOURCE = os.environ.get("SOURCE", "web")
RESPONSE_TARGET = os.environ.get("RESPONSE_TARGET", "discord")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={GEMINI_API_KEY}"

# Cargar el catalog.json para dar contexto a Gemini
def cargar_catalogo():
    try:
        response = requests.get(
            "https://raw.githubusercontent.com/luisenriquepupo16-rgb/Traeume-des-Blauen/main/docs/catalog.json",
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error cargando catálogo: {e}")
        return {}


def construir_prompt(catalogo, pregunta):
    """Construye el prompt con el catálogo como contexto."""
    apps = catalogo.get("apps", [])
    contexto = "Catálogo de aplicaciones disponibles:\n\n"

    for app in apps:
        contexto += f"- {app.get('name')} (v{app.get('version')}): {app.get('description')}\n"
        contexto += f"  Categoría: {app.get('category')}\n"
        contexto += f"  Tecnologías: {', '.join(app.get('technologies', []))}\n"
        if app.get('dedication'):
            contexto += f"  Dedicatoria: {app.get('dedication')}\n"
        contexto += "\n"

    prompt = f"""Eres el asistente del catálogo Träume des Blauen, creado por Dreamer.
Respondes preguntas sobre las aplicaciones disponibles de forma cercana y útil.
Si no sabes algo, dilo con honestidad. No inventes información.

{contexto}

Pregunta del usuario: {pregunta}

Responde de forma clara y concisa, en español."""

    return prompt


def llamar_gemini(prompt, max_reintentos=3):
    """Llama a Gemini con reintentos si da 503."""
    for intento in range(max_reintentos):
        try:
            response = requests.post(
                GEMINI_URL,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                },
                timeout=60
            )

            data = response.json()

            # Si da 503, esperar y reintentar
            if data.get("error", {}).get("code") == 503:
                espera = (intento + 1) * 5
                print(f"Modelo saturado. Reintentando en {espera}s...")
                time.sleep(espera)
                continue

            # Extraer respuesta
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "Sin respuesta")

            return f"Error: {data.get('error', {}).get('message', 'Desconocido')}"

        except Exception as e:
            print(f"Error en intento {intento + 1}: {e}")
            time.sleep(3)

    return "El modelo está saturado ahora mismo. Inténtalo de nuevo en unos minutos."


def enviar_discord(mensaje):
    """Envía la respuesta a Discord."""
    payload = {"content": mensaje}
    try:
        requests.post(DISCORD_WEBHOOK, json=payload, timeout=30)
        print("Respuesta enviada a Discord.")
    except Exception as e:
        print(f"Error enviando a Discord: {e}")


def guardar_gist(pregunta, respuesta):
    """Guarda la conversación en el Gist."""
    try:
        # Leer Gist actual
        r = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            timeout=30
        )
        content = r.json().get("files", {}).get("chat_history.json", {}).get("content", "[]")
        try:
            historial = json.loads(content)
        except Exception:
            historial = []

        # Añadir nueva entrada
        historial.append({
            "source": SOURCE,
            "question": QUESTION,
            "answer": respuesta
        })

        # Guardar solo las últimas 50
        historial = historial[-50:]

        # Actualizar Gist
        requests.patch(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            json={
                "files": {
                    "chat_history.json": {
                        "content": json.dumps(historial, ensure_ascii=False, indent=2)
                    }
                }
            },
            timeout=30
        )
        print("Historial guardado en Gist.")
    except Exception as e:
        print(f"Error guardando en Gist: {e}")


def main():
    print(f"Pregunta de {SOURCE}: {QUESTION}")

    catalogo = cargar_catalogo()
    prompt = construir_prompt(catalogo, QUESTION)
    respuesta = llamar_gemini(prompt)

    print(f"Respuesta: {respuesta}")

    # Enviar según destino
    if RESPONSE_TARGET == "discord":
        enviar_discord(f"💬 **Pregunta de {SOURCE}:**\n{QUESTION}\n\n**Respuesta:**\n{respuesta}")
    elif RESPONSE_TARGET == "gist":
        guardar_gist(QUESTION, respuesta)

    # Siempre guardar en el Gist como historial
    guardar_gist(QUESTION, respuesta)


if __name__ == "__main__":
    main()