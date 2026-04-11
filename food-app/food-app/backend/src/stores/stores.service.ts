import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { isProductTimeValid } from '../utils/time-utils';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(lat?: number, lng?: number, radiusKm: number = 10) {
    if (lat !== undefined && lng !== undefined) {
      // Postgres Raw Query with Haversine Formula for Geolocation
      const stores = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM (
          SELECT id, name, description, image, "cover_image" as "coverImage", address, "is_open" as "isOpen", "open_time" as "openTime", "close_time" as "closeTime", rating, "total_orders" as "totalOrders", lat, lng,
          (6371 * acos(cos(radians(${lat})) * cos(radians(lat)) * cos(radians(lng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(lat)))) AS distance
          FROM stores
          WHERE "is_open" = true AND lat IS NOT NULL AND lng IS NOT NULL
        ) AS sub
        WHERE distance <= ${radiusKm}
        ORDER BY distance ASC
      `;
      return stores;
    }

    const stores = await this.prisma.store.findMany({
      where: { isOpen: true },
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        coverImage: true,
        address: true,
        lat: true,
        lng: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        rating: true,
        totalOrders: true,
      },
    });
    return stores;
  }

  async findById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        coverImage: true,
        address: true,
        phone: true,
        isOpen: true,
        openTime: true,
        closeTime: true,
        rating: true,
        totalOrders: true,
        products: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Quán ăn không tồn tại');
    }

    // Filter out products outside their available time slots
    store.products = store.products.filter(p => isProductTimeValid(p.saleStartTime, p.saleEndTime));

    return store;
  }
}
