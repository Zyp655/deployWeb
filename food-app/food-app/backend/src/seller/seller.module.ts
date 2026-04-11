import { Module } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SellerController],
  providers: [PrismaService],
})
export class SellerModule {}
