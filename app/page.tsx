'use client';
import { useState, type FormEvent } from 'react';

type Mensaje = { rol: 'usuario' | 'modelo'; texto: string };

export default function Chat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!entrada.trim() || cargando) return;
    const historial: Mensaje[] = [...mensajes, { rol: 'usuario', texto: entrada }];
    setMensajes([...historial, { rol: 'modelo', texto: '' }]);
    setEntrada('');
    setCargando(true);

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ mensajes: historial }),
    });
    const lector = res.body!.getReader();
    const decodificador = new TextDecoder();
    let texto = '';
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      texto += decodificador.decode(value, { stream: true });
      setMensajes([...historial, { rol: 'modelo', texto }]);
    }
    setCargando(false);
  }

  return (
    <main className="chat">
      {mensajes.map((m, i) => (
        <p key={i} className={m.rol}>{m.texto}</p>
      ))}
      <form onSubmit={enviar}>
        <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Pregunta algo…" />
        <button disabled={cargando}>Enviar</button>
      </form>
    </main>
  );
}
