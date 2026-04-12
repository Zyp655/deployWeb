import { Module, forwardRef } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { PrismaService } from '../prisma.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [DriverController],
  providers: [DriverService, PrismaService],
  exports: [DriverService],
})
export class DriverModule {}
