import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu tạo tài khoản Admin và Restaurant...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Tạo Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodapp.com' },
    update: {
      role: 'ADMIN',
      password: passwordHash,
    },
    create: {
      email: 'admin@foodapp.com',
      name: 'Quản trị viên',
      password: passwordHash,
      role: 'ADMIN',
      phone: '0987654321',
    },
  });
  console.log('✅ Đã tạo tài khoản Admin:', admin.email, '- Mật khẩu: 123456');

  // 2. Tạo Seller / Restaurant
  const seller = await prisma.user.upsert({
    where: { email: 'seller@foodapp.com' },
    update: {
      role: 'RESTAURANT',
      password: passwordHash,
    },
    create: {
      email: 'seller@foodapp.com',
      name: 'Chủ Cửa Hàng',
      password: passwordHash,
      role: 'RESTAURANT',
      phone: '0999888777',
    },
  });
  console.log('✅ Đã tạo tài khoản Người Bán (Restaurant):', seller.email, '- Mật khẩu: 123456');

  console.log('🎉 Hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
