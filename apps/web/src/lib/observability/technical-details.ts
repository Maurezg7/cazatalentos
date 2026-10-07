import type { AppError } from '@cazatalentos/shared';
import { txHashFor } from './request-id';

export type TechnicalDetails = {
  code: string;
  layer: string;
  requestId?: string;
  txHash?: string;
  chainId: number;
  appVersion: string;
  timestamp: string;
};

export function technicalDetails(error: AppError, chainId = 10143): TechnicalDetails {
  return {
    code: error.code,
    layer: error.layer,
    requestId: error.requestId,
    txHash: txHashFor(error.requestId),
    chainId,
    appVersion: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
    timestamp: new Date().toISOString(),
  };
}

export function technicalDetailsJson(error: AppError, chainId = 10143): string {
  return JSON.stringify(technicalDetails(error, chainId), null, 2);
}
