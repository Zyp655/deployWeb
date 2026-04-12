import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { PartnerRequestsService } from './partner-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePartnerRequestDto } from './dto/create-request.dto';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('partner-requests')
@UseGuards(JwtAuthGuard)
export class PartnerRequestsController {
  constructor(private readonly partnerRequestsService: PartnerRequestsService) {}

  @Post()
  async createRequest(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePartnerRequestDto,
  ) {
    return this.partnerRequestsService.createRequest(req.user.id, dto);
  }

  @Get('my-requests')
  async getMyRequests(@Request() req: AuthenticatedRequest) {
    return this.partnerRequestsService.getMyRequests(req.user.id);
  }
}
