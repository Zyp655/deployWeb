import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });
    }

    return this.mapWalletResponse(wallet);
  }

  async updateBankAccount(userId: string, data: { bankName: string; bankAccount: string; bankAccountName: string }) {
    const wallet = await this.ensureWallet(userId);

    const updated = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        bankName: data.bankName,
        accountNumber: data.bankAccount,
        accountHostName: data.bankAccountName,
      },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    return this.mapWalletResponse(updated);
  }

  async requestWithdrawal(userId: string, amount: number) {
    const wallet = await this.ensureWallet(userId);

    if (amount <= 0) {
      throw new BadRequestException('Số tiền rút phải lớn hơn 0');
    }

    if (amount > wallet.balance) {
      throw new BadRequestException('Số dư không đủ để rút');
    }

    if (!wallet.bankName || !wallet.accountNumber || !wallet.accountHostName) {
      throw new BadRequestException('Vui lòng thiết lập thông tin ngân hàng trước khi rút tiền');
    }

    const [withdrawal] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount,
        },
        include: {
          wallet: {
            select: {
              bankName: true,
              accountNumber: true,
              accountHostName: true,
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          frozenBalance: { increment: amount },
        },
      }),
    ]);

    return this.mapWithdrawalResponse(withdrawal);
  }

  async getAllWithdrawals() {
    const requests = await this.prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          select: {
            bankName: true,
            accountNumber: true,
            accountHostName: true,
            user: { select: { id: true, name: true, email: true, phone: true, role: true } },
          },
        },
      },
    });

    return requests.map(r => this.mapWithdrawalResponse(r));
  }

  async approveWithdrawal(id: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    if (request.status !== 'PENDING') throw new BadRequestException('Yêu cầu này đã được xử lý');

    const [updated] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          wallet: {
            select: {
              bankName: true,
              accountNumber: true,
              accountHostName: true,
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: request.walletId },
        data: {
          frozenBalance: { decrement: request.amount },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: request.walletId,
          amount: request.amount,
          type: 'WITHDRAWAL',
          referenceId: id,
          description: `Rút tiền #${id.slice(0, 8)} - Đã duyệt`,
        },
      }),
    ]);

    return this.mapWithdrawalResponse(updated);
  }

  async rejectWithdrawal(id: string, adminNote?: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { wallet: true },
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    if (request.status !== 'PENDING') throw new BadRequestException('Yêu cầu này đã được xử lý');

    const [updated] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED', adminNote: adminNote || null },
        include: {
          wallet: {
            select: {
              bankName: true,
              accountNumber: true,
              accountHostName: true,
              user: { select: { id: true, name: true, email: true, phone: true, role: true } },
            },
          },
        },
      }),
      this.prisma.wallet.update({
        where: { id: request.walletId },
        data: {
          balance: { increment: request.amount },
          frozenBalance: { decrement: request.amount },
        },
      }),
    ]);

    return this.mapWithdrawalResponse(updated);
  }

  private async ensureWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId } });
    }
    return wallet;
  }

  private mapWalletResponse(wallet: any) {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      frozenBalance: wallet.frozenBalance,
      bankName: wallet.bankName || null,
      bankAccount: wallet.accountNumber || null,
      bankAccountName: wallet.accountHostName || null,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      transactions: (wallet.transactions || []).map((tx: any) => ({
        id: tx.id,
        walletId: tx.walletId,
        amount: tx.amount,
        type: tx.type === 'EARNING' || tx.type === 'DEPOSIT' ? 'CREDIT' : 'DEBIT',
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    };
  }

  private mapWithdrawalResponse(r: any) {
    return {
      id: r.id,
      walletId: r.walletId,
      amount: r.amount,
      status: r.status === 'COMPLETED' ? 'APPROVED' : r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      wallet: r.wallet ? {
        bankName: r.wallet.bankName,
        bankAccount: r.wallet.accountNumber,
        bankAccountName: r.wallet.accountHostName,
        user: r.wallet.user,
      } : undefined,
    };
  }
}
