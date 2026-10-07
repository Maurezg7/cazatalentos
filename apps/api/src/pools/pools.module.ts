import { Module } from '@nestjs/common';
import { ArtistPoolsController, PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';

@Module({
  controllers: [PoolsController, ArtistPoolsController],
  providers: [PoolsService],
})
export class PoolsModule {}
