import { Module } from '@nestjs/common';
import { ArtistsController, MediaController } from './artists.controller';
import { ArtistsService } from './artists.service';

@Module({
  controllers: [ArtistsController, MediaController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
