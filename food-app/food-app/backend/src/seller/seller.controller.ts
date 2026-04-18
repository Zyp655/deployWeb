import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTAURANT)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('store')
  async getStore(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getStore(req.user.id);
  }

  @Patch('store')
  async updateStore(@Request() req: AuthenticatedRequest, @Body() data: any) {
    return this.sellerService.updateStore(req.user.id, data);
  }

  @Patch('store/toggle')
  async toggleStore(@Request() req: AuthenticatedRequest) {
    return this.sellerService.toggleStore(req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getStats(req.user.id);
  }

  @Get('stats/advanced')
  async getAdvancedStats(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getAdvancedStats(req.user.id);
  }

  @Get('products')
  async getProducts(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getProducts(req.user.id);
  }

  @Get('flash-sales')
  async getFlashSales(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getFlashSales(req.user.id);
  }

  @Post('products')
  async createProduct(@Request() req: AuthenticatedRequest, @Body() data: any) {
    return this.sellerService.createProduct(req.user.id, data);
  }

  @Patch('products/:id')
  async updateProduct(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() data: any) {
    return this.sellerService.updateProduct(req.user.id, id, data);
  }

  @Patch('products/:id/toggle')
  async toggleProduct(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.sellerService.toggleProduct(req.user.id, id);
  }

  @Delete('products/:id')
  async deleteProduct(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.sellerService.deleteProduct(req.user.id, id);
  }

  @Get('orders')
  async getOrders(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getOrders(req.user.id);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Request() req: AuthenticatedRequest, 
    @Param('id') id: string, 
    @Body() body: { status: OrderStatus }
  ) {
    return this.sellerService.updateOrderStatus(req.user.id, id, body.status);
  }

  @Patch('orders/:id/reject')
  async rejectOrder(
    @Request() req: AuthenticatedRequest, 
    @Param('id') id: string, 
    @Body() body: { reason: string }
  ) {
    return this.sellerService.rejectOrder(req.user.id, id, body.reason);
  }

  @Patch('orders/:id/refund')
  async confirmRefund(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.sellerService.confirmRefund(req.user.id, id);
  }
}
