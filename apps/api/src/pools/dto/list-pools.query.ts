import { IsIn, IsOptional } from 'class-validator';

const POOL_STATUSES = ['Open', 'Claimed', 'Approved', 'Rejected', 'Reclaimed'] as const;

export class ListPoolsQuery {
  @IsOptional()
  @IsIn(POOL_STATUSES)
  status?: (typeof POOL_STATUSES)[number];
}
