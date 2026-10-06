import { useState } from 'react';
import { SIMULADOR_CONFIG, SIMULADOR_HABILITADO } from '../content/como-funciona';
import { formatMonFromWei } from '../landing/pozo';
import { simularEntrada } from './simular';

function parseWei(text: string): bigint | null {
  if (!/^\d+$/.test(text)) return null;
  try {
    return BigInt(text);
  } catch {
    return null;
  }
}

export function SimuladorEntrada() {
  const [deposito, setDeposito] = useState(String(SIMULADOR_CONFIG.depositoMinWei));
  const [entrada, setEntrada] = useState('41');
  const [seCumple, setSeCumple] = useState(true);
  const [errorDeposito, setErrorDeposito] = useState('');
  const [errorEntrada, setErrorEntrada] = useState('');
  const [resultado, setResultado] = useState('');

  if (!SIMULADOR_HABILITADO) {
    return (
      <p className="m-0 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm">
        El simulador está apagado. Las reglas de reparto todavía están en validación y esta página no muestra números de ejemplo como si fueran reales.
      </p>
    );
  }

  function calcular() {
    const depositoWei = parseWei(deposito);
    const numero = Number(entrada);
    if (depositoWei === null) {
      setErrorDeposito('Escribí el depósito en wei, solo dígitos.');
      setResultado('');
      return;
    }
    const base = {
      depositoWei,
      entrada: numero,
      pozoWei: SIMULADOR_CONFIG.pozoEjemploWei,
      pesoTotal: SIMULADOR_CONFIG.pesoTotalEjemplo,
    };
    const si = simularEntrada({ ...base, seCumple: true }, SIMULADOR_CONFIG);
    const no = simularEntrada({ ...base, seCumple: false }, SIMULADOR_CONFIG);
    if (!si.ok || !no.ok) {
      const fallo = !si.ok ? si : no;
      if (!fallo.ok) {
        setErrorDeposito(fallo.campo === 'deposito' ? fallo.mensaje : '');
        setErrorEntrada(fallo.campo === 'entrada' ? fallo.mensaje : '');
      }
      setResultado('');
      return;
    }
    setErrorDeposito('');
    setErrorEntrada('');
    const elegido = seCumple ? si : no;
    setResultado(
      `Con la entrada ${numero} tu peso es ${elegido.peso}. Si se cumple, recibirías ${formatMonFromWei(si.partePozoWei)} del pozo de ejemplo. Si no se cumple, recibirías ${formatMonFromWei(no.partePozoWei)} del pozo. Aportás ${formatMonFromWei(elegido.comisionWei)} en comisiones de ejemplo. Tu depósito, ${formatMonFromWei(elegido.depositoWei)}, queda aparte.`,
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        calcular();
      }}
    >
      <p className="m-0 text-sm font-semibold">Reglas en validación. Simulación ilustrativa con reglas de ejemplo. Los valores reales los define el contrato de cada pozo.</p>
      <label className="flex flex-col gap-1 text-sm">
        Depósito en wei
        <input className="landing-focus h-11 rounded border border-[var(--line)] bg-[var(--paper)] px-3 text-[var(--ink)]" value={deposito} onChange={(event) => setDeposito(event.target.value)} inputMode="numeric" />
        {errorDeposito ? <span role="alert">{errorDeposito}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Número de entrada
        <input className="landing-focus h-11 rounded border border-[var(--line)] bg-[var(--paper)] px-3 text-[var(--ink)]" value={entrada} onChange={(event) => setEntrada(event.target.value)} inputMode="numeric" />
        {errorEntrada ? <span role="alert">{errorEntrada}</span> : null}
      </label>
      <fieldset className="m-0 flex gap-4 border-0 p-0">
        <legend className="text-sm">Resultado</legend>
        <label className="text-sm"><input type="radio" name="resultado" checked={seCumple} onChange={() => setSeCumple(true)} /> Se cumple</label>
        <label className="text-sm"><input type="radio" name="resultado" checked={!seCumple} onChange={() => setSeCumple(false)} /> No se cumple</label>
      </fieldset>
      <button type="submit" className="sun-btn landing-focus h-11 px-4">Calcular</button>
      <p aria-live="polite" className="m-0 min-h-6">{resultado}</p>
    </form>
  );
}
