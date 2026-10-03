import { useCallback, useState } from 'react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import type { Abi, Address, ContractFunctionName } from 'viem';
import { CAZATALENTOS_ABI } from '@cazatalentos/shared';
import { CAZATALENTOS_ADDRESS } from '../contracts';
import { decodeContractError } from './decode-contract-error';
import { log } from './logger';
import { attachTxHash, createRequestId } from './request-id';
import { reportObservability } from './telemetry';
import { useErrorToast } from './toast';

export type TxPhase = 'idle' | 'simulating' | 'awaiting-signature' | 'pending' | 'confirmed' | 'failed';

type WriteName = ContractFunctionName<typeof CAZATALENTOS_ABI, 'nonpayable' | 'payable'>;

type SendArgs = {
  functionName: WriteName;
  args: readonly unknown[];
  value?: bigint;
};

export function useTx() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { showError } = useErrorToast();
  const { writeContractAsync, data: hash, reset: resetWrite } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const [phase, setPhase] = useState<TxPhase>('idle');
  const [requestId, setRequestId] = useState<string | undefined>();
  const [appError, setAppError] = useState<ReturnType<typeof decodeContractError> | undefined>();

  const reset = useCallback(() => {
    resetWrite();
    setPhase('idle');
    setAppError(undefined);
  }, [resetWrite]);

  const send = useCallback(
    async ({ functionName, args, value }: SendArgs) => {
      const id = createRequestId();
      setRequestId(id);
      setAppError(undefined);
      const base = {
        requestId: id,
        chainId,
        account: address,
        functionName,
      };

      try {
        if (!publicClient || !address) {
          throw new Error('wallet not ready');
        }
        setPhase('simulating');
        log.info('tx_simulating', base);
        const simulated = await publicClient.simulateContract({
          address: CAZATALENTOS_ADDRESS,
          abi: CAZATALENTOS_ABI as Abi,
          functionName,
          args: args as never,
          value,
          account: address as Address,
        });
        log.info('tx_awaiting_signature', {
          ...base,
          gas: simulated.request.gas?.toString(),
        });
        setPhase('awaiting-signature');
        const txHash = await writeContractAsync({
          address: CAZATALENTOS_ADDRESS,
          abi: CAZATALENTOS_ABI as Abi,
          functionName,
          args: args as never,
          value,
        });
        attachTxHash(id, txHash);
        log.info('tx_pending', { ...base, txHash });
        setPhase('pending');
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setPhase('confirmed');
        log.info('tx_confirmed', { ...base, txHash });
        return txHash;
      } catch (error: unknown) {
        const mapped = decodeContractError(error, id, { functionName, chainId });
        setAppError(mapped);
        setPhase('failed');
        log.error('tx_failed', mapped.toLog());
        reportObservability(mapped);
        showError(mapped);
        throw mapped;
      }
    },
    [address, chainId, publicClient, showError, writeContractAsync],
  );

  return {
    send,
    phase,
    hash,
    requestId,
    appError,
    reset,
    isPending: phase === 'simulating' || phase === 'awaiting-signature',
    isConfirming: phase === 'pending' || receipt.isLoading,
    isSuccess: phase === 'confirmed' || receipt.isSuccess,
    error: appError,
  };
}
