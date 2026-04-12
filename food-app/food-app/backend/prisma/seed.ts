import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HA_DONG_COORDS = [
  { lat: 20.9716, lng: 105.7725 }, // Gần Cầu Trắng, Hà Đông
  { lat: 20.9760, lng: 105.7790 }, // Gần Văn Quán, Hà Đông
  { lat: 20.9630, lng: 105.7650 }, // Gần La Khê, Hà Đông
];

async function main() {
  console.log('🌱 Bắt đầu tạo dữ liệu Seed (Users, Stores, Products)...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo Customer User
  const customer = await prisma.user.upsert({
    where: { email: 'khachhang_hadong@test.com' },
    update: {},
    create: {
      email: 'khachhang_hadong@test.com',
      name: 'Khách Hàng Hà Đông',
      password: passwordHash,
      role: 'CUSTOMER',
      phone: '0987654321',
    },
  });
  console.log(`✅ Khách hàng tạo thành công: ${customer.email} / 123456`);

  // 2. Tạo Seller 1
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller_hadong_1@test.com' },
    update: {},
    create: {
      email: 'seller_hadong_1@test.com',
      name: 'Chủ Quán Phở',
      password: passwordHash,
      role: 'RESTAURANT',
      phone: '0911111111',
    },
  });

  const store1 = await prisma.store.upsert({
    where: { ownerId: seller1.id },
    update: { lat: HA_DONG_COORDS[0].lat, lng: HA_DONG_COORDS[0].lng },
    create: {
      name: 'Quán Phở Bò Tái - Hà Đông',
      ownerId: seller1.id,
      address: 'Đường Trần Phú, Cầu Trắng, Hà Đông, Hà Nội',
      phone: '0911111111',
      description: 'Phở bò gia truyền ngon nhất khu vực Hà Đông',
      lat: HA_DONG_COORDS[0].lat,
      lng: HA_DONG_COORDS[0].lng,
      rating: 4.8,
    },
  });
  console.log(`✅ Seller 1 tạo thành công: ${seller1.email} / 123456 - Store: ${store1.name}`);

  // 3. Tạo Seller 2
  const seller2 = await prisma.user.upsert({
    where: { email: 'seller_hadong_2@test.com' },
    update: {},
    create: {
      email: 'seller_hadong_2@test.com',
      name: 'Chủ Bún Chả',
      password: passwordHash,
      role: 'RESTAURANT',
      phone: '0922222222',
    },
  });

  const store2 = await prisma.store.upsert({
    where: { ownerId: seller2.id },
    update: { lat: HA_DONG_COORDS[1].lat, lng: HA_DONG_COORDS[1].lng },
    create: {
      name: 'Bún Chả Văn Quán - Hà Đông',
      ownerId: seller2.id,
      address: 'Khu Đô Thị Văn Quán, Hà Đông, Hà Nội',
      phone: '0922222222',
      description: 'Bún chả nướng than hoa thơm lừng',
      lat: HA_DONG_COORDS[1].lat,
      lng: HA_DONG_COORDS[1].lng,
      rating: 4.5,
    },
  });
  console.log(`✅ Seller 2 tạo thành công: ${seller2.email} / 123456 - Store: ${store2.name}`);

  // 4. Products cho Seller 1
  const products1 = [
    {
      name: 'Phở Bò Tái Nạm',
      description: 'Phở bò truyền thống với nước dùng ninh xương 12 tiếng, thịt bò tái chín, nạm gầu, rau thơm tươi.',
      price: 55000,
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=800&auto=format&fit=crop',
      category: 'Món nước',
      isAvailable: true,
      isSpicy: false,
      isVegetarian: false,
      calories: 450,
      tags: ['Bán chạy', 'Truyền thống'],
      storeId: store1.id,
    },
    {
      name: 'Phở Bò Gầu Giòn',
      description: 'Phở bò với gầu bò giòn sần sật, đặc biệt ngon vào buổi sáng.',
      price: 65000,
      image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&auto=format&fit=crop',
      category: 'Món nước',
      isAvailable: true,
      isSpicy: false,
      isVegetarian: false,
      calories: 500,
      tags: ['Cao cấp'],
      storeId: store1.id,
    }
  ];

  for (const product of products1) {
    const existing = await prisma.product.findFirst({ where: { name: product.name, storeId: store1.id } });
    if (!existing) {
      await prisma.product.create({ data: product });
    } else {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    }
  }

  // 5. Products cho Seller 2
  const products2 = [
    {
      name: 'Bún Chả Hà Nội Đầy Đủ',
      description: 'Bún chả nướng than hoa thơm lừng, kèm nước mắm pha chua ngọt và rau sống.',
      price: 50000,
      image: 'https://images.unsplash.com/photo-1555126634-ae23555239e0?w=800&auto=format&fit=crop',
      category: 'Món nước',
      isAvailable: true,
      isSpicy: false,
      isVegetarian: false,
      calories: 520,
      tags: ['Bán chạy', 'Đặc sản Hà Nội'],
      storeId: store2.id,
    },
    {
      name: 'Nem Cua Bể Rán (2 Chiếc)',
      description: 'Nem cua bể rán giòn rụm, nhân thịt, tôm, cua biển.',
      price: 40000,
      image: 'https://images.unsplash.com/photo-1606525437679-03e05f284e45?w=800&auto=format&fit=crop',
      category: 'Khai vị',
      isAvailable: true,
      isSpicy: false,
      isVegetarian: false,
      calories: 300,
      tags: ['Ngon'],
      storeId: store2.id,
    }
  ];

  for (const product of products2) {
    const existing = await prisma.product.findFirst({ where: { name: product.name, storeId: store2.id } });
    if (!existing) {
      await prisma.product.create({ data: product });
    } else {
      await prisma.product.update({ where: { id: existing.id }, data: product });
    }
  }

  console.log(`✅ Đã tạo dữ liệu các món ăn cho 2 quán ở Hà Đông!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
