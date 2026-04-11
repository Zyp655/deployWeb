import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    // 1. Check product exists
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // 2. Check user has ordered this product (at least one DELIVERED order)
    const hasOrdered = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          userId,
          status: { in: ['DELIVERED', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'PENDING'] },
        },
      },
    });
    if (!hasOrdered) {
      throw new ForbiddenException('Bạn chỉ có thể đánh giá sau khi đã đặt món này');
    }

    // 3. Check user hasn't already reviewed this product (unique constraint)
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // 4. Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
    };
  }

  async findByProductId(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      sellerReply: r.sellerReply,
      replyAt: r.replyAt,
      createdAt: r.createdAt,
      user: r.user,
    }));
  }

  async findBySellerStoreId(sellerId: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: sellerId } });
    if (!store) throw new NotFoundException('Bạn chưa có cửa hàng');

    return this.prisma.review.findMany({
      where: { product: { storeId: store.id } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, image: true } },
      },
    });
  }

  async replyToReview(sellerId: string, reviewId: string, reply: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerId: sellerId } });
    if (!store) throw new NotFoundException('Bạn chưa có cửa hàng');

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true },
    });

    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    if (review.product.storeId !== store.id) throw new ForbiddenException('Bạn không có quyền trả lời đánh giá này');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        sellerReply: reply,
        replyAt: new Date(),
      },
    });
  }

  async findAll() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, storeId: true } },
      },
    });
  }

  async delete(reviewId: string) {
    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async getProductRating(productId: string) {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      totalReviews: result._count.rating,
    };
  }
}
