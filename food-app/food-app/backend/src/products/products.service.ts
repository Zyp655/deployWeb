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
  ) {}

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
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiApiKey = process.env.AI_SERVICE_API_KEY;
      
      if (!aiApiKey) {
        throw new Error('Thiếu cấu hình AI_SERVICE_API_KEY');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const response = await fetch(`${aiServiceUrl}/recommend`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-KEY': aiApiKey
        },
        body: JSON.stringify({
          userId,
          orderHistory,
          availableProducts,
          limit: 4,
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}`);
      }
      
      const aiData: { productId: string; score: number; reason: string }[] = await response.json();
      
      const productsMap = await this.prisma.product.findMany({
        where: { id: { in: aiData.map((d) => d.productId) } },
      });
      
      const results = aiData.map((ai) => {
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
      }).filter(Boolean).filter((p: any) => isProductTimeValid(p.saleStartTime, p.saleEndTime)) as RecommendedProductDto[];
      
      return results;
    } catch (e) {
      console.error('AI Service Error:', e);
      // Fallback
      const fallbackProducts = await this.prisma.product.findMany({
        where: { isAvailable: true },
        take: 4,
        orderBy: { createdAt: 'desc' }
      });
      const validFallback = fallbackProducts.filter(p => isProductTimeValid(p.saleStartTime, p.saleEndTime));
      return validFallback.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        isAvailable: p.isAvailable,
        recommendReason: 'Món phổ biến đang được yêu thích',
        averageRating: 0,
        totalReviews: 0,
        storeId: p.storeId,
      }));
    }
  }
}
