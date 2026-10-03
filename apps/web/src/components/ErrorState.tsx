import { ActionButton } from './ActionButton';

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div className="space-y-4 rounded-lg border border-tierra-100 bg-white/70 p-5">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl text-tierra-900">{title}</h2>
        <p className="text-sm text-tierra-700">{message}</p>
      </div>
      {onRetry ? (
        <ActionButton label="Reintentar" onClick={onRetry} variant="secondary" />
      ) : null}
    </div>
  );
}
