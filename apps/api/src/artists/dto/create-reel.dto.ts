import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

const VIDEO = /^data:video\/(?:mp4|webm);base64,[A-Za-z0-9+/=\s]+$/;
const SIGNATURE = /^0x[a-fA-F0-9]{130}$/;

export class CreateReelDto {
  @IsInt()
  @Min(1)
  issuedAt!: number;

  @Matches(SIGNATURE)
  signature!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  caption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  overlayText?: string;

  @IsOptional()
  @IsIn(['none', 'warm', 'cold', 'mono', 'vivid', 'fade'])
  filter?: string;

  @IsOptional()
  @IsIn(['top', 'middle', 'bottom'])
  textPlace?: string;

  @IsString()
  @MaxLength(12_000_000)
  @Matches(VIDEO)
  video!: string;
}
