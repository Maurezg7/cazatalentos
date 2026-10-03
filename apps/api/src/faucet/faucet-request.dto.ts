import { IsString, Matches } from 'class-validator';

export class FaucetRequestDto {
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/)
  address!: string;
}
