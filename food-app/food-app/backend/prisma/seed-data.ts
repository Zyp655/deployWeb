import { PrismaClient, OrderStatus, TransactionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  console.log('🌱 Seeding dữ liệu trực quan cho Admin / Seller / Driver ...');
  const hash = await bcrypt.hash('123456', 10);

  // ── Customers ──
  const customerEmails = [
    { email: 'customer_a@test.com', name: 'Lê Thị Mai', phone: '0901000001' },
    { email: 'customer_b@test.com', name: 'Phạm Văn Hùng', phone: '0901000002' },
    { email: 'customer_c@test.com', name: 'Ngô Thanh Tùng', phone: '0901000003' },
    { email: 'customer_d@test.com', name: 'Đỗ Minh Tâm', phone: '0901000004' },
    { email: 'customer_e@test.com', name: 'Vũ Hoàng Anh', phone: '0901000005' },
    { email: 'customer_f@test.com', name: 'Bùi Ngọc Hà', phone: '0901000006' },
    { email: 'customer_g@test.com', name: 'Trịnh Quốc Bảo', phone: '0901000007' },
    { email: 'customer_h@test.com', name: 'Hoàng Thu Trang', phone: '0901000008' },
  ];
  const customers: any[] = [];
  for (const c of customerEmails) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, name: c.name, phone: c.phone, password: hash, role: 'CUSTOMER' },
    });
    customers.push(u);
  }
  console.log(`✅ ${customers.length} khách hàng`);

  // ── Sellers + Stores + Products ──
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller_hadong_1@test.com' },
    update: {},
    create: { email: 'seller_hadong_1@test.com', name: 'Chủ Quán Phở', password: hash, role: 'RESTAURANT', phone: '0911111111' },
  });
  const store1 = await prisma.store.upsert({
    where: { ownerId: seller1.id },
    update: { totalOrders: 45, rating: 4.8 },
    create: {
      name: 'Quán Phở Bò Tái - Hà Đông', ownerId: seller1.id,
      address: 'Đường Trần Phú, Cầu Trắng, Hà Đông, Hà Nội', phone: '0911111111',
      description: 'Phở bò gia truyền ngon nhất khu vực Hà Đông',
      lat: 20.9716, lng: 105.7725, rating: 4.8, totalOrders: 45,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller_hadong_2@test.com' },
    update: {},
    create: { email: 'seller_hadong_2@test.com', name: 'Chủ Bún Chả', password: hash, role: 'RESTAURANT', phone: '0922222222' },
  });
  const store2 = await prisma.store.upsert({
    where: { ownerId: seller2.id },
    update: { totalOrders: 32, rating: 4.5 },
    create: {
      name: 'Bún Chả Văn Quán - Hà Đông', ownerId: seller2.id,
      address: 'Khu Đô Thị Văn Quán, Hà Đông, Hà Nội', phone: '0922222222',
      description: 'Bún chả nướng than hoa thơm lừng',
      lat: 20.9760, lng: 105.7790, rating: 4.5, totalOrders: 32,
    },
  });
  console.log('✅ 2 sellers + stores');

  // ── Products ──
  const productsData1 = [
    { name: 'Phở Bò Tái Nạm', price: 55000, category: 'Món nước', calories: 450, tags: ['Bán chạy','Truyền thống'], isSpicy: false },
    { name: 'Phở Bò Gầu Giòn', price: 65000, category: 'Món nước', calories: 500, tags: ['Cao cấp'], isSpicy: false },
    { name: 'Phở Gà Lá Chanh', price: 50000, category: 'Món nước', calories: 400, tags: ['Nhẹ nhàng'], isSpicy: false },
    { name: 'Phở Bò Tái Sách', price: 60000, category: 'Món nước', calories: 480, tags: ['Đặc biệt'], isSpicy: false },
    { name: 'Nước Chanh Đá', price: 15000, category: 'Đồ uống', calories: 80, tags: ['Giải khát'], isSpicy: false },
    { name: 'Trà Đá', price: 5000, category: 'Đồ uống', calories: 0, tags: [], isSpicy: false },
  ];
  const productsData2 = [
    { name: 'Bún Chả Hà Nội Đầy Đủ', price: 50000, category: 'Món nước', calories: 520, tags: ['Bán chạy','Đặc sản Hà Nội'], isSpicy: false },
    { name: 'Nem Cua Bể Rán', price: 40000, category: 'Khai vị', calories: 300, tags: ['Ngon'], isSpicy: false },
    { name: 'Bún Đậu Mắm Tôm', price: 55000, category: 'Món khô', calories: 600, tags: ['Đặc biệt'], isSpicy: true },
    { name: 'Chả Cá Lã Vọng', price: 85000, category: 'Món đặc biệt', calories: 550, tags: ['Cao cấp','Hà Nội'], isSpicy: false },
    { name: 'Trà Sen Vàng', price: 20000, category: 'Đồ uống', calories: 50, tags: ['Truyền thống'], isSpicy: false },
  ];

  const products1: any[] = [];
  for (const p of productsData1) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, storeId: store1.id } });
    if (existing) {
      products1.push(existing);
    } else {
      const created = await prisma.product.create({
        data: { ...p, storeId: store1.id, isAvailable: true, isVegetarian: false, image: '/images/pho-bo.jpg' },
      });
      products1.push(created);
    }
  }
  const products2: any[] = [];
  for (const p of productsData2) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, storeId: store2.id } });
    if (existing) {
      products2.push(existing);
    } else {
      const created = await prisma.product.create({
        data: { ...p, storeId: store2.id, isAvailable: true, isVegetarian: false, image: '/images/bun-cha.jpg' },
      });
      products2.push(created);
    }
  }
  const allProducts = [...products1, ...products2];
  console.log(`✅ ${allProducts.length} sản phẩm`);

  // ── Drivers ──
  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@foodapp.com' },
    update: {},
    create: { email: 'driver1@foodapp.com', name: 'Nguyễn Văn Tài Xế', password: hash, role: 'DRIVER', phone: '0933333333' },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver1.id },
    update: { totalDeliveries: 38, totalEarnings: 1520000, averageRating: 4.9, isOnline: true, isVerified: true },
    create: {
      userId: driver1.id, vehicleType: 'MOTORBIKE', vehiclePlate: '29-B1 12345',
      idCardNumber: '001099012345', isOnline: true, isVerified: true,
      currentLat: 20.9716, currentLng: 105.7725,
      totalDeliveries: 38, totalEarnings: 1520000, averageRating: 4.9,
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@foodapp.com' },
    update: {},
    create: { email: 'driver2@foodapp.com', name: 'Trần Minh Shipper', password: hash, role: 'DRIVER', phone: '0944444444' },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    update: { totalDeliveries: 22, totalEarnings: 880000, averageRating: 4.7, isOnline: true, isVerified: true },
    create: {
      userId: driver2.id, vehicleType: 'MOTORBIKE', vehiclePlate: '30-H1 67890',
      idCardNumber: '001099067890', isOnline: true, isVerified: true,
      currentLat: 20.9760, currentLng: 105.7790,
      totalDeliveries: 22, totalEarnings: 880000, averageRating: 4.7,
    },
  });
  const drivers = [driver1, driver2];
  console.log('✅ 2 drivers');

  // ── Coupons ──
  const couponsData = [
    { code: 'WELCOME20', description: 'Giảm 20% đơn đầu tiên', discountType: 'PERCENT', discountValue: 20, minOrderValue: 50000, maxDiscount: 30000, usageLimit: 200, usedCount: 47 },
    { code: 'FREESHIP', description: 'Miễn phí giao hàng', discountType: 'FIXED', discountValue: 15000, minOrderValue: 30000, maxDiscount: null, usageLimit: 500, usedCount: 123 },
    { code: 'SALE30K', description: 'Giảm 30K cho đơn từ 100K', discountType: 'FIXED', discountValue: 30000, minOrderValue: 100000, maxDiscount: null, usageLimit: 100, usedCount: 31 },
  ];
  for (const cp of couponsData) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: { usedCount: cp.usedCount },
      create: { ...cp, storeId: store1.id, isActive: true, expiresAt: new Date('2026-12-31') },
    });
  }
  await prisma.coupon.upsert({
    where: { code: 'BUNCHA10' },
    update: {},
    create: { code: 'BUNCHA10', description: 'Giảm 10% bún chả', discountType: 'PERCENT', discountValue: 10, minOrderValue: 40000, maxDiscount: 15000, storeId: store2.id, isActive: true, expiresAt: new Date('2026-12-31') },
  });
  console.log('✅ Coupons');

  // ── Orders (30 đơn trong 14 ngày) ──
  const paymentMethods = ['COD', 'MOMO', 'VNPAY'];
  const addresses = [
    'Số 10, Trần Phú, Hà Đông, Hà Nội',
    'KĐT Văn Quán, Hà Đông, Hà Nội',
    'Phố Lê Lợi, Hà Đông, Hà Nội',
    'Ngõ 68 Quang Trung, Hà Đông, Hà Nội',
    'Tòa HH Linh Đàm, Hoàng Mai, Hà Nội',
  ];

  const orderConfigs = [
    // day, storeIdx, customerIdx, driverIdx, status, productIdxList, quantities
    { day: 0, si: 0, ci: 0, di: 0, status: 'DELIVERING' as OrderStatus, pi: [0], q: [2] },
    { day: 0, si: 0, ci: 1, di: 1, status: 'PREPARING' as OrderStatus, pi: [1, 4], q: [1, 2] },
    { day: 0, si: 1, ci: 2, di: 0, status: 'CONFIRMED' as OrderStatus, pi: [0, 1], q: [1, 1] },
    { day: 0, si: 0, ci: 3, di: null, status: 'PENDING' as OrderStatus, pi: [2], q: [1] },
    { day: 1, si: 0, ci: 0, di: 0, status: 'DELIVERED' as OrderStatus, pi: [0, 5], q: [1, 1] },
    { day: 1, si: 0, ci: 4, di: 1, status: 'DELIVERED' as OrderStatus, pi: [1], q: [2] },
    { day: 1, si: 1, ci: 5, di: 0, status: 'DELIVERED' as OrderStatus, pi: [2], q: [1] },
    { day: 1, si: 1, ci: 6, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0, 4], q: [2, 1] },
    { day: 2, si: 0, ci: 1, di: 0, status: 'DELIVERED' as OrderStatus, pi: [3, 4], q: [1, 3] },
    { day: 2, si: 0, ci: 7, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0], q: [3] },
    { day: 2, si: 1, ci: 0, di: 0, status: 'DELIVERED' as OrderStatus, pi: [3], q: [1] },
    { day: 2, si: 1, ci: 2, di: 1, status: 'CANCELLED' as OrderStatus, pi: [1], q: [2] },
    { day: 3, si: 0, ci: 3, di: 0, status: 'DELIVERED' as OrderStatus, pi: [0, 1], q: [1, 1] },
    { day: 3, si: 0, ci: 5, di: 1, status: 'DELIVERED' as OrderStatus, pi: [2, 5], q: [2, 1] },
    { day: 3, si: 1, ci: 4, di: 0, status: 'DELIVERED' as OrderStatus, pi: [0], q: [1] },
    { day: 4, si: 0, ci: 6, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0], q: [1] },
    { day: 4, si: 0, ci: 7, di: 0, status: 'DELIVERED' as OrderStatus, pi: [3, 4], q: [1, 2] },
    { day: 4, si: 1, ci: 1, di: 1, status: 'DELIVERED' as OrderStatus, pi: [2, 4], q: [1, 1] },
    { day: 5, si: 0, ci: 0, di: 0, status: 'DELIVERED' as OrderStatus, pi: [1, 5], q: [1, 2] },
    { day: 5, si: 1, ci: 3, di: 1, status: 'DELIVERED' as OrderStatus, pi: [3], q: [2] },
    { day: 6, si: 0, ci: 2, di: 0, status: 'DELIVERED' as OrderStatus, pi: [0, 4], q: [2, 1] },
    { day: 6, si: 1, ci: 5, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0, 1], q: [1, 2] },
    { day: 6, si: 0, ci: 4, di: 0, status: 'CANCELLED' as OrderStatus, pi: [2], q: [1] },
    { day: 7, si: 0, ci: 6, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0, 3], q: [1, 1] },
    { day: 8, si: 1, ci: 7, di: 0, status: 'DELIVERED' as OrderStatus, pi: [0, 3], q: [1, 1] },
    { day: 9, si: 0, ci: 1, di: 1, status: 'DELIVERED' as OrderStatus, pi: [1, 4, 5], q: [1, 1, 1] },
    { day: 10, si: 1, ci: 0, di: 0, status: 'DELIVERED' as OrderStatus, pi: [2, 4], q: [2, 1] },
    { day: 11, si: 0, ci: 3, di: 1, status: 'DELIVERED' as OrderStatus, pi: [0], q: [2] },
    { day: 12, si: 0, ci: 5, di: 0, status: 'DELIVERED' as OrderStatus, pi: [2, 3], q: [1, 1] },
    { day: 13, si: 1, ci: 7, di: 1, status: 'DELIVERED' as OrderStatus, pi: [1, 3], q: [1, 1] },
  ];

  const stores = [store1, store2];
  const storeProducts = [products1, products2];
  const createdOrders: any[] = [];

  for (const cfg of orderConfigs) {
    const store = stores[cfg.si];
    const prods = storeProducts[cfg.si];
    const customer = customers[cfg.ci];
    const driver = cfg.di !== null ? drivers[cfg.di] : null;
    const createdAt = daysAgo(cfg.day);

    let total = 0;
    const itemsPayload: any[] = [];
    for (let i = 0; i < cfg.pi.length; i++) {
      const product = prods[cfg.pi[i]];
      const qty = cfg.q[i];
      total += product.price * qty;
      itemsPayload.push({ productId: product.id, quantity: qty, price: product.price });
    }
    const shippingFee = 15000 + Math.floor(Math.random() * 10000);
    const storeRating = cfg.status === 'DELIVERED' ? (Math.random() > 0.3 ? 5 : 4) : null;
    const driverRating = cfg.status === 'DELIVERED' && driver ? (Math.random() > 0.2 ? 5 : 4) : null;
    const driverTip = cfg.status === 'DELIVERED' && Math.random() > 0.6 ? Math.floor(Math.random() * 3 + 1) * 5000 : 0;

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        storeId: store.id,
        driverId: driver?.id ?? null,
        status: cfg.status,
        total,
        shippingFee,
        discount: 0,
        deliveryAddress: addresses[Math.floor(Math.random() * addresses.length)],
        deliveryPhone: customer.phone,
        deliveryLat: 20.97 + (Math.random() - 0.5) * 0.02,
        deliveryLng: 105.77 + (Math.random() - 0.5) * 0.02,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        storeRating,
        driverRating,
        driverTip,
        reviewComment: cfg.status === 'DELIVERED' && Math.random() > 0.4 ? 'Ăn ngon lắm, ship nhanh!' : null,
        createdAt,
        items: { create: itemsPayload },
      },
    });
    createdOrders.push({ order, cfg, driver });

    // OrderHistory
    const historyEntries: { status: OrderStatus; note: string | null; createdAt: Date }[] = [
      { status: 'PENDING', note: null, createdAt: new Date(createdAt.getTime()) },
    ];
    if (cfg.status !== 'PENDING') {
      historyEntries.push({ status: 'CONFIRMED', note: 'Quán đã xác nhận', createdAt: new Date(createdAt.getTime() + 2 * 60000) });
    }
    if (['PREPARING','PREPARED','PICKING_UP','DELIVERING','DELIVERED'].includes(cfg.status)) {
      historyEntries.push({ status: 'PREPARING', note: null, createdAt: new Date(createdAt.getTime() + 5 * 60000) });
    }
    if (['PICKING_UP','DELIVERING','DELIVERED'].includes(cfg.status)) {
      historyEntries.push({ status: 'PICKING_UP', note: 'Tài xế đã đến quán', createdAt: new Date(createdAt.getTime() + 15 * 60000) });
    }
    if (['DELIVERING','DELIVERED'].includes(cfg.status)) {
      historyEntries.push({ status: 'DELIVERING', note: null, createdAt: new Date(createdAt.getTime() + 20 * 60000) });
    }
    if (cfg.status === 'DELIVERED') {
      historyEntries.push({ status: 'DELIVERED', note: 'Giao thành công', createdAt: new Date(createdAt.getTime() + 35 * 60000) });
    }
    if (cfg.status === 'CANCELLED') {
      historyEntries.push({ status: 'CANCELLED', note: 'Khách huỷ đơn', createdAt: new Date(createdAt.getTime() + 3 * 60000) });
    }
    await prisma.orderHistory.createMany({ data: historyEntries.map(h => ({ ...h, orderId: order.id })) });

    // Transaction
    if (cfg.status === 'DELIVERED') {
      await prisma.transaction.create({
        data: {
          orderId: order.id, userId: customer.id,
          amount: total + shippingFee, method: order.paymentMethod || 'COD',
          status: 'SUCCESS', idempotencyKey: uuidv4(), createdAt,
        },
      });
    }

    // DriverEarning
    if (cfg.status === 'DELIVERED' && driver) {
      const baseFee = shippingFee * 0.8;
      await prisma.driverEarning.create({
        data: {
          driverId: driver.id, orderId: order.id,
          baseFee, tip: driverTip, bonus: Math.random() > 0.7 ? 5000 : 0,
          totalFee: baseFee + driverTip + (Math.random() > 0.7 ? 5000 : 0),
          createdAt,
        },
      });
    }
  }
  console.log(`✅ ${createdOrders.length} đơn hàng + history + transactions + earnings`);

  // ── Reviews ──
  const reviewComments = [
    'Phở rất ngon, nước dùng đậm đà!',
    'Ship nhanh, đóng gói cẩn thận',
    'Món ăn tươi, sạch, ngon miệng',
    'Sẽ ủng hộ lần sau, ngon lắm!',
    'Hơi mặn nhưng tổng thể ổn',
    'Ngon xuất sắc, giá hợp lý!',
    'Bún chả nướng thơm, nước chấm tuyệt',
    'Đóng gói cẩn thận, ship đúng giờ',
  ];
  let reviewCount = 0;
  for (let i = 0; i < Math.min(customers.length, allProducts.length); i++) {
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: customers[i].id, productId: allProducts[i].id } },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          userId: customers[i].id,
          productId: allProducts[i].id,
          rating: Math.random() > 0.3 ? 5 : 4,
          comment: reviewComments[i % reviewComments.length],
          sellerReply: i % 3 === 0 ? 'Cảm ơn bạn đã ủng hộ quán! ❤️' : null,
          replyAt: i % 3 === 0 ? new Date() : null,
          createdAt: daysAgo(Math.floor(Math.random() * 10)),
        },
      });
      reviewCount++;
    }
  }
  console.log(`✅ ${reviewCount} reviews`);

  console.log('\n🎉 Seed hoàn tất! Dashboard sẽ có dữ liệu trực quan.');
  console.log('────────────────────────────────────────');
  console.log('Tài khoản test (password: 123456):');
  console.log('  Admin:    admin@foodapp.com / Admin@123');
  console.log('  Seller 1: seller_hadong_1@test.com');
  console.log('  Seller 2: seller_hadong_2@test.com');
  console.log('  Driver 1: driver1@foodapp.com');
  console.log('  Driver 2: driver2@foodapp.com');
  console.log('  Customer: customer_a@test.com → customer_h@test.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
