import { Module, forwardRef } from '@nestjs/common';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { PrismaService } from '../prisma.service';
import { GatewayModule } from '../gateway/gateway.module';
import { DriverModule } from '../driver/driver.module';

@Module({
  imports: [GatewayModule, forwardRef(() => DriverModule)],
  controllers: [SellerController],
  providers: [SellerService, PrismaService],
})
export class SellerModule {}
