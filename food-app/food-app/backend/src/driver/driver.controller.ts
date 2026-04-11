import { Controller, Get, Post, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { DriverService } from './driver.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('available-orders')
  async getAvailableOrders() {
    return this.driverService.getAvailableOrders();
  }

  @Post('orders/:id/accept')
  async acceptOrder(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.driverService.acceptOrder(req.user.id, id);
  }

  @Patch('orders/:id/complete')
  async completeOrder(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.driverService.completeOrder(req.user.id, id);
  }

  @Get('orders/my-orders')
  async getMyOrders(@Request() req: AuthenticatedRequest) {
    return this.driverService.getMyOrders(req.user.id);
  }
}
