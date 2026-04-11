import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { OrdersGateway } from './orders.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [JwtModule, ConfigModule],
  providers: [OrdersGateway, PrismaService],
  exports: [OrdersGateway],
})
export class GatewayModule {}
