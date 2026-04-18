import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus } from '@prisma/client';
import { DriverService } from '../driver/driver.service';

@Injectable()
export class SellerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
    @Inject(forwardRef(() => DriverService))
    private readonly driverService: DriverService,
  ) {}

  private async getStoreByOwner(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
    });
    if (!store) {
      throw new NotFoundException('Không tìm thấy cửa hàng của bạn');
    }
    return store;
  }

  // --- Store Management ---

  async getStore(userId: string) {
    return this.getStoreByOwner(userId);
  }

  async updateStore(userId: string, data: any) {
    const store = await this.getStoreByOwner(userId);
    
    if (data.lat !== undefined) data.lat = Number(data.lat);
    if (data.lng !== undefined) data.lng = Number(data.lng);

    return this.prisma.store.update({
      where: { id: store.id },
      data,
    });
  }

  async toggleStore(userId: string) {
    const store = await this.getStoreByOwner(userId);
    return this.prisma.store.update({
      where: { id: store.id },
      data: { isOpen: !store.isOpen },
    });
  }

  // --- Stats ---

  async getStats(userId: string) {
    const store = await this.getStoreByOwner(userId);
    const storeId = store.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, todayOrders, allOrders] = await Promise.all([
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.order.findMany({
        where: { storeId, createdAt: { gte: today } },
        select: { total: true },
      }),
      this.prisma.order.count({ where: { storeId } }),
    ]);

    const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayData = await this.prisma.order.aggregate({
        where: { storeId, createdAt: { gte: d, lt: nextD } },
        _count: { id: true },
        _sum: { total: true },
      });
      chartData.push({
        date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        orders: dayData._count.id,
        revenue: dayData._sum.total || 0,
      });
    }

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { product: { storeId } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await this.prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true },
        });
        return { name: product?.name || '', totalSold: tp._sum.quantity || 0 };
      }),
    );

    return {
      ordersToday: todayOrders.length,
      revenueToday,
      totalProducts,
      averageRating: store.rating || 0,
      totalOrders: allOrders,
      chartData,
      topProducts: topProductDetails,
    };
  }

  async getAdvancedStats(userId: string) {
    const store = await this.getStoreByOwner(userId);
    const storeId = store.id;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Top customers
    const topCustomerGroup = await this.prisma.order.groupBy({
      by: ['userId'],
      where: { storeId },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });

    const topCustomers = await Promise.all(
      topCustomerGroup.map(async (tc) => {
        const user = await this.prisma.user.findUnique({
          where: { id: tc.userId },
          select: { name: true, email: true },
        });
        return {
          name: user?.name,
          email: user?.email,
          totalOrders: tc._count.id,
          totalSpent: tc._sum.total || 0,
        };
      }),
    );

    // 2. Conversion rate (delivered vs total vs cancelled)
    const allStatuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: { storeId },
      _count: { id: true },
    });

    let total = 0;
    let delivered = 0;
    let cancelled = 0;
    allStatuses.forEach((s) => {
      total += s._count.id;
      if (s.status === OrderStatus.DELIVERED) delivered += s._count.id;
      if (s.status === OrderStatus.CANCELLED) cancelled += s._count.id;
    });
    const pending = total - delivered - cancelled;

    const conversionRate = total > 0 ? (delivered / total) * 100 : 0;

    // 3. Comparisons
    const thisWeekOrders = await this.prisma.order.aggregate({
      where: { storeId, createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
      _sum: { total: true },
    });
    const lastWeekOrders = await this.prisma.order.aggregate({
      where: { storeId, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      _count: { id: true },
      _sum: { total: true },
    });

    const thisMonthOrders = await this.prisma.order.aggregate({
      where: { storeId, createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      _sum: { total: true },
    });
    const lastMonthOrders = await this.prisma.order.aggregate({
      where: { storeId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _count: { id: true },
      _sum: { total: true },
    });

    const changeWeekly = {
      orders: lastWeekOrders._count.id > 0 ? ((thisWeekOrders._count.id - lastWeekOrders._count.id) / lastWeekOrders._count.id) * 100 : 0,
      revenue: (lastWeekOrders._sum.total || 0) > 0 ? (((thisWeekOrders._sum.total || 0) - (lastWeekOrders._sum.total || 0)) / (lastWeekOrders._sum.total || 1)) * 100 : 0,
    };

    const changeMonthly = {
      orders: lastMonthOrders._count.id > 0 ? ((thisMonthOrders._count.id - lastMonthOrders._count.id) / lastMonthOrders._count.id) * 100 : 0,
      revenue: (lastMonthOrders._sum.total || 0) > 0 ? (((thisMonthOrders._sum.total || 0) - (lastMonthOrders._sum.total || 0)) / (lastMonthOrders._sum.total || 1)) * 100 : 0,
    };

    // 4. Hourly heatmap
    const recentOrders = await this.prisma.order.findMany({
      where: { storeId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    const heatmapArray = Array(24).fill(0);
    recentOrders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      heatmapArray[hour]++;
    });

    const heatmap = heatmapArray.map((count, hour) => ({ hour, count }));

    return {
      topCustomers,
      conversion: { delivered, cancelled, pending, rate: conversionRate },
      comparison: {
        weekly: {
          thisWeek: { orders: thisWeekOrders._count.id, revenue: thisWeekOrders._sum.total || 0 },
          lastWeek: { orders: lastWeekOrders._count.id, revenue: lastWeekOrders._sum.total || 0 },
          change: changeWeekly,
        },
        monthly: {
          thisMonth: { orders: thisMonthOrders._count.id, revenue: thisMonthOrders._sum.total || 0 },
          lastMonth: { orders: lastMonthOrders._count.id, revenue: lastMonthOrders._sum.total || 0 },
          change: changeMonthly,
        },
      },
      heatmap,
    };
  }

  // --- Products ---

  async getProducts(userId: string) {
    const store = await this.getStoreByOwner(userId);
    return this.prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orderItems: true, reviews: true } } },
    });
  }

  async createProduct(userId: string, data: any) {
    const store = await this.getStoreByOwner(userId);
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        image: data.image || '/images/default.jpg',
        category: data.category,
        isSpicy: data.isSpicy || false,
        isVegetarian: data.isVegetarian || false,
        calories: data.calories ? Number(data.calories) : null,
        tags: data.tags || [],
        saleStartTime: data.saleStartTime || null,
        saleEndTime: data.saleEndTime || null,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : null,
        flashSaleStart: data.flashSaleStart ? new Date(data.flashSaleStart) : null,
        flashSaleEnd: data.flashSaleEnd ? new Date(data.flashSaleEnd) : null,
        options: data.options || null,
        storeId: store.id,
      },
    });
  }

  async updateProduct(userId: string, productId: string, data: any) {
    const store = await this.getStoreByOwner(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không thuộc cửa hàng của bạn');
    }

    if (data.price !== undefined) data.price = Number(data.price);
    if (data.salePrice !== undefined) data.salePrice = data.salePrice ? Number(data.salePrice) : null;
    if (data.flashSaleStart !== undefined) data.flashSaleStart = data.flashSaleStart ? new Date(data.flashSaleStart) : null;
    if (data.flashSaleEnd !== undefined) data.flashSaleEnd = data.flashSaleEnd ? new Date(data.flashSaleEnd) : null;
    if (data.calories !== undefined) data.calories = data.calories ? Number(data.calories) : null;
    if (data.saleStartTime === '') data.saleStartTime = null;
    if (data.saleEndTime === '') data.saleEndTime = null;
    
    return this.prisma.product.update({ where: { id: productId }, data });
  }

  async getFlashSales(userId: string) {
    const store = await this.getStoreByOwner(userId);
    return this.prisma.product.findMany({
      where: { 
        storeId: store.id,
        salePrice: { not: null },
        flashSaleStart: { not: null },
        flashSaleEnd: { not: null }
      },
      orderBy: { flashSaleStart: 'desc' }
    });
  }

  async toggleProduct(userId: string, productId: string) {
    const store = await this.getStoreByOwner(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không thuộc cửa hàng của bạn');
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { isAvailable: !product.isAvailable },
    });
  }

  async deleteProduct(userId: string, productId: string) {
    const store = await this.getStoreByOwner(userId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      include: {
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không thuộc cửa hàng của bạn');
    }

    if (product._count.orderItems > 0) {
      return this.prisma.product.update({
        where: { id: productId },
        data: { isAvailable: false },
      });
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  // --- Orders ---

  async getOrders(userId: string) {
    const store = await this.getStoreByOwner(userId);
    return this.prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
    });
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const flow: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PREPARING,
      OrderStatus.PREPARED,
      OrderStatus.PICKING_UP,
      OrderStatus.DELIVERING,
      OrderStatus.DELIVERED
    ];
    
    const currentIndex = flow.indexOf(currentStatus);
    const newIndex = flow.indexOf(newStatus);
    
    if (newStatus === OrderStatus.CANCELLED && currentStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng khi đang chờ xác nhận');
    }
    
    if (newStatus !== OrderStatus.CANCELLED) {
       if (currentIndex === -1 || newIndex === -1) {
         throw new BadRequestException('Trạng thái không hợp lệ');
       }
       if (newIndex <= currentIndex) {
           throw new BadRequestException('Không thể chuyển về trạng thái trước đó');
       }
       if (newStatus === OrderStatus.PICKING_UP || newStatus === OrderStatus.DELIVERING || newStatus === OrderStatus.DELIVERED) {
         throw new BadRequestException('Chuyển trạng thái giao hàng là quyền của Tài xế');
       }
    }
  }

  async updateOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    const store = await this.getStoreByOwner(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại hoặc không thuộc cửa hàng của bạn');
    }

    this.validateStatusTransition(order.status, status);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        history: {
          create: { status }
        }
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, status);

    if (status === OrderStatus.PREPARED) {
      this.gateway.broadcastToDrivers('order-prepared', {
        orderId: order.id,
        store: { name: store.name, address: store.address },
        total: order.total,
        shippingFee: order.shippingFee,
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => {
        this.driverService.autoAssignDriver(order.id).catch(err =>
          console.error('Auto-assign failed:', err),
        );
      }, 3000);
    }

    return updated;
  }

  async rejectOrder(userId: string, orderId: string, reason: string) {
    const store = await this.getStoreByOwner(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại hoặc không thuộc cửa hàng của bạn');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối đơn hàng đang chờ xác nhận');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.CANCELLED,
        rejectReason: reason,
        history: {
          create: { 
            status: OrderStatus.CANCELLED,
            note: reason
          }
        }
      },
    });

    this.gateway.emitOrderStatusUpdate(order.userId, order.id, OrderStatus.CANCELLED, reason);

    return updated;
  }
}
