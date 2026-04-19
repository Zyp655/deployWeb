import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WalletService } from './wallet.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet/me')
  async getMyWallet(@Request() req: any) {
    return this.walletService.getOrCreateWallet(req.user.id);
  }

  @Patch('wallet/me/bank')
  async updateBank(@Request() req: any, @Body() body: { bankName: string; bankAccount: string; bankAccountName: string }) {
    return this.walletService.updateBankAccount(req.user.id, body);
  }

  @Post('withdrawals')
  async requestWithdrawal(@Request() req: any, @Body() body: { amount: number }) {
    return this.walletService.requestWithdrawal(req.user.id, body.amount);
  }

  @Get('admin/withdrawals')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAll() {
    return this.walletService.getAllWithdrawals();
  }

  @Patch('admin/withdrawals/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async approve(@Param('id') id: string) {
    return this.walletService.approveWithdrawal(id);
  }

  @Patch('admin/withdrawals/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async reject(@Param('id') id: string, @Body() body: { adminNote?: string }) {
    return this.walletService.rejectWithdrawal(id, body.adminNote);
  }
}
