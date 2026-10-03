import { Module } from '@nestjs/common';
import { IndexerModule } from '../indexer/indexer.module';
import { HealthController } from './health.controller';

@Module({
  imports: [IndexerModule],
  controllers: [HealthController],
})
export class HealthModule {}
