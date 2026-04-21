import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@foodapp.com' },
    update: {},
    create: {
      email: 'driver1@foodapp.com',
      name: 'Nguyễn Văn Tài Xế',
      password: passwordHash,
      role: 'DRIVER',
      phone: '0933333333',
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver1.id },
    update: {},
    create: {
      userId: driver1.id,
      vehicleType: 'MOTORBIKE',
      vehiclePlate: '29-B1 12345',
      idCardNumber: '001099012345',
      isOnline: true,
      isVerified: true,
      currentLat: 20.8710,
      currentLng: 106.6280,
    },
  });

  console.log(`✅ Driver 1: ${driver1.email} / 123456`);

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@foodapp.com' },
    update: {},
    create: {
      email: 'driver2@foodapp.com',
      name: 'Trần Minh Shipper',
      password: passwordHash,
      role: 'DRIVER',
      phone: '0944444444',
    },
  });

  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    update: {},
    create: {
      userId: driver2.id,
      vehicleType: 'MOTORBIKE',
      vehiclePlate: '30-H1 67890',
      idCardNumber: '001099067890',
      isOnline: true,
      isVerified: true,
      currentLat: 20.8735,
      currentLng: 106.6320,
    },
  });

  console.log(`✅ Driver 2: ${driver2.email} / 123456`);
  console.log('🏍️  Seed driver hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Seed driver failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
