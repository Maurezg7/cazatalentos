type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-tierra-700">
      <span className="inline-flex items-center gap-1 text-2xl" aria-hidden="true">
        <span className="animate-pulse">·</span>
        <span className="animate-pulse [animation-delay:150ms]">·</span>
        <span className="animate-pulse [animation-delay:300ms]">·</span>
      </span>
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
