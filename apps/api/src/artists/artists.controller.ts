import { BadRequestException, Controller, Get, Inject, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ArtistsService, type ArtistProfile, type SupporterPage } from './artists.service';
// Value import so emitDecoratorMetadata keeps the query DTO for ValidationPipe.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ListSupportersQuery } from './list-supporters.query';

@Controller('artists')
export class ArtistsController {
  constructor(@Inject(ArtistsService) private readonly artists: ArtistsService) {}

  @Get(':id/supporters')
  listSupporters(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListSupportersQuery,
  ): Promise<SupporterPage> {
    this.assertId(id);
    return this.artists.listSupporters(id, query.limit, query.offset);
  }

  @Get(':id')
  getArtist(@Param('id', ParseIntPipe) id: number): Promise<ArtistProfile> {
    this.assertId(id);
    return this.artists.getArtist(id);
  }

  private assertId(id: number): void {
    if (id < 1) {
      throw new BadRequestException('Artist id must be a positive integer');
    }
  }
}
