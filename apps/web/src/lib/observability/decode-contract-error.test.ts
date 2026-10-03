import { UserRejectedRequestError } from 'viem';
import { ERROR_CODES, ERROR_DICTIONARY } from '@cazatalentos/shared';
import { decodeContractError } from './decode-contract-error';

describe('ERROR_DICTIONARY completeness', () => {
  it('has an entry for every error code', () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_DICTIONARY[code]).toBeDefined();
      expect(ERROR_DICTIONARY[code].userMessage.length).toBeGreaterThan(0);
      expect(ERROR_DICTIONARY[code].hint.length).toBeGreaterThan(0);
    }
  });
});

function printAcceptance(label: string, error: ReturnType<typeof decodeContractError>): void {
  process.stdout.write(
    `${label} ${JSON.stringify({
      ...error.toLog(),
      cause: error.cause instanceof Error ? error.cause.message : error.cause,
    })}\n`,
  );
}

describe('decodeContractError', () => {
  it('maps user rejection (4001)', () => {
    const mapped = decodeContractError(
      new UserRejectedRequestError(new Error('User rejected the request.')),
      'req-a',
    );
    expect(mapped.code).toBe('TX_USER_REJECTED');
    expect(mapped.layer).toBe('web');
    expect(mapped.requestId).toBe('req-a');
    expect(mapped.hint).toContain('4001');
    printAcceptance('ACCEPT a)', mapped);
  });

  it('maps insufficient funds', () => {
    const mapped = decodeContractError(new Error('insufficient funds for gas'), 'req-b');
    expect(mapped.code).toBe('TX_INSUFFICIENT_FUNDS');
    expect(mapped.userMessage).toContain('MON');
    printAcceptance('ACCEPT b)', mapped);
  });

  it('maps wrong chain', () => {
    const mapped = decodeContractError(new Error('chain mismatch / wrong chain'), 'req-c');
    expect(mapped.code).toBe('WRONG_CHAIN');
    printAcceptance('ACCEPT c)', mapped);
  });

  it('maps AlreadySigned from a walked revert-like object', () => {
    const mapped = decodeContractError(
      { message: 'reverted with the following reason: AlreadySigned' },
      'req-d',
    );
    expect(mapped.code).toBe('CONTRACT_REVERT_AlreadySigned');
    expect(mapped.layer).toBe('contract');
    expect(mapped.requestId).toBe('req-d');
    printAcceptance('ACCEPT d)', mapped);
  });

  it('maps RPC timeout', () => {
    const mapped = decodeContractError(new Error('The request timed out'), 'req-g');
    expect(mapped.code).toBe('RPC_TIMEOUT');
    printAcceptance('ACCEPT g)', mapped);
  });
});
