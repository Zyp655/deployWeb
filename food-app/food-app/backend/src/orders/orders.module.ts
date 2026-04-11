import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [OrdersController],
  providers: [PrismaService, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
