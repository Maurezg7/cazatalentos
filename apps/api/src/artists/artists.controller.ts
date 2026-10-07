import { BadRequestException, Body, Controller, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ArtistsService, type ArtistProfile, type ArtistPostView, type ArtistReelView, type SupporterPage } from './artists.service';
// Value import so emitDecoratorMetadata keeps the query DTO for ValidationPipe.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { ListSupportersQuery } from './list-supporters.query';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { UpdateProfileDto } from './dto/update-profile.dto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreatePostDto } from './dto/create-post.dto';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreateReelDto } from './dto/create-reel.dto';

@Controller('artists')
export class ArtistsController {
  constructor(@Inject(ArtistsService) private readonly artists: ArtistsService) {}

  @Get()
  explore(@Query() query: Record<string, unknown>) {
    return this.artists.listForExplore(query);
  }

  @Get('mine')
  mine(@Query('owner') owner: string): Promise<{ id: number } | null> {
    return this.artists.findOwned(owner ?? '');
  }

  @Get(':id/supporters')
  listSupporters(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListSupportersQuery,
  ): Promise<SupporterPage> {
    this.assertId(id);
    return this.artists.listSupporters(id, query.limit, query.offset);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProfileDto,
  ): Promise<ArtistProfile> {
    this.assertId(id);
    return this.artists.updateProfile(id, body);
  }

  @Get(':id/reels')
  listReels(@Param('id', ParseIntPipe) id: number): Promise<ArtistReelView[]> {
    this.assertId(id);
    return this.artists.listReels(id);
  }

  @Post(':id/reels')
  createReel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateReelDto,
  ): Promise<ArtistReelView> {
    this.assertId(id);
    return this.artists.createReel(id, body);
  }

  @Get(':id/posts')
  listPosts(@Param('id', ParseIntPipe) id: number): Promise<ArtistPostView[]> {
    this.assertId(id);
    return this.artists.listPosts(id);
  }

  @Post(':id/posts')
  createPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreatePostDto,
  ): Promise<ArtistPostView> {
    this.assertId(id);
    return this.artists.createPost(id, body);
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

@Controller('media')
export class MediaController {
  constructor(@Inject(ArtistsService) private readonly artists: ArtistsService) {}

  @Get('reels/:id')
  reel(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Reel id must be a positive integer');
    return this.artists.streamReelFile(id);
  }

  @Get('posts/:id')
  post(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Post id must be a positive integer');
    return this.artists.streamPostFile(id);
  }

  @Get('artists/:id/photo')
  photo(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Artist id must be a positive integer');
    return this.artists.streamArtistImage(id, 'photo');
  }

  @Get('artists/:id/cover')
  cover(@Param('id', ParseIntPipe) id: number) {
    if (id < 1) throw new BadRequestException('Artist id must be a positive integer');
    return this.artists.streamArtistImage(id, 'cover');
  }
}
