import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppError } from '@cazatalentos/shared';
import { decodeContractError } from './decode-contract-error';
import { log } from './logger';
import { getRequestId } from './request-id';
import { reportObservability } from './telemetry';

type Props = { children: ReactNode };
type State = { error: AppError | null };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: decodeContractError(error, getRequestId()) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const mapped = decodeContractError(error, getRequestId(), { componentStack: info.componentStack });
    log.error('react_error_boundary', mapped.toLog());
    reportObservability(mapped);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-on-surface">
          <h1 className="font-serif text-2xl italic">Algo se rompió en la pantalla</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{this.state.error.userMessage}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const mapped = decodeContractError(event.reason, getRequestId());
    log.error('unhandledrejection', mapped.toLog());
    reportObservability(mapped);
  });
  window.addEventListener('error', (event) => {
    const mapped = decodeContractError(event.error ?? event.message, getRequestId());
    log.error('window_error', mapped.toLog());
    reportObservability(mapped);
  });
}
