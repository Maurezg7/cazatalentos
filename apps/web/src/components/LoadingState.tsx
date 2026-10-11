type LoadingStateProps = {
  label?: string;
  /** Compact for overlays and inline shells */
  size?: 'md' | 'sm';
};

export function LoadingState({ label, size = 'md' }: LoadingStateProps) {
  const mark = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11';
  const pad = size === 'sm' ? 'py-6' : 'py-16';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${pad}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={`loading-mark ${mark}`} aria-hidden="true">
        <span className="loading-mark-ring" />
        <span className="loading-mark-stub" />
      </span>
      {label ? (
        <p className="m-0 text-center font-body text-sm tracking-wide text-[var(--muted)]">{label}</p>
      ) : (
        <span className="sr-only">Cargando</span>
      )}
    </div>
  );
}
