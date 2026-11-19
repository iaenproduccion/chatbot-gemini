# Chatbot con Gemini 4 en Next.js

Chatbot con streaming y memoria de conversación, hecho con **Next.js** y **Gemini 4 Hydrogen** (SDK oficial `@google/genai`), en la capa gratuita de la API de Gemini.

Es el proyecto del video **"Chatbot con Gemini 4 y Next.js: gratis, pero con trampa"** de [IA en Producción](https://www.youtube.com/@ia.en.produccion), donde lo construimos, lo rompemos a propósito y sacamos la cuenta de lo que cuesta.

## Qué tiene

- `app/api/chat/route.ts`: ruta de API que llama a Gemini con `generateContentStream` y devuelve la respuesta en streaming. El historial se corta a los últimos 10 mensajes, el razonamiento va en nivel bajo y el error 429 se convierte en un mensaje claro. Imprime en la consola del servidor los tokens de cada respuesta.
- `app/page.tsx`: la interfaz del chat. La memoria de la conversación vive en el navegador.
- `scripts/`: los scripts con los que medimos las cifras del video.

## Cómo correrlo

1. Crea una clave de API en [Google AI Studio](https://aistudio.google.com).
2. Crea el archivo `.env.local` en la raíz (no se sube a git):

   ```bash
   GEMINI_API_KEY=tu-clave-aqui
   ```

3. Instala y arranca:

   ```bash
   npm install
   npm run dev
   ```

4. Abre http://localhost:3000.

## Scripts de medición

Gastan peticiones de tu cuota gratuita (en noviembre de 2026 medimos **5 por minuto y 20 al día** para Gemini 4 Hydrogen).

| Script | Qué hace |
|---|---|
| `node --env-file=.env.local scripts/medir.mjs [conversacion\|razonamiento\|trampa\|todo]` | Tokens por mensaje, historial que crece, razonamiento bajo contra alto y la pregunta trampa. Guarda los resultados en `mediciones.json`. |
| `node scripts/rafaga.mjs` | Con `npm run dev` corriendo, manda 30 preguntas a la vez a la ruta y cuenta las respuestas. |
| `node --env-file=.env.local scripts/limite.mjs` | Llama a Gemini directamente y muestra qué límite de la capa gratuita se alcanzó. |

`mediciones.json` tiene las cifras que medimos para el video.

## Ojo con la capa gratuita

- En la capa gratuita, Google puede usar lo que envías para mejorar sus productos. No le mandes datos de clientes ni nada privado.
- Nunca pongas la clave en el código ni la muestres en pantalla: solo en `.env.local`.

## Licencia

MIT. Ver `LICENSE`.
