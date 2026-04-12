import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePartnerRequestDto } from './dto/create-request.dto';
import { PartnerType, PartnerRequestStatus, Role } from '@prisma/client';

@Injectable()
export class PartnerRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(userId: string, data: CreatePartnerRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Admin không thể đăng ký trở thành đối tác.');
    }

    if (data.type === PartnerType.SELLER && user.role === Role.RESTAURANT) {
      throw new ConflictException('Bạn đã là Seller rồi');
    }

    if (data.type === PartnerType.DRIVER && user.role === Role.DRIVER) {
      throw new ConflictException('Bạn đã là Driver rồi');
    }

    const pendingRequest = await this.prisma.partnerRequest.findFirst({
      where: {
        userId,
        status: PartnerRequestStatus.PENDING,
      },
    });

    if (pendingRequest) {
      throw new ConflictException('Bạn đang có một yêu cầu chờ duyệt. Vui lòng đợi kết quả trước khi gửi tiếp.');
    }

    return this.prisma.partnerRequest.create({
      data: {
        userId,
        type: data.type,
        storeName: data.storeName,
        storeAddress: data.storeAddress,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        idCardNumber: data.idCardNumber,
      },
    });
  }

  async getMyRequests(userId: string) {
    return this.prisma.partnerRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRequests() {
    return this.prisma.partnerRequest.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveRequest(requestId: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu này');
    if (request.status !== PartnerRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể duyệt yêu cầu đang chờ (PENDING)');
    }

    let newRole = Role.CUSTOMER;

    await this.prisma.$transaction(async (tx) => {
      // 1. Mark as APPROVED
      await tx.partnerRequest.update({
        where: { id: requestId },
        data: { status: PartnerRequestStatus.APPROVED }
      });

      // 2. Process based on Type
      if (request.type === PartnerType.SELLER) {
        newRole = Role.RESTAURANT;
        // Kiểm tra xem đã có cửa hàng chưa (có thể do role cũ)
        const existingStore = await tx.store.findUnique({ where: { ownerId: request.userId } });
        if (!existingStore) {
          await tx.store.create({
            data: {
              name: request.storeName || `${request.user.name}'s Store`,
              address: request.storeAddress || '',
              ownerId: request.userId,
            }
          });
        }
      } else if (request.type === PartnerType.DRIVER) {
        newRole = Role.DRIVER;
        const existingProfile = await tx.driverProfile.findUnique({ where: { userId: request.userId } });
        if (!existingProfile) {
          await tx.driverProfile.create({
            data: {
              userId: request.userId,
              vehicleType: request.vehicleType || 'MOTORBIKE',
              vehiclePlate: request.vehiclePlate,
              idCardNumber: request.idCardNumber,
              isVerified: true, // Vì admin duyệt tay, mặc định là đã verify
            }
          });
        }
      }

      // 3. Update User Role
      await tx.user.update({
        where: { id: request.userId },
        data: { role: newRole }
      });
    });

    return { message: 'Đã phê duyệt đối tác thành công' };
  }

  async rejectRequest(requestId: string, reason?: string) {
    const request = await this.prisma.partnerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu này');
    if (request.status !== PartnerRequestStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ (PENDING)');
    }

    return this.prisma.partnerRequest.update({
      where: { id: requestId },
      data: {
        status: PartnerRequestStatus.REJECTED,
        notes: reason || 'Yêu cầu bị từ chối do không đạt tiêu chuẩn',
      }
    });
  }
}
