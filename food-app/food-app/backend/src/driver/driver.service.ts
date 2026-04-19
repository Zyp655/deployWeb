import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus, WalletTransactionType } from '@prisma/client';
import { calculateDistance } from '../utils/geo';

@Injectable()
export class DriverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  private isPeakHour(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 20);
  }

  private calculateDriverFee(shippingFee: number): { baseFee: number; bonus: number } {
    const baseFee = Math.round(shippingFee * 0.8);
    const bonus = this.isPeakHour() ? Math.round(baseFee * 0.2) : 0;
    return { baseFee, bonus };
  }

  async register(userId: string, data: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string }) {
    const existing = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Bạn đã đăng ký tài xế rồi');

    return this.prisma.driverProfile.create({
      data: {
        userId,
        vehicleType: data.vehicleType || 'MOTORBIKE',
        vehiclePlate: data.vehiclePlate,
        idCardNumber: data.idCardNumber,
        isVerified: true,
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
    });
    if (!profile) throw new NotFoundException('Chưa đăng ký tài xế');
    return profile;
  }

  async updateProfile(userId: string, data: { vehicleType?: string; vehiclePlate?: string; idCardNumber?: string }) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Chưa đăng ký tài xế');

    return this.prisma.driverProfile.update({
      where: { userId },
      data: {
        vehicleType: data.vehicleType ?? profile.vehicleType,
        vehiclePlate: data.vehiclePlate ?? profile.vehiclePlate,
        idCardNumber: data.idCardNumber ?? profile.idCardNumber,
      },
    });
  }

  async toggleOnline(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Chưa đăng ký tài xế');
    if (!profile.isVerified) throw new ForbiddenException('Tài khoản chưa được xác minh');

    return this.prisma.driverProfile.update({
      where: { userId },
      data: { isOnline: !profile.isOnline },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    return this.prisma.driverProfile.update({
      where: { userId },
      data: { currentLat: lat, currentLng: lng },
    });
  }

  async getAvailableOrders(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PREPARED,
        driverId: null,
      },
      include: {
        store: { select: { name: true, address: true, phone: true, lat: true, lng: true } },
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'asc' },
    });

    if (profile?.currentLat && profile?.currentLng) {
      const ordersWithDistance = orders.map(order => {
        let distanceToStore = null;
        if (order.store?.lat && order.store?.lng) {
          distanceToStore = calculateDistance(profile.currentLat!, profile.currentLng!, order.store.lat, order.store.lng);
        }
        return { ...order, distanceToStore: distanceToStore ? Math.round(distanceToStore * 10) / 10 : null };
      });
      ordersWithDistance.sort((a, b) => (a.distanceToStore ?? 999) - (b.distanceToStore ?? 999));
      return ordersWithDistance;
    }

    return orders.map(o => ({ ...o, distanceToStore: null }));
  }

  async acceptOrder(driverId: string, orderId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      include: { user: { select: { name: true, phone: true } } },
    });
    if (!profile) throw new NotFoundException('Chưa đăng ký tài xế');
    if (!profile.isOnline) throw new BadRequestException('Bạn cần bật trạng thái Online trước');
    if (!profile.isVerified) throw new ForbiddenException('Tài khoản chưa được xác minh');

    const activeOrder = await this.prisma.order.findFirst({
      where: { driverId, status: { in: [OrderStatus.PICKING_UP, OrderStatus.DELIVERING] } },
    });
    if (activeOrder) throw new BadRequestException('Bạn đang có đơn hàng chưa hoàn thành. Hãy hoàn thành trước khi nhận đơn mới.');

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    if (order.status !== OrderStatus.PREPARED || order.driverId !== null) {
      throw new BadRequestException('Đơn hàng này đã được nhận hoặc không ở trạng thái chờ tài xế');
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId: driverId } });
    const maxDebt = process.env.MAX_DRIVER_DEBT ? parseFloat(process.env.MAX_DRIVER_DEBT) : -200000;
    if (wallet && wallet.balance < maxDebt) {
      throw new BadRequestException('Số dư ví âm quá giới hạn, vui lòng nạp thêm tiền để nhận đơn');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId,
        status: OrderStatus.PICKING_UP,
        history: {
          create: { status: OrderStatus.PICKING_UP, note: 'Tài xế đã nhận đơn và đang đến lấy hàng' },
        },
      },
      include: {
        store: { select: { name: true, address: true, phone: true, lat: true, lng: true } },
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.PICKING_UP, 'Tài xế đang đến lấy hàng');

    this.gateway.emitDriverAssigned(order.userId, order.id, {
      name: profile.user?.name || '',
      phone: profile.user?.phone || '',
      vehiclePlate: profile.vehiclePlate || '',
      vehicleType: profile.vehicleType,
      rating: profile.averageRating,
    });

    this.gateway.broadcastToDrivers('order-taken', { orderId });

    return updated;
  }

  async pickedUp(driverId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId },
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại hoặc không phải đơn của bạn');
    if (order.status !== OrderStatus.PICKING_UP) {
      throw new BadRequestException('Đơn hàng không ở trạng thái đang lấy hàng');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERING,
        history: {
          create: { status: OrderStatus.DELIVERING, note: 'Tài xế đã lấy hàng và đang giao' },
        },
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.DELIVERING, 'Tài xế đang giao hàng');

    return updated;
  }

  async completeOrder(driverId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId },
      include: { store: true },
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại hoặc bạn không phải người nhận đơn này');
    if (order.status !== OrderStatus.DELIVERING) {
      throw new BadRequestException('Chỉ có thể hoàn thành đơn đang giao');
    }

    const sellerRate = process.env.SELLER_RATE ? parseFloat(process.env.SELLER_RATE) : 0.90;
    const driverRate = process.env.DRIVER_RATE ? parseFloat(process.env.DRIVER_RATE) : 0.80;

    const totalFoodAmount = order.total - order.shippingFee;
    const sellerShare = totalFoodAmount * sellerRate;

    const baseFee = order.shippingFee * driverRate;
    const bonus = this.isPeakHour() ? Math.round(baseFee * 0.2) : 0;
    const driverShare = baseFee + bonus;

    let driverAmount = 0;
    let driverTxType: WalletTransactionType | any;
    let driverDesc = '';

    if (order.paymentMethod === 'COD') {
      driverAmount = -(order.total - driverShare);
      driverTxType = 'DEDUCTION';
      driverDesc = `Thu tiền hộ đơn COD #${orderId} (đã trừ phí giao của tài xế)`;
    } else {
      driverAmount = driverShare;
      driverTxType = 'EARNING';
      driverDesc = `Cộng phí giao đơn thẻ #${orderId}`;
    }

    const [updated] = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.DELIVERED,
          history: {
            create: { status: OrderStatus.DELIVERED, note: 'Tài xế đã giao hàng thành công' },
          },
        },
      });

      await tx.driverEarning.create({
        data: {
          driverId,
          orderId,
          baseFee,
          bonus,
          tip: 0,
          totalFee: driverShare,
        },
      });

      await tx.driverProfile.update({
        where: { userId: driverId },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: driverShare },
        },
      });

      // 1. Upsert Driver Wallet
      const driverWallet = await tx.wallet.upsert({
        where: { userId: driverId },
        update: { balance: { increment: driverAmount } },
        create: { userId: driverId, balance: driverAmount },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: driverWallet.id,
          amount: driverAmount,
          type: driverTxType as any,
          referenceId: orderId,
          description: driverDesc,
        },
      });

      // Seller Wallet: chỉ cộng nếu COD (Online đã cộng lúc thanh toán)
      if (order.paymentMethod === 'COD' && order.store?.ownerId) {
         const sellerWallet = await tx.wallet.upsert({
           where: { userId: order.store.ownerId },
           update: { balance: { increment: sellerShare } },
           create: { userId: order.store.ownerId, balance: sellerShare },
         });

         await tx.walletTransaction.create({
           data: {
             walletId: sellerWallet.id,
             amount: sellerShare,
             type: 'EARNING',
             referenceId: orderId,
             description: `Doanh thu đơn COD #${orderId}`,
           },
         });
      }

      return [o];
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.DELIVERED, 'Giao hàng thành công');

    return updated;
  }

  async rejectOrder(driverId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, driverId },
      select: { id: true, status: true },
    });

    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');

    if (order.status === OrderStatus.PICKING_UP) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          driverId: null,
          status: OrderStatus.PREPARED,
          history: {
            create: { status: OrderStatus.PREPARED, note: `Tài xế từ chối: ${reason}` },
          },
        },
      });

      const totalOrders = await this.prisma.order.count({ where: { driverId } });
      const rejectedOrders = totalOrders > 0 ? 1 : 0;
      const rate = totalOrders > 0 ? Math.max(0, ((totalOrders - rejectedOrders) / totalOrders) * 100) : 100;

      await this.prisma.driverProfile.update({
        where: { userId: driverId },
        data: { acceptanceRate: Math.round(rate * 10) / 10 },
      });

      this.gateway.broadcastToDrivers('order-prepared', {
        orderId,
        message: 'Đơn hàng khả dụng trở lại',
      });

      return { message: 'Đã từ chối đơn hàng' };
    }

    throw new BadRequestException('Chỉ có thể từ chối đơn ở trạng thái đang lấy hàng');
  }

  async getActiveDelivery(driverId: string) {
    return this.prisma.order.findFirst({
      where: {
        driverId,
        status: { in: [OrderStatus.PICKING_UP, OrderStatus.DELIVERING] },
      },
      include: {
        store: { select: { name: true, address: true, phone: true, lat: true, lng: true } },
        user: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { name: true, image: true } } } },
      },
    });
  }

  async getMyOrders(driverId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { driverId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          store: { select: { name: true, address: true, phone: true } },
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.order.count({ where: { driverId } }),
    ]);

    const orderIds = orders.map(o => o.id);
    const earnings = await this.prisma.driverEarning.findMany({
      where: { orderId: { in: orderIds }, driverId },
    });
    const earningMap = new Map(earnings.map(e => [e.orderId, e]));

    return {
      orders: orders.map(o => ({
        ...o,
        earning: earningMap.get(o.id) || null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTodayEarnings(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const earnings = await this.prisma.driverEarning.findMany({
      where: { driverId, createdAt: { gte: today } },
    });

    const totalBaseFee = earnings.reduce((sum, e) => sum + e.baseFee, 0);
    const totalTip = earnings.reduce((sum, e) => sum + e.tip, 0);
    const totalBonus = earnings.reduce((sum, e) => sum + e.bonus, 0);
    const total = earnings.reduce((sum, e) => sum + e.totalFee, 0);

    return {
      totalOrders: earnings.length,
      totalBaseFee,
      totalTip,
      totalBonus,
      total,
      avgPerOrder: earnings.length > 0 ? Math.round(total / earnings.length) : 0,
      isPeakHour: this.isPeakHour(),
    };
  }

  async getEarningsSummary(driverId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const earnings = await this.prisma.driverEarning.findMany({
      where: { driverId, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
    });

    const chartData: { date: string; orders: number; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayEarnings = earnings.filter(e => e.createdAt >= d && e.createdAt < nextD);
      chartData.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        orders: dayEarnings.length,
        total: dayEarnings.reduce((sum, e) => sum + e.totalFee, 0),
      });
    }

    const profile = await this.prisma.driverProfile.findUnique({ where: { userId: driverId } });

    return {
      chartData,
      totalEarnings: earnings.reduce((sum, e) => sum + e.totalFee, 0),
      totalOrders: earnings.length,
      averageRating: profile?.averageRating || 5.0,
      totalDeliveries: profile?.totalDeliveries || 0,
      acceptanceRate: profile?.acceptanceRate || 100,
    };
  }

  async autoAssignDriver(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { select: { lat: true, lng: true, name: true, address: true } } },
    });

    if (!order || order.status !== OrderStatus.PREPARED || order.driverId) return null;
    if (!order.store?.lat || !order.store?.lng) return null;

    const onlineDrivers = await this.prisma.driverProfile.findMany({
      where: {
        isOnline: true,
        isVerified: true,
        currentLat: { not: null },
        currentLng: { not: null },
        user: {
          deliveries: {
            none: {
              status: { in: [OrderStatus.PICKING_UP, OrderStatus.DELIVERING] },
            },
          },
        },
      },
      include: { 
        user: { 
          select: { id: true, name: true, phone: true, wallet: true }
        } 
      },
    });

    if (onlineDrivers.length === 0) return null;

    const maxDebt = process.env.MAX_DRIVER_DEBT ? parseFloat(process.env.MAX_DRIVER_DEBT) : -200000;
    
    // Filter drivers that don't have too much debt
    const eligibleDrivers = onlineDrivers.filter(d => {
      if (!d.user.wallet) return true;
      return d.user.wallet.balance >= maxDebt;
    });

    if (eligibleDrivers.length === 0) return null;

    const driversWithDistance = eligibleDrivers
      .map(driver => ({
        ...driver,
        distance: calculateDistance(driver.currentLat!, driver.currentLng!, order.store!.lat!, order.store!.lng!),
      }))
      .filter(d => d.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    if (driversWithDistance.length === 0) return null;

    const nearest = driversWithDistance[0];

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        driverId: nearest.userId,
        status: OrderStatus.PICKING_UP,
        history: {
          create: { status: OrderStatus.PICKING_UP, note: `Hệ thống tự động gán tài xế ${nearest.user.name}` },
        },
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, orderId, OrderStatus.PICKING_UP, 'Tài xế đang đến lấy hàng');

    this.gateway.emitDriverAssigned(order.userId, orderId, {
      name: nearest.user.name,
      phone: nearest.user.phone || '',
      vehiclePlate: nearest.vehiclePlate || '',
      vehicleType: nearest.vehicleType,
      rating: nearest.averageRating,
    });

    this.gateway.server.to(`user_${nearest.userId}`).emit('order-auto-assigned', {
      orderId,
      store: { name: order.store.name, address: order.store.address },
      total: order.total,
      shippingFee: order.shippingFee,
    });

    this.gateway.broadcastToDrivers('order-taken', { orderId });

    return updated;
  }
}
