import os
import json
import time
import requests

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK"]
GIST_TOKEN = os.environ["GIST_TOKEN"]
GIST_ID = os.environ["GIST_ID"]
QUESTION = os.environ["QUESTION"]
SOURCE = os.environ.get("SOURCE", "web")
RESPONSE_TARGET = os.environ.get("RESPONSE_TARGET", "discord")
CONVERSATION_ID = os.environ.get("CONVERSATION_ID", "default")

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={GEMINI_API_KEY}"

MAX_HISTORIAL = 10
MAX_CONVERSACIONES = 100
MAX_DIAS = 30
UMBRAL_GEMINI = 100


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


def leer_historial():
    try:
        r = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            timeout=30
        )
        content = r.json().get("files", {}).get("chat_history.json", {}).get("content", "{}")
        try:
            data = json.loads(content)
            if isinstance(data, list):
                return {"conversations": {"default": data}}
            return data
        except Exception:
            return {"conversations": {}}
    except Exception as e:
        print(f"Error leyendo historial: {e}")
        return {"conversations": {}}


def guardar_historial(data):
    try:
        conversations = data.get("conversations", {})

        if len(conversations) > MAX_CONVERSACIONES:
            sorted_convs = sorted(
                conversations.items(),
                key=lambda x: x[1].get("last_activity", ""),
                reverse=True
            )
            conversations = dict(sorted_convs[:MAX_CONVERSACIONES])

        cutoff = time.time() - (MAX_DIAS * 86400)
        for conv_id in list(conversations.keys()):
            last = conversations[conv_id].get("last_activity", "")
            try:
                last_ts = time.mktime(time.strptime(last, "%Y-%m-%dT%H:%M:%SZ"))
                if last_ts < cutoff:
                    del conversations[conv_id]
            except Exception:
                pass

        data["conversations"] = conversations

        requests.patch(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            json={
                "files": {
                    "chat_history.json": {
                        "content": json.dumps(data, ensure_ascii=False, indent=2)
                    }
                }
            },
            timeout=30
        )
        print("Historial guardado en Gist.")
    except Exception as e:
        print(f"Error guardando historial: {e}")


def obtener_historial_conversacion(data, conv_id):
    conversations = data.get("conversations", {})
    conv = conversations.get(conv_id, {})
    messages = conv.get("messages", [])
    return messages[-MAX_HISTORIAL:]


def leer_uso_gemini():
    try:
        r = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            timeout=30
        )
        content = r.json().get("files", {}).get("gemini_usage.json", {}).get("content", "{}")
        try:
            return json.loads(content)
        except Exception:
            return {}
    except Exception as e:
        print(f"Error leyendo uso: {e}")
        return {}


def guardar_uso_gemini(uso):
    try:
        requests.patch(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            json={
                "files": {
                    "gemini_usage.json": {
                        "content": json.dumps(uso, ensure_ascii=False, indent=2)
                    }
                }
            },
            timeout=30
        )
    except Exception as e:
        print(f"Error guardando uso: {e}")


def registrar_uso():
    uso = leer_uso_gemini()
    hoy = time.strftime("%Y-%m-%d", time.gmtime())

    if hoy not in uso:
        uso[hoy] = 0
    uso[hoy] += 1

    if len(uso) > 30:
        sorted_days = sorted(uso.keys(), reverse=True)[:30]
        uso = {k: uso[k] for k in sorted_days}

    guardar_uso_gemini(uso)

    if uso[hoy] == UMBRAL_GEMINI:
        enviar_discord(
            f"⚠️ **Alerta de uso de Gemini**\n"
            f"Hoy se han hecho **{UMBRAL_GEMINI}** peticiones a Gemini.\n"
            f"Revisa si hay abuso."
        )

    return uso[hoy]


def guardar_error(error_msg):
    try:
        r = requests.get(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            timeout=30
        )
        content = r.json().get("files", {}).get("error_log.json", {}).get("content", "[]")
        try:
            errores = json.loads(content)
        except Exception:
            errores = []

        errores.append({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": SOURCE,
            "conversation_id": CONVERSATION_ID,
            "question": QUESTION,
            "error": error_msg
        })

        errores = errores[-50:]

        requests.patch(
            f"https://api.github.com/gists/{GIST_ID}",
            headers={"Authorization": f"Bearer {GIST_TOKEN}"},
            json={
                "files": {
                    "error_log.json": {
                        "content": json.dumps(errores, ensure_ascii=False, indent=2)
                    }
                }
            },
            timeout=30
        )
        print("Error guardado en Gist.")
    except Exception as e:
        print(f"Error guardando error: {e}")


def construir_prompt(catalogo, pregunta, historial):
    apps = catalogo.get("apps", [])
    contexto = "Catálogo de aplicaciones disponibles:\n\n"

    for app in apps:
        contexto += f"- {app.get('name')} (v{app.get('version')}): {app.get('description')}\n"
        contexto += f"  Categoría: {app.get('category')}\n"
        contexto += f"  Tecnologías: {', '.join(app.get('technologies', []))}\n"
        if app.get('dedication'):
            contexto += f"  Dedicatoria: {app.get('dedication')}\n"
        contexto += "\n"

    historial_texto = ""
    if historial:
        historial_texto = "Historial de la conversación:\n"
        for msg in historial:
            historial_texto += f"Usuario: {msg.get('question', '')}\n"
            historial_texto += f"Asistente: {msg.get('answer', '')}\n\n"

    prompt = f"""Eres el asistente del catálogo Träume des Blauen, creado por Dreamer.

REGLAS ESTRICTAS:
1. Solo respondes preguntas sobre las aplicaciones del catálogo.
2. Si te preguntan sobre política, contenido explícito, temas médicos,
   o cualquier tema fuera del catálogo, responde amablemente que no puedes ayudar.
3. Nunca inventes información. Si no sabes algo, dilo.
4. Responde siempre en español, de forma clara y concisa.
5. No des consejos legales, médicos ni financieros.

{contexto}

{historial_texto}

Pregunta actual del usuario: {pregunta}

Respuesta:"""

    return prompt


def llamar_gemini(prompt, max_reintentos=3):
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

            if data.get("error", {}).get("code") == 503:
                espera = (intento + 1) * 5
                print(f"Modelo saturado. Reintentando en {espera}s...")
                time.sleep(espera)
                continue

            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "Sin respuesta")

            print(f"Error de Gemini: {data.get('error', {}).get('message', 'Desconocido')}")
            time.sleep(3)

        except Exception as e:
            print(f"Error en intento {intento + 1}: {e}")
            time.sleep(3)

    return "Lo siento, no puedo responder en este momento. Intenta de nuevo en unos minutos."


def enviar_discord(mensaje):
    payload = {"content": mensaje}
    try:
        requests.post(DISCORD_WEBHOOK, json=payload, timeout=30)
        print("Respuesta enviada a Discord.")
    except Exception as e:
        print(f"Error enviando a Discord: {e}")


def main():
    print(f"Pregunta de {SOURCE} (conversación: {CONVERSATION_ID}): {QUESTION}")

    catalogo = cargar_catalogo()
    data = leer_historial()
    historial = obtener_historial_conversacion(data, CONVERSATION_ID)

    prompt = construir_prompt(catalogo, QUESTION, historial)
    respuesta = llamar_gemini(prompt)

    print(f"Respuesta: {respuesta}")

    uso_hoy = registrar_uso()
    print(f"Peticiones a Gemini hoy: {uso_hoy}")

    if RESPONSE_TARGET == "discord":
        enviar_discord(f"Pregunta de {SOURCE}:\n{QUESTION}\n\nRespuesta:\n{respuesta}")

    conversations = data.get("conversations", {})
    if CONVERSATION_ID not in conversations:
        conversations[CONVERSATION_ID] = {"messages": [], "last_activity": ""}

    conversations[CONVERSATION_ID]["messages"].append({
        "question": QUESTION,
        "answer": respuesta,
        "source": SOURCE,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

    conversations[CONVERSATION_ID]["messages"] = conversations[CONVERSATION_ID]["messages"][-MAX_HISTORIAL:]
    conversations[CONVERSATION_ID]["last_activity"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    data["conversations"] = conversations
    guardar_historial(data)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"ERROR FATAL: {error_msg}")
        guardar_error(error_msg)
        enviar_discord(f"❌ **Error en el chatbot**\n{error_msg}\n\nRevisa el Gist para más detalles.")
        raise