import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding nhiều Seller và Driver...');
  const hash = await bcrypt.hash('123456', 10);

  const newSellersCount = 10;
  const newDriversCount = 10;

  // Mảng tên ngẫu nhiên
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Ngọc', 'Thanh', 'Minh', 'Hoàng', 'Xuân', 'Thu', 'Hồng', 'Đức', 'Gia'];
  const lastNames = ['An', 'Bình', 'Châu', 'Danh', 'Đạt', 'Hoa', 'Hùng', 'Khoa', 'Linh', 'Mai', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Vinh', 'Yến'];

  const storeNames = ['Quán Phở', 'Bún Bò', 'Cơm Tấm', 'Trà Sữa', 'Cà Phê', 'Bánh Mì', 'Chè', 'Ốc', 'Lẩu', 'Nướng', 'Gà Rán', 'Pizza', 'Ăn Vặt', 'Mì Cay', 'Cơm Rang'];
  const storeSuffix = ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Hương Quê', 'Gia Truyền', 'Cô Ba', 'Chú Tư', 'Ngon', 'Bổ Rẻ', 'Sinh Viên', 'Vỉa Hè'];

  const districts = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10', 'Cầu Giấy', 'Hà Đông', 'Hoàn Kiếm', 'Đống Đa', 'Tân Bình', 'Gò Vấp', 'Thủ Đức'];

  function getRandomName() {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  // --- Tạo 10 Sellers & Stores ---
  for (let i = 1; i <= newSellersCount; i++) {
    const email = `seller_extra_${i}@test.com`;
    const name = getRandomName();
    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

    const seller = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hash,
        role: 'RESTAURANT',
        phone
      },
    });

    const storeName = `${storeNames[Math.floor(Math.random() * storeNames.length)]} ${storeSuffix[Math.floor(Math.random() * storeSuffix.length)]} - ${districts[Math.floor(Math.random() * districts.length)]}`;
    const lat = 20.90 + Math.random() * 0.15; // Random quanh khu vực HN
    const lng = 105.70 + Math.random() * 0.15;

    await prisma.store.upsert({
      where: { ownerId: seller.id },
      update: {},
      create: {
        name: storeName,
        ownerId: seller.id,
        address: `${Math.floor(Math.random() * 200) + 1} Đường nhánh, ${districts[Math.floor(Math.random() * districts.length)]}`,
        phone,
        description: `Quán ăn ngon rẻ chất lượng phục vụ 24/7. Được nhiều khách hàng yêu thích.`,
        lat,
        lng,
        rating: 4.0 + Math.random(),
        totalOrders: Math.floor(Math.random() * 500)
      },
    });
  }
  console.log(`✅ Đã tạo thành công ${newSellersCount} Seller và Store`);

  // --- Tạo 10 Drivers ---
  for (let i = 1; i <= newDriversCount; i++) {
    const email = `driver_extra_${i}@test.com`;
    const name = getRandomName();
    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

    const driver = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hash,
        role: 'DRIVER',
        phone
      },
    });

    const lat = 20.90 + Math.random() * 0.15;
    const lng = 105.70 + Math.random() * 0.15;

    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: {},
      create: {
        userId: driver.id,
        vehicleType: Math.random() > 0.8 ? 'CAR' : 'MOTORBIKE',
        vehiclePlate: `29-H${Math.floor(Math.random() * 9)} ${Math.floor(1000 + Math.random() * 90000)}`,
        idCardNumber: `001${Math.floor(100000000 + Math.random() * 900000000)}`,
        isOnline: Math.random() > 0.3, // 70% chance online
        isVerified: true,
        currentLat: lat,
        currentLng: lng,
        totalDeliveries: Math.floor(Math.random() * 300),
        totalEarnings: Math.floor(Math.random() * 5000000),
        averageRating: 4.5 + Math.random() * 0.5,
      },
    });
  }
  console.log(`✅ Đã tạo thành công ${newDriversCount} Driver (Tài xế)`);

  console.log('\n🎉 Seed hoàn tất!');
  console.log('Tài khoản test mới (password: 123456):');
  console.log('  Sellers: seller_extra_1@test.com → seller_extra_10@test.com');
  console.log('  Drivers: driver_extra_1@test.com → driver_extra_10@test.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
