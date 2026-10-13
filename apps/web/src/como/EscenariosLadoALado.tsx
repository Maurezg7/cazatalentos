import { useT } from '../i18n/LocaleContext';

export function EscenariosLadoALado({ cumple, noCumple }: { cumple: string; noCumple: string }) {
  const t = useT();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="m-0 font-display text-xl uppercase">{t('scenarioGoalMet')}</h3>
        <p className="m-0 mt-2">{cumple}</p>
      </article>
      <article className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--panel)] p-4">
        <h3 className="m-0 font-display text-xl uppercase">{t('scenarioGoalMissed')}</h3>
        <p className="m-0 mt-2">{noCumple}</p>
      </article>
    </div>
  );
}
