import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderReviewDto } from './dto/create-order-review.dto';
import { v4 as uuidv4 } from 'uuid';
import { OrdersGateway } from '../gateway/orders.gateway';
import { OrderStatus } from '@prisma/client';
import { isProductTimeValid } from '../utils/time-utils';
import { calculateDistance } from '../utils/geo';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại hoặc đã ngừng bán');
    }

    // Time-bound validation
    const expiredProducts = products.filter(p => !isProductTimeValid(p.saleStartTime, p.saleEndTime));
    if (expiredProducts.length > 0) {
      const names = expiredProducts.map(p => p.name).join(', ');
      throw new BadRequestException(`Sản phẩm [${names}] hiện đã quá giờ bán. Khách hàng vui lòng loại khỏi giỏ hàng.`);
    }

    const priceMap = new Map(products.map((p) => [p.id, p.price]));

    // ShopeeFood Logic: All items in an order must belong to the same store
    const storeIds = [...new Set(products.map(p => p.storeId))];
    if (storeIds.length > 1) {
      throw new BadRequestException('Các sản phẩm trong đơn hàng phải thuộc cùng một cửa hàng');
    }
    const storeId = storeIds[0] || null;

    const now = new Date();
    let total = dto.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      let basePrice = priceMap.get(item.productId) || 0;
      
      // Flash sale check
      if (product && product.salePrice != null && product.flashSaleStart && product.flashSaleEnd) {
         if (now >= product.flashSaleStart && now <= product.flashSaleEnd) {
            basePrice = product.salePrice;
         }
      }

      let optionsPrice = 0;
      if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
        optionsPrice = item.selectedOptions.reduce((optSum, opt) => optSum + (Number(opt.price) || 0), 0);
      }
      return sum + (basePrice + optionsPrice) * item.quantity;
    }, 0);

    let discount = 0;
    let couponCode: string | null = null;
    let shippingFee = 15000; // Base valid fee

    // Logic: Tính phí ship dựa theo khoảng cách thực tế
    const storeObj = storeId ? await this.prisma.store.findUnique({ where: { id: storeId }}) : null;
    if (dto.userLat && dto.userLng && storeObj?.lat && storeObj?.lng) {
      const distance = calculateDistance(dto.userLat, dto.userLng, storeObj.lat, storeObj.lng);
      // Giả sử 5000đ/1km, tối thiểu 15k
      shippingFee = Math.max(15000, Math.round(distance * 5000));
    } else {
      // Fallback nếu không có tọa độ
      if (total < 100000) {
        shippingFee = 15000;
      } else if (total < 300000) {
        shippingFee = 25000;
      } else {
        shippingFee = 35000;
      }
    }

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });

      if (coupon && coupon.isActive && coupon.usedCount < coupon.usageLimit &&
          (!coupon.expiresAt || coupon.expiresAt >= new Date()) &&
          (!coupon.storeId || coupon.storeId === storeId) &&
          total >= coupon.minOrderValue) {
        if (coupon.discountType === 'PERCENT') {
          discount = (total * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
          }
        } else {
          discount = coupon.discountValue;
        }
        discount = Math.round(discount);
        couponCode = coupon.code;

        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const finalTotal = total + shippingFee - discount;

    const itemNotes = dto.items
      .filter((item) => item.note)
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return `${product?.name}: ${item.note}`;
      });

    const combinedNote = [dto.note, ...itemNotes].filter(Boolean).join(' | ');

    const idempotencyKey = uuidv4();

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Validate scheduledAt
    let parsedScheduledAt: Date | null = null;
    let isScheduled = false;
    if (dto.scheduledAt) {
      const scheduledDate = new Date(dto.scheduledAt);
      if (scheduledDate.getTime() < Date.now() + 30 * 60000) {
        throw new BadRequestException('Thời gian giao hàng hẹn trước phải cách hiện tại ít nhất 30 phút');
      }
      // Khung giờ mở cửa validation
      if (storeObj?.openTime && storeObj?.closeTime) {
         const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
         const scheduledTimeStr = formatter.format(scheduledDate);
         
         if (storeObj.openTime <= storeObj.closeTime) {
            if (scheduledTimeStr < storeObj.openTime || scheduledTimeStr > storeObj.closeTime) {
               throw new BadRequestException(`Cửa hàng chỉ mở cửa từ ${storeObj.openTime} đến ${storeObj.closeTime}`);
            }
         } else {
            if (scheduledTimeStr < storeObj.openTime && scheduledTimeStr > storeObj.closeTime) {
               throw new BadRequestException(`Cửa hàng chỉ mở cửa từ ${storeObj.openTime} đến ${storeObj.closeTime}`);
            }
         }
      }
      parsedScheduledAt = scheduledDate;
      isScheduled = true;
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        storeId,
        total: finalTotal,
        shippingFee,
        discount,
        couponCode,
        note: combinedNote || null,
        deliveryAddress: dto.address,
        deliveryPhone: user?.phone || null,
        deliveryLat: dto.userLat || null,
        deliveryLng: dto.userLng || null,
        paymentMethod: dto.paymentMethod,
        scheduledAt: parsedScheduledAt,
        isScheduled,
        items: {
          create: dto.items.map((item) => {
            const product = products.find(p => p.id === item.productId);
            let basePrice = priceMap.get(item.productId) || 0;
            if (product && product.salePrice != null && product.flashSaleStart && product.flashSaleEnd) {
               if (now >= product.flashSaleStart && now <= product.flashSaleEnd) {
                  basePrice = product.salePrice;
               }
            }
            let optionsPrice = 0;
            if (item.selectedOptions && Array.isArray(item.selectedOptions)) {
              optionsPrice = item.selectedOptions.reduce((optSum, opt) => optSum + (Number(opt.price) || 0), 0);
            }
            return {
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              price: basePrice + optionsPrice,
              selectedOptions: item.selectedOptions ? (item.selectedOptions as any) : undefined,
            };
          }),
        },
        transactions: {
          create: {
            userId,
            amount: finalTotal,
            method: dto.paymentMethod,
            idempotencyKey,
          },
        },
        history: {
          create: {
            status: 'PENDING',
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (storeObj) {
      this.gateway.emitOrderStatusUpdate(storeObj.ownerId, order.id, 'PENDING', 'Có đơn hàng mới!');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      shippingFee: order.shippingFee,
      discount: order.discount,
      couponCode: order.couponCode,
      note: order.note,
      deliveryAddress: order.deliveryAddress,
      deliveryPhone: order.deliveryPhone,
      paymentMethod: dto.paymentMethod,
      scheduledAt: order.scheduledAt,
      isScheduled: order.isScheduled,
      items: (order as any).items.map((item: any) => ({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        selectedOptions: item.selectedOptions,
      })),
      createdAt: order.createdAt,
    };
  }

  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.total,
      shippingFee: order.shippingFee,
      note: order.note,
      paymentMethod: order.paymentMethod,
      scheduledAt: order.scheduledAt,
      isScheduled: order.isScheduled,
      refundStatus: order.refundStatus,
      refundedAt: order.refundedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        productCategory: item.product.category,
        quantity: item.quantity,
        price: item.price,
        selectedOptions: item.selectedOptions,
        product: item.product,
      })),
      createdAt: order.createdAt,
}));
  }

  async findById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        store: { select: { name: true, address: true, phone: true, lat: true, lng: true } },
        driver: { select: { id: true, name: true, phone: true } },
        items: {
          include: { product: true },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      shippingFee: order.shippingFee,
      deliveryAddress: order.deliveryAddress,
      deliveryPhone: order.deliveryPhone,
      deliveryLat: order.deliveryLat,
      deliveryLng: order.deliveryLng,
      note: order.note,
      paymentMethod: order.paymentMethod,
      scheduledAt: order.scheduledAt,
      isScheduled: order.isScheduled,
      refundStatus: order.refundStatus,
      refundedAt: order.refundedAt,
      store: order.store,
      driver: order.driver,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.image,
        productCategory: item.product.category,
        quantity: item.quantity,
        price: item.price,
        selectedOptions: item.selectedOptions,
        product: item.product,
      })),
      history: order.history.map((h) => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt,
      })),
      createdAt: order.createdAt,
    };
  }

  async updateStatus(orderId: string, status: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, rejectReason: note },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        store: { select: { name: true, address: true, phone: true } },
        items: true,
      },
    });

    this.gateway.emitOrderStatusUpdate(updatedOrder.userId, orderId, status, note);
    return updatedOrder;
  }

  async reviewOrder(orderId: string, userId: string, dto: CreateOrderReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Chỉ có thể đánh giá đơn hàng đã giao thành công');
    }

    if (order.storeRating !== null || order.driverRating !== null) {
      throw new BadRequestException('Đơn hàng này đã được đánh giá');
    }

    const tipAmount = dto.driverTip ? Math.round(dto.driverTip) : 0;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        storeRating: dto.storeRating,
        driverRating: dto.driverRating,
        driverTip: tipAmount,
        reviewComment: dto.reviewComment,
      },
    });

    if (dto.storeRating && order.storeId) {
      const storeOrders = await this.prisma.order.findMany({
        where: { storeId: order.storeId, storeRating: { not: null } },
        select: { storeRating: true },
      });
      const totalRatings = storeOrders.reduce((acc, curr) => acc + (curr.storeRating || 0), 0);
      const averageRating = storeOrders.length > 0 ? totalRatings / storeOrders.length : 0;

      await this.prisma.store.update({
        where: { id: order.storeId },
        data: { rating: parseFloat(averageRating.toFixed(1)) },
      });
    }

    if (order.driverId) {
      if (dto.driverRating) {
        const driverOrders = await this.prisma.order.findMany({
          where: { driverId: order.driverId, driverRating: { not: null } },
          select: { driverRating: true },
        });
        const totalRatings = driverOrders.reduce((acc, curr) => acc + (curr.driverRating || 0), 0);
        const avgRating = driverOrders.length > 0 ? totalRatings / driverOrders.length : 5.0;

        await this.prisma.driverProfile.updateMany({
          where: { userId: order.driverId },
          data: { averageRating: parseFloat(avgRating.toFixed(1)) },
        });
      }

      if (tipAmount > 0) {
        await this.prisma.driverEarning.updateMany({
          where: { orderId, driverId: order.driverId },
          data: {
            tip: tipAmount,
            totalFee: { increment: tipAmount },
          },
        });

        await this.prisma.driverProfile.updateMany({
          where: { userId: order.driverId },
          data: { totalEarnings: { increment: tipAmount } },
        });
      }
    }
    
    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { store: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const cancellableStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'PREPARED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Không thể huỷ đơn hàng đang trong quá trình giao hàng',
      );
    }

    const isOnlinePaid = order.paymentMethod !== 'COD';
    const needsRefund = isOnlinePaid && order.status !== 'PENDING';

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        rejectReason: reason || 'Khách hàng huỷ đơn',
        refundStatus: needsRefund ? 'PENDING' : 'NONE',
      },
    });

    await this.prisma.orderHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        note: reason || 'Khách hàng huỷ đơn',
      },
    });

    if (order.couponCode) {
      await this.prisma.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    if (needsRefund) {
      await this.prisma.transaction.updateMany({
        where: { orderId, status: 'SUCCESS' },
        data: { status: 'REFUNDED' },
      });
    }

    if (isOnlinePaid && order.status !== 'PENDING' && order.store?.ownerId) {
      const sellerRate = process.env.SELLER_RATE ? parseFloat(process.env.SELLER_RATE) : 0.90;
      const totalFoodAmount = order.total - order.shippingFee + order.discount;
      const sellerShare = Math.round(totalFoodAmount * sellerRate);

      const sellerWallet = await this.prisma.wallet.findUnique({
        where: { userId: order.store.ownerId },
      });

      if (sellerWallet) {
        await this.prisma.wallet.update({
          where: { id: sellerWallet.id },
          data: { balance: { decrement: sellerShare } },
        });

        await this.prisma.walletTransaction.create({
          data: {
            walletId: sellerWallet.id,
            amount: -sellerShare,
            type: 'DEDUCTION',
            referenceId: orderId,
            description: `Hoàn trừ đơn huỷ #${orderId.substring(orderId.length - 8).toUpperCase()}`,
          },
        });
      }
    }

    this.gateway.emitOrderStatusUpdate(userId, orderId, 'CANCELLED', reason || 'Khách hàng huỷ đơn');

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      message: needsRefund
        ? 'Đã huỷ đơn hàng. Admin sẽ hoàn tiền trong 1-3 ngày làm việc.'
        : 'Đã huỷ đơn hàng thành công',
      refunded: needsRefund,
    };
  }
}
