import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';

const ia = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Mensaje = { rol: 'usuario' | 'modelo'; texto: string };

export async function POST(req: Request) {
  const { mensajes }: { mensajes: Mensaje[] } = await req.json();

  try {
    const respuesta = await ia.models.generateContentStream({
      model: 'gemini-4-hydrogen',
      contents: mensajes.slice(-10).map((m) => ({
        role: m.rol === 'usuario' ? 'user' : 'model',
        parts: [{ text: m.texto }],
      })),
      config: {
        systemInstruction: 'Eres un asistente para desarrolladores. Responde corto y en español.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const codificador = new TextEncoder();
    const stream = new ReadableStream({
      async start(control) {
        let uso;
        for await (const trozo of respuesta) {
          if (trozo.text) control.enqueue(codificador.encode(trozo.text));
          uso = trozo.usageMetadata ?? uso;
        }
        console.log('tokens:', uso);
        control.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return new Response('Llegamos al límite gratuito. Intenta en un minuto.', { status: 429 });
    }
    throw error;
  }
}