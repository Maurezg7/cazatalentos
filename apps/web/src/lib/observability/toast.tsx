import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AppError } from '@cazatalentos/shared';
import { technicalDetailsJson } from './technical-details';

type ToastState = {
  error: AppError;
  copied: boolean;
} | null;

type ToastApi = {
  showError: (error: AppError) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const showError = useCallback((error: AppError) => {
    setToast({ error, copied: false });
  }, []);

  const clear = useCallback(() => setToast(null), []);

  const api = useMemo(() => ({ showError, clear }), [showError, clear]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[80] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-[#52491f] bg-[#21281a] p-4 text-[#e3e8d8] shadow-2xl"
        >
          <p className="text-sm font-medium">{toast.error.userMessage}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="flex h-11 items-center rounded bg-primary-container px-3 text-xs font-bold text-on-primary-container"
              onClick={() => {
                void navigator.clipboard.writeText(technicalDetailsJson(toast.error));
                setToast({ error: toast.error, copied: true });
              }}
            >
              {toast.copied ? 'Copiado' : 'Copiar detalles técnicos'}
            </button>
            <button
              type="button"
              className="flex h-11 items-center rounded bg-surface-container-high px-3 text-xs text-on-surface"
              onClick={clear}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useErrorToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) {
    return {
      showError: () => undefined,
      clear: () => undefined,
    };
  }
  return value;
}
