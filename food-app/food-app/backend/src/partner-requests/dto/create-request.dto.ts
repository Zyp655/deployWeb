import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { PartnerType } from '@prisma/client';

export class CreatePartnerRequestDto {
  @IsEnum(PartnerType)
  @IsNotEmpty()
  type: PartnerType;

  // Fields for RESTAURANT
  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  storeAddress?: string;

  // Fields for DRIVER
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  idCardNumber?: string;
}
