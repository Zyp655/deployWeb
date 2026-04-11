import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtService } from '@nestjs/jwt';

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

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reviews: {
          select: { rating: true },
        },
      },
    });

    return products.map((p) => {
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }).filter(Boolean) as RecommendedProductDto[];
      
      return results;
    } catch (e) {
      console.error('AI Service Error:', e);
      // Fallback
      const fallbackProducts = await this.prisma.product.findMany({
        where: { isAvailable: true },
        take: 4,
        orderBy: { createdAt: 'desc' }
      });
      return fallbackProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        category: p.category,
        isAvailable: p.isAvailable,
        recommendReason: 'Món phổ biến đang được yêu thích'
      }));
    }
  }
}
