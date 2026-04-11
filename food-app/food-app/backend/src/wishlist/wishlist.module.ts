import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [WishlistController],
  providers: [PrismaService],
})
export class WishlistModule {}
