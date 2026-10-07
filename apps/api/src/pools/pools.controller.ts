import { BadRequestException, Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
// Value imports so emitDecoratorMetadata keeps the DTOs for ValidationPipe.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ListPoolsQuery } from './dto/list-pools.query';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { RegisterPoolDto } from './dto/register-pool.dto';
import { PoolsService } from './pools.service';

/**
 * Testnet hackathon endpoints. They are intentionally unauthenticated:
 * anyone who knows a pool id can store the off-chain milestone description.
 * The contract still checks that only the artist owner can open the pool.
 */
@Controller('pools')
export class PoolsController {
  constructor(@Inject(PoolsService) private readonly pools: PoolsService) {}

  @Post('register')
  register(@Body() body: RegisterPoolDto) {
    return this.pools.registerPool(body);
  }

  @Get(':id')
  getPool(@Param('id', ParseIntPipe) id: number) {
    this.assertId(id);
    return this.pools.getPool(id);
  }

  private assertId(id: number): void {
    if (id < 1) {
      throw new BadRequestException('Pool id must be a positive integer');
    }
  }
}

@Controller('artists')
export class ArtistPoolsController {
  constructor(@Inject(PoolsService) private readonly pools: PoolsService) {}

  @Get(':artistId/pools')
  list(
    @Param('artistId', ParseIntPipe) artistId: number,
    @Query() query: ListPoolsQuery,
  ) {
    if (artistId < 1) {
      throw new BadRequestException('Artist id must be a positive integer');
    }
    return this.pools.getArtistPools(artistId, query.status);
  }
}
