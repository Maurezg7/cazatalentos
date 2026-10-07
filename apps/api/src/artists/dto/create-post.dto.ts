import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

const IMAGE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;
const SIGNATURE = /^0x[a-fA-F0-9]{130}$/;

export class CreatePostDto {
  @IsInt()
  @Min(1)
  issuedAt!: number;

  @Matches(SIGNATURE)
  signature!: string;

  @IsString()
  @MaxLength(280)
  body!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2_000_000)
  @Matches(IMAGE)
  media?: string;
}
