import { IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

const IMAGE = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;
const SIGNATURE = /^0x[a-fA-F0-9]{130}$/;

export class UpdateProfileDto {
  @IsInt()
  @Min(1)
  issuedAt!: number;

  @Matches(SIGNATURE)
  signature!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  @Matches(IMAGE)
  photo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  @Matches(IMAGE)
  cover?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  bioWash?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  bioInk?: string;

  @IsOptional()
  @IsIn(['display', 'serif', 'sans'])
  nameFont?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @Matches(/^[A-Z]{2}$/)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  region?: string;
}
