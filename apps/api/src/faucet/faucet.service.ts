import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';

type ClaimWindow = {
  count: number;
  resetAt: Date;
};

@Injectable()
export class FaucetService {
  private readonly logger = new Logger(FaucetService.name);
  /**
   * Daily claim counter kept in process memory.
   * Fine for the hackathon; a production faucet should use Redis so the limit
   * survives restarts and multiple instances.
   */
  private readonly claims = new Map<string, ClaimWindow>();
  private readonly privateKey: Hex | undefined;
  private readonly amountWei: bigint;
  private readonly dailyLimit: number;
  private readonly rpcUrl: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const rawKey = config.get<string>('FAUCET_PRIVATE_KEY');
    this.privateKey = rawKey ? (`0x${rawKey}` as Hex) : undefined;
    this.amountWei = BigInt(config.get<string>('FAUCET_AMOUNT_WEI') ?? '100000000000000000');
    this.dailyLimit = config.get<number>('FAUCET_DAILY_LIMIT_PER_ADDRESS') ?? 3;
    this.rpcUrl = config.getOrThrow<string>('MONAD_RPC_URL');
  }

  enabled(): boolean {
    return this.privateKey !== undefined;
  }

  async send(address: string): Promise<{ txHash: string; amountWei: string }> {
    if (!this.privateKey) {
      throw new ServiceUnavailableException('Faucet is disabled');
    }
    if (!isAddress(address)) {
      throw new BadRequestException('Invalid address');
    }

    const key = address.toLowerCase();
    this.assertWithinDailyLimit(key);

    const account = privateKeyToAccount(this.privateKey);
    const transport = http(this.rpcUrl);
    const publicClient = createPublicClient({ chain: monadTestnet, transport });
    const wallet = createWalletClient({ account, chain: monadTestnet, transport });

    const balance = await publicClient.getBalance({ address: account.address });
    if (balance < this.amountWei * 10n) {
      throw new ServiceUnavailableException('Faucet exhausted');
    }

    try {
      const txHash = await wallet.sendTransaction({
        to: address as Address,
        value: this.amountWei,
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 30_000,
      });
      if (receipt.status !== 'success') {
        throw new ServiceUnavailableException('Faucet transfer failed');
      }
      this.recordClaim(key);
      return { txHash, amountWei: this.amountWei.toString() };
    } catch (error: unknown) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error('Faucet send failed');
      throw new ServiceUnavailableException('Faucet transfer failed');
    }
  }

  private assertWithinDailyLimit(address: string): void {
    const now = new Date();
    const window = this.claims.get(address);
    if (!window || window.resetAt <= now) return;
    if (window.count >= this.dailyLimit) {
      throw new HttpException('Daily faucet limit reached', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordClaim(address: string): void {
    const now = new Date();
    const window = this.claims.get(address);
    if (!window || window.resetAt <= now) {
      this.claims.set(address, {
        count: 1,
        resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      });
      return;
    }
    window.count += 1;
  }
}
