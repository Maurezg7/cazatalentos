import { Body, Controller, Inject, Post, ServiceUnavailableException } from '@nestjs/common';
// Value import so emitDecoratorMetadata keeps the body DTO for ValidationPipe.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { FaucetRequestDto } from './faucet-request.dto';
import { FaucetService } from './faucet.service';

@Controller('faucet')
export class FaucetController {
  constructor(@Inject(FaucetService) private readonly faucet: FaucetService) {}

  @Post('request')
  request(@Body() body: FaucetRequestDto): Promise<{ txHash: string; amountWei: string }> {
    if (!this.faucet.enabled()) {
      throw new ServiceUnavailableException('Faucet is disabled');
    }
    return this.faucet.send(body.address);
  }
}
