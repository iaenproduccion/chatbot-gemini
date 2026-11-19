// Mide las cifras reales del video: tokens por mensaje, historial que crece,
// razonamiento bajo contra alto y la pregunta trampa.
// Uso: node --env-file=.env.local scripts/medir.mjs [conversacion|razonamiento|trampa|todo]
import fs from 'node:fs';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const ia = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODELO = 'gemini-4-hydrogen';
const SISTEMA = 'Eres un asistente para desarrolladores. Responde corto y en español.';
const SALIDA = 'mediciones.json';
const resultados = fs.existsSync(SALIDA) ? JSON.parse(fs.readFileSync(SALIDA, 'utf8')) : {};

const errores = [];

// La capa gratuita a veces responde 503 (alta demanda) o 429: reintenta y lo anota.
async function preguntar(historial, nivel = ThinkingLevel.LOW, tope = 10) {
  for (let intento = 1; ; intento++) {
    try {
      return await preguntarUnaVez(historial, nivel, tope);
    } catch (e) {
      errores.push({ fecha: new Date().toISOString(), estado: e.status, intento });
      if (![429, 500, 503].includes(e.status) || intento >= 6) throw e;
      console.log(`  error ${e.status}; reintento en ${10 * intento} s`);
      await new Promise((ok) => setTimeout(ok, 10000 * intento));
    }
  }
}

async function preguntarUnaVez(historial, nivel, tope) {
  const t0 = performance.now();
  let primero = null;
  let texto = '';
  let uso;
  const respuesta = await ia.models.generateContentStream({
    model: MODELO,
    contents: historial.slice(-tope).map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'model', parts: [{ text: m.texto }] })),
    config: { systemInstruction: SISTEMA, thinkingConfig: { thinkingLevel: nivel } },
  });
  for await (const trozo of respuesta) {
    if (trozo.text) {
      primero ??= performance.now() - t0;
      texto += trozo.text;
    }
    uso = trozo.usageMetadata ?? uso;
  }
  return {
    texto,
    primerTrozoS: +(primero / 1000).toFixed(2),
    totalS: +((performance.now() - t0) / 1000).toFixed(2),
    entrada: uso?.promptTokenCount ?? 0,
    salida: uso?.candidatesTokenCount ?? 0,
    razonamiento: uso?.thoughtsTokenCount ?? 0,
    uso,
  };
}

const PREGUNTAS = [
  '¿Qué diferencia hay entre un Server Component y un Client Component en Next.js?',
  '¿Y eso cómo se aplica a un chat que hace streaming?',
  'Dame un ejemplo corto de un hook useDebounce en TypeScript.',
  '¿Cómo lo uso en un input de búsqueda?',
  '¿Qué pasa si el componente se desmonta antes del timeout?',
  '¿Cuándo conviene useDeferredValue en vez de debounce?',
  '¿Cómo pruebo ese hook con Vitest?',
  '¿Y si uso fake timers?',
  'Resume en tres puntos lo que hablamos.',
  '¿Qué me recomiendas aprender después?',
];

async function conversacion(tope = 10) {
  const historial = [];
  const turnos = [];
  for (const [i, p] of PREGUNTAS.entries()) {
    historial.push({ rol: 'usuario', texto: p });
    const r = await preguntar(historial, ThinkingLevel.LOW, tope);
    historial.push({ rol: 'modelo', texto: r.texto });
    turnos.push({ n: i + 1, pregunta: p, ...r, texto: r.texto.slice(0, 400) });
    console.log(`mensaje ${i + 1}: entrada ${r.entrada}, salida ${r.salida}, razonamiento ${r.razonamiento}, primer trozo ${r.primerTrozoS} s`);
    await new Promise((ok) => setTimeout(ok, 8000)); // sin rozar el límite por minuto
  }
  resultados[tope === 10 ? 'conversacion' : 'conversacionSinTope'] = turnos;
}

async function razonamiento() {
  const p = 'Tengo un endpoint de Next.js que tarda 3 segundos. ¿Cómo lo hago más rápido? Dame las 3 ideas más importantes.';
  const bajo = await preguntar([{ rol: 'usuario', texto: p }], ThinkingLevel.LOW);
  console.log(`bajo: primer trozo ${bajo.primerTrozoS} s, entrada ${bajo.entrada}, salida ${bajo.salida}, razonamiento ${bajo.razonamiento}`);
  await new Promise((ok) => setTimeout(ok, 4000));
  const alto = await preguntar([{ rol: 'usuario', texto: p }], ThinkingLevel.HIGH);
  console.log(`alto: primer trozo ${alto.primerTrozoS} s, entrada ${alto.entrada}, salida ${alto.salida}, razonamiento ${alto.razonamiento}`);
  resultados.razonamiento = { pregunta: p, bajo, alto };
}

async function razonamiento3() {
  const p = 'Tengo un endpoint de Next.js que tarda 3 segundos. ¿Cómo lo hago más rápido? Dame las 3 ideas más importantes.';
  const muestras = [];
  for (let i = 0; i < 3; i++) {
    for (const [nombre, nivel] of [['bajo', ThinkingLevel.LOW], ['alto', ThinkingLevel.HIGH]]) {
      await new Promise((ok) => setTimeout(ok, 15000));
      const r = await preguntar([{ rol: 'usuario', texto: p }], nivel);
      console.log(`${nombre} ${i + 1}: primer trozo ${r.primerTrozoS} s, total ${r.totalS} s, salida ${r.salida}, razonamiento ${r.razonamiento}`);
      muestras.push({ nivel: nombre, ...r });
    }
  }
  resultados.razonamiento3 = { pregunta: p, muestras };
}

async function trampa() {
  const p = 'Dame el código en TypeScript para llamar a la nueva API de Decisiones de Gemini con el SDK @google/genai.';
  const r = await preguntar([{ rol: 'usuario', texto: p }]);
  console.log(`trampa:\n${r.texto}`);
  resultados.trampa = { pregunta: p, ...r };
}

const que = process.argv[2] ?? 'todo';
if (que === 'conversacion' || que === 'todo') await conversacion();
if (que === 'razonamiento' || que === 'todo') await razonamiento();
if (que === 'trampa' || que === 'todo') await trampa();
if (que === 'razonamiento3') await razonamiento3();
if (que === 'sintope') await conversacion(1000);
resultados.fecha = new Date().toISOString();
resultados.errores = [...(resultados.errores ?? []), ...errores];
fs.writeFileSync(SALIDA, JSON.stringify(resultados, null, 2));
console.log(`\nGuardado en ${SALIDA}`);
