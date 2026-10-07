import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterPoolDto {
  @IsInt()
  @Min(1)
  poolId!: number;

  @IsInt()
  @Min(1)
  artistId!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description!: string;
}
