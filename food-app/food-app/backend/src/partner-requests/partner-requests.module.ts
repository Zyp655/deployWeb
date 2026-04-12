import { Module } from '@nestjs/common';
import { PartnerRequestsService } from './partner-requests.service';
import { PartnerRequestsController } from './partner-requests.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PartnerRequestsController],
  providers: [PartnerRequestsService, PrismaService],
  exports: [PartnerRequestsService],
})
export class PartnerRequestsModule {}
