import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma.service';
import { UsersModule } from '../users/users.module';
import { PartnerRequestsModule } from '../partner-requests/partner-requests.module';

@Module({
  imports: [UsersModule, PartnerRequestsModule],
  controllers: [AdminController],
  providers: [PrismaService],
})
export class AdminModule {}
