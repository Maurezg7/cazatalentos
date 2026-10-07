import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IndexerService } from './indexer.service';

@Controller('indexer')
export class IndexerController {
  constructor(
    @Inject(IndexerService) private readonly indexer: IndexerService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @Get('status')
  status(): Promise<{ lastBlock: string; currentBlock: string; lag: string }> {
    return this.indexer.status();
  }

  @Post('sync')
  sync(@Headers('x-indexer-secret') secret: string | undefined): Promise<{
    lastBlock: string;
    currentBlock: string;
    lag: string;
  }> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      const expected = this.config.get<string>('INDEXER_SECRET');
      if (!expected || secret !== expected) {
        throw new ForbiddenException();
      }
    }
    return this.indexer.syncNow();
  }
}
