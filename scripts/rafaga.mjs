// Manda 30 preguntas a la vez a nuestra ruta y cuenta qué responde.
// Uso (con `npm run dev` corriendo): node scripts/rafaga.mjs
const N = 30;
const pedir = () =>
  fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify({ mensajes: [{ rol: 'usuario', texto: 'Di hola' }] }),
  }).then(async (r) => ({ estado: r.status, texto: await r.text() }));

const respuestas = await Promise.all(Array.from({ length: N }, pedir));
const conteo = {};
for (const r of respuestas) conteo[r.estado] = (conteo[r.estado] ?? 0) + 1;

console.log(respuestas.map((r) => r.estado).join(' '));
console.log('\nResumen:', Object.entries(conteo).map(([e, n]) => `${n} × ${e}`).join(', '));
const error = respuestas.find((r) => r.estado !== 200);
if (error) console.log('Mensaje:', error.texto);
