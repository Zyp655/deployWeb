import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
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

  @Post('register')
  async register(
    @Request() req: AuthenticatedRequest,
    @Body() body: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string },
  ) {
    return this.driverService.register(req.user.id, body);
  }

  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.driverService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() body: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string },
  ) {
    return this.driverService.updateProfile(req.user.id, body);
  }

  @Post('toggle-online')
  async toggleOnline(@Request() req: AuthenticatedRequest) {
    return this.driverService.toggleOnline(req.user.id);
  }

  @Post('update-location')
  async updateLocation(
    @Request() req: AuthenticatedRequest,
    @Body() body: { lat: number; lng: number },
  ) {
    return this.driverService.updateLocation(req.user.id, body.lat, body.lng);
  }

  @Get('available-orders')
  async getAvailableOrders(@Request() req: AuthenticatedRequest) {
    return this.driverService.getAvailableOrders(req.user.id);
  }

  @Post('orders/:id/accept')
  async acceptOrder(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.driverService.acceptOrder(req.user.id, id);
  }

  @Post('orders/:id/picked')
  async pickedUp(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.driverService.pickedUp(req.user.id, id);
  }

  @Patch('orders/:id/complete')
  async completeOrder(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.driverService.completeOrder(req.user.id, id);
  }

  @Post('orders/:id/reject')
  async rejectOrder(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.driverService.rejectOrder(req.user.id, id, body.reason);
  }

  @Get('orders/active')
  async getActiveDelivery(@Request() req: AuthenticatedRequest) {
    return this.driverService.getActiveDelivery(req.user.id);
  }

  @Get('orders/my-orders')
  async getMyOrders(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.driverService.getMyOrders(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('earnings/today')
  async getTodayEarnings(@Request() req: AuthenticatedRequest) {
    return this.driverService.getTodayEarnings(req.user.id);
  }

  @Get('earnings/summary')
  async getEarningsSummary(
    @Request() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    return this.driverService.getEarningsSummary(req.user.id, days ? parseInt(days) : 7);
  }
}
