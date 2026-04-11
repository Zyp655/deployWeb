import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController],
  providers: [PrismaService, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
