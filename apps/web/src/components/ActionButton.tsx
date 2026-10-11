type ActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  variant?: 'primary' | 'secondary';
};

export function ActionButton({
  onClick,
  disabled = false,
  loading = false,
  label,
  variant = 'primary',
}: ActionButtonProps) {
  const base =
    'w-full rounded-full px-6 py-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-primary-container text-surface-container-lowest hover:bg-ocre-600'
      : 'border border-outline bg-transparent text-on-surface';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles}`}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2" aria-label="Cargando">
          <span className="loading-mark h-4 w-4" aria-hidden="true">
            <span className="loading-mark-ring" />
          </span>
          <span>Cargando…</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}
