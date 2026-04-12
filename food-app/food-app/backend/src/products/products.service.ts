import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtService } from '@nestjs/jwt';
import { isProductTimeValid } from '../utils/time-utils';

export interface RecommendedProductDto extends ProductResponseDto {
  recommendReason: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async findAll(query?: any): Promise<ProductResponseDto[]> {
    const where: any = { isAvailable: true };

    // Filter: vegetarian
    if (query?.filter === 'vegetarian' || query?.vegetarian === 'true') {
      where.isVegetarian = true;
    }

    // Filter: spicy
    if (query?.spicy === 'false') {
      where.isSpicy = false;
    } else if (query?.spicy === 'true') {
      where.isSpicy = true;
    }

    // Filter: maxCalories
    if (query?.maxCalories) {
      const maxCal = parseInt(query.maxCalories, 10);
      if (!isNaN(maxCal)) {
        where.calories = { lte: maxCal };
      }
    }

    // Filter: search
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.storeId) {
      where.storeId = query.storeId;
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: {
          select: { rating: true },
        },
      },
    });

    const validProducts = products.filter(p => isProductTimeValid(p.saleStartTime, p.saleEndTime));

    return validProducts.map((p) => {
      const ratings = p.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : 0;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        isAvailable: p.isAvailable,
        isSpicy: p.isSpicy,
        isVegetarian: p.isVegetarian,
        calories: p.calories,
        tags: p.tags,
        storeId: p.storeId,
        averageRating: avgRating,
        totalReviews: ratings.length,
      };
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const ratings = product.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      isAvailable: product.isAvailable,
      storeId: product.storeId,
      averageRating: avgRating,
      totalReviews: ratings.length,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        sellerReply: r.sellerReply,
        replyAt: r.replyAt,
        createdAt: r.createdAt,
        user: r.user,
      })),
    };
  }

  async getRecommended(token?: string): Promise<RecommendedProductDto[]> {
    let userId = null;
    const orderHistory: { productId: string; category: string; quantity: number }[] = [];

    if (token) {
      try {
        const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        userId = payload.sub;

        const orders = await this.prisma.order.findMany({
          where: { userId },
          include: { items: { include: { product: true } } },
        });

        for (const order of orders) {
          for (const item of order.items) {
            orderHistory.push({
              productId: item.productId,
              category: item.product.category,
              quantity: item.quantity,
            });
          }
        }
      } catch (e) {
        // Invalid token or expired, ignore and treat as guest
      }
    }

    const availableProducts = await this.prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, category: true, name: true },
    });

    try {
      // Native Recommendation Logic
      if (!userId || orderHistory.length === 0) {
        // Fallback for guest or zero history
        const fallbackProducts = availableProducts.slice(0, 4);
        const productsMap = await this.prisma.product.findMany({
          where: { id: { in: fallbackProducts.map(p => p.id) } }
        });
        const results = fallbackProducts.map((fp) => {
          const product = productsMap.find((p) => p.id === fp.id);
          if (!product) return null;
          return {
            ...product,
            averageRating: 0,
            totalReviews: 0,
            recommendReason: 'Món phổ biến đang được yêu thích'
          };
        }).filter(Boolean).filter((p: any) => isProductTimeValid(p.saleStartTime, p.saleEndTime)) as unknown as RecommendedProductDto[];
        return results.slice(0, 4);
      }

      // Content-based filtering
      const catScores: Record<string, number> = {};
      let totalQty = 0;
      for (const item of orderHistory) {
        catScores[item.category] = (catScores[item.category] || 0) + item.quantity;
        totalQty += item.quantity;
      }
      totalQty = totalQty || 1;

      let topCat = '';
      let maxCatScore = 0;
      for (const [cat, qty] of Object.entries(catScores)) {
        if (qty > maxCatScore) {
          maxCatScore = qty;
          topCat = cat;
        }
      }

      const scoredProducts = availableProducts.map(p => {
        let baseScore = ((catScores[p.category] || 0) / totalQty) * 10;
        baseScore += Math.random() * 0.8 + 0.1; // tiny noise
        
        let reason = "Gợi ý mới cho bạn";
        if (baseScore > 3 && topCat === p.category) {
          reason = `Vì bạn thường thích món thuộc loại ${p.category}`;
        } else if (baseScore > 1) {
          reason = "Dựa trên lịch sử đặt hàng của bạn";
        }
        return { productId: p.id, score: baseScore, reason };
      });

      scoredProducts.sort((a, b) => b.score - a.score);
      const top = scoredProducts.slice(0, 4);

      const productsMap = await this.prisma.product.findMany({
        where: { id: { in: top.map((d) => d.productId) } },
      });

      const results = top.map((ai) => {
        const product = productsMap.find((p) => p.id === ai.productId);
        if (!product) return null;
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          isAvailable: product.isAvailable,
          recommendReason: ai.reason,
        };
      }).filter(Boolean).filter((p: any) => isProductTimeValid(p.saleStartTime, p.saleEndTime)) as unknown as RecommendedProductDto[];

      return results.slice(0, 4);
    } catch (e) {
      console.error('AI Recommendation Logic Error:', e);
      // Fallback
      const fallbackProducts = await this.prisma.product.findMany({
        where: { isAvailable: true },
        take: 4,
        orderBy: { createdAt: 'desc' }
      });
      const validFallback = fallbackProducts.filter(p => isProductTimeValid(p.saleStartTime, p.saleEndTime));
      return validFallback.map((p) => ({
        ...p,
        averageRating: 0,
        totalReviews: 0,
        recommendReason: 'Món phổ biến đang được yêu thích'
      })) as unknown as RecommendedProductDto[];
    }
  }
}
