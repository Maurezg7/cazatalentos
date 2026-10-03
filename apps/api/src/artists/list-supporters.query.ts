import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ListSupportersQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
