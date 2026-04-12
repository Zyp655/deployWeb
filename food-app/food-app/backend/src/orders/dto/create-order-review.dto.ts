import { IsInt, IsOptional, IsString, IsNumber, Max, Min } from 'class-validator';

export class CreateOrderReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  storeRating?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  driverRating?: number;

  @IsString()
  @IsOptional()
  reviewComment?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  driverTip?: number;
}
