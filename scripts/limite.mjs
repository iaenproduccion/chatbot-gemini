// Llama a Gemini directo y muestra qué límite de la capa gratuita se alcanzó.
// Uso: node --env-file=.env.local scripts/limite.mjs
import { ApiError, GoogleGenAI } from '@google/genai';

const ia = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
try {
  const r = await ia.models.generateContent({ model: 'gemini-4-hydrogen', contents: 'Di hola' });
  console.log('Respondió:', r.text);
} catch (error) {
  if (!(error instanceof ApiError)) throw error;
  const texto = error.message;
  console.log('Estado:', error.status);
  console.log('Límite:', texto.match(/Generate content requests per (day|minute)[^.\\]*/)?.[0]);
  console.log('Valor: ', texto.match(/limit: (\d+)/)?.[1], 'peticiones');
  console.log('Vuelve:', texto.match(/retry in ((?:\d+h)?(?:\d+m)?(?:\d+)?)/)?.[1].concat(' ').replace(/(\d) $/, '$1s').trim());
}
