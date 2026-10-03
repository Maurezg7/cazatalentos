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
    'w-full rounded-lg px-6 py-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-50';
  const styles =
    variant === 'primary'
      ? 'bg-ocre-500 text-white hover:bg-ocre-600'
      : 'border border-tierra-700 bg-transparent text-tierra-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles}`}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-1" aria-label="Cargando">
          <span className="animate-pulse">.</span>
          <span className="animate-pulse [animation-delay:150ms]">.</span>
          <span className="animate-pulse [animation-delay:300ms]">.</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}
