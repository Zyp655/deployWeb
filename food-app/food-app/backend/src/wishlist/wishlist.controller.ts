import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getWishlist(@Req() req: AuthenticatedRequest) {
    const items = await this.prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          select: {
            id: true, name: true, description: true, price: true,
            image: true, category: true, isSpicy: true, isVegetarian: true,
            isAvailable: true, calories: true, tags: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((i) => ({ ...i.product, wishlistId: i.id, addedAt: i.createdAt }));
  }

  @Post(':productId')
  async addToWishlist(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    if (existing) return { message: 'Đã có trong danh sách yêu thích' };

    await this.prisma.wishlist.create({
      data: { userId: req.user.id, productId },
    });
    return { message: 'Đã thêm vào yêu thích' };
  }

  @Delete(':productId')
  async removeFromWishlist(@Req() req: AuthenticatedRequest, @Param('productId') productId: string) {
    await this.prisma.wishlist.deleteMany({
      where: { userId: req.user.id, productId },
    });
    return { message: 'Đã xóa khỏi yêu thích' };
  }
}
