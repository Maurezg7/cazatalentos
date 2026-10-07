export function EscenariosLadoALado({ cumple, noCumple }: { cumple: string; noCumple: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="m-0 font-display text-xl uppercase">Si la meta se cumple</h3>
        <p className="m-0 mt-2">{cumple}</p>
      </article>
      <article className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="m-0 font-display text-xl uppercase">Si no se cumple</h3>
        <p className="m-0 mt-2">{noCumple}</p>
      </article>
    </div>
  );
}
