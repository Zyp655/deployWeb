import { Controller, Post, Body, Get, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('momo/create')
  @UseGuards(JwtAuthGuard)
  async createMoMoPayment(
    @Body() body: { orderId: string; amount: number; orderInfo: string },
  ) {
    return this.paymentsService.createMoMoPayment(
      body.orderId,
      body.amount,
      body.orderInfo,
    );
  }

  @Post('vnpay/create')
  @UseGuards(JwtAuthGuard)
  async createVNPayPayment(
    @Body() body: { orderId: string; amount: number; orderInfo: string },
    @Req() req: Request,
  ) {
    const ipAddr = req.ip || req.socket.remoteAddress || '127.0.0.1';
    return this.paymentsService.createVNPayPayment(
      body.orderId,
      body.amount,
      body.orderInfo,
      ipAddr,
    );
  }

  @Post('momo/callback')
  async momoCallback(@Body() body: any) {
    return this.paymentsService.handleMoMoCallback(body);
  }

  @Get('vnpay/callback')
  async vnpayCallback(@Query() query: any) {
    return this.paymentsService.verifyVNPayCallback(query);
  }
}
