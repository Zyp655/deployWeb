import { PrismaClient, OrderStatus } from '@prisma/client';
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
  console.log('🌱 Seeding nhiều Seller, Driver, Products và Orders...');
  const hash = await bcrypt.hash('123456', 10);

  const newSellersCount = 10;
  const newDriversCount = 10;

  // Mảng tên ngẫu nhiên
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
  const middleNames = ['Văn', 'Thị', 'Hữu', 'Ngọc', 'Thanh', 'Minh', 'Thu', 'Đức'];
  const lastNames = ['An', 'Bình', 'Danh', 'Đạt', 'Hoa', 'Hùng', 'Khoa', 'Linh', 'Mai', 'Nam'];
  
  const storeNames = [
    'Phở Bò Gia Truyền', 'Bún Chả Hương Quê', 'Cơm Tấm Sài Gòn', 
    'Trà Sữa Boba House', 'Tiệm Bánh Mì Dân Tổ', 'Lẩu Thái Chua Cay',
    'Gà Rán Xốt Hàn Quốc', 'Sushi Cá Hồi 88', 'Chè Ngon Cô Ba',
    'Bún Trộn Nam Bộ', 'Pizza Nhất Nướng'
  ];
  const districts = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10', 'Cầu Giấy', 'Hà Đông', 'Hoàn Kiếm'];

  function getRandomName() {
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  const createdStores = [];
  const createdDrivers = [];

  // --- Tạo Sellers & Stores ---
  for (let i = 1; i <= newSellersCount; i++) {
    const email = `seller_extra_${i}@test.com`;
    const name = getRandomName();
    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
    
    const seller = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, password: hash, role: 'RESTAURANT', phone },
    });

    const lat = 20.90 + Math.random() * 0.15;
    const lng = 105.70 + Math.random() * 0.15;

    const store = await prisma.store.upsert({
      where: { ownerId: seller.id },
      update: {},
      create: {
        name: `${storeNames[Math.floor(Math.random() * storeNames.length)]} - ${districts[Math.floor(Math.random() * districts.length)]}`,
        ownerId: seller.id,
        address: `${Math.floor(Math.random() * 200) + 1} Đường nhánh, ${districts[Math.floor(Math.random() * districts.length)]}`,
        phone,
        description: `Quán ăn phục vụ nhiệt tình chu đáo. Thực phẩm tươi ngon đảm bảo vệ sinh. Mang đến trải nghiệm tốt nhất!`,
        lat, lng, rating: 4.0 + Math.random(), totalOrders: 0
      },
    });
    createdStores.push(store);

    // Tạo Products cho Store này (Lấy mẫu dữ liệu thật trực quan)
    const REAL_PRODUCTS = [
      { name: 'Phở Bò Đặc Biệt', category: 'Món nước', price: 65000, image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=800&auto=format&fit=crop' },
      { name: 'Bún Chả Hà Nội', category: 'Món nước', price: 50000, image: 'https://images.unsplash.com/photo-1555126634-ae23555239e0?w=800&auto=format&fit=crop' },
      { name: 'Cơm Tấm Sườn Bì', category: 'Món khô', price: 55000, image: 'https://images.unsplash.com/photo-1615679507981-d10aab6d2a41?w=800&auto=format&fit=crop' },
      { name: 'Gà Rán Xốt Cay', category: 'Món khô', price: 75000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop' },
      { name: 'Bánh Mì Thịt Nướng', category: 'Món khô', price: 25000, image: 'https://images.unsplash.com/photo-1619604107557-b532ed3bf028?w=800&auto=format&fit=crop' },
      { name: 'Sushi Cá Hồi', category: 'Khai vị', price: 120000, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop' },
      { name: 'Trà Sữa Trân Châu', category: 'Đồ uống', price: 45000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop' },
      { name: 'Cà Phê Sữa Đá', category: 'Đồ uống', price: 25000, image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop' },
      { name: 'Sinh Tố Bơ', category: 'Đồ uống', price: 40000, image: 'https://images.unsplash.com/photo-1624021961609-b14194098fb4?w=800&auto=format&fit=crop' },
      { name: 'Mì Cay Hải Sản', category: 'Món nước', price: 65000, image: 'https://images.unsplash.com/photo-1585032226651-469b61fb2380?w=800&auto=format&fit=crop' },
      { name: 'Salad Rong Biển', category: 'Khai vị', price: 45000, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop' },
      { name: 'Bò Bít Tết', category: 'Món khô', price: 150000, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&auto=format&fit=crop' },
      { name: 'Pizza Hải Sản', category: 'Món khô', price: 180000, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop' },
      { name: 'Gỏi Cuốn Tôm Thịt', category: 'Khai vị', price: 35000, image: 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=800&auto=format&fit=crop' },
      { name: 'Bún Trộn Nam Bộ', category: 'Món khô', price: 50000, image: 'https://images.unsplash.com/photo-1579893962621-08ec39634e2c?w=800&auto=format&fit=crop' }
    ];

    const productsCount = Math.floor(Math.random() * 4) + 4; // 4-7 món
    const tempProducts = [];
    const shuffledProducts = [...REAL_PRODUCTS].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffledProducts.slice(0, productsCount);

    for (const p of selectedProducts) {
      const prod = await prisma.product.create({
        data: {
          storeId: store.id,
          name: p.name,
          price: p.price,
          category: p.category,
          image: p.image,
          calories: Math.floor(Math.random() * 300) + 200,
          isAvailable: true,
          isVegetarian: p.category === 'Đồ uống' || p.name.includes('Salad'),
          isSpicy: p.name.includes('Cay') || p.name.includes('Bún Chả') || p.name.includes('Gà')
        }
      });
      tempProducts.push(prod);
    }
    (store as any)._products = tempProducts;
  }
  console.log(`✅ Đã tạo thành công ${newSellersCount} Seller, Store và Menu sản phẩm`);

  // --- Tạo Drivers ---
  for (let i = 1; i <= newDriversCount; i++) {
    const email = `driver_extra_${i}@test.com`;
    const name = getRandomName();
    const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

    const driver = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, password: hash, role: 'DRIVER', phone },
    });
    createdDrivers.push(driver);

    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: {},
      create: {
        userId: driver.id,
        vehicleType: 'MOTORBIKE',
        vehiclePlate: `29-H${Math.floor(Math.random() * 9)} ${Math.floor(1000 + Math.random() * 90000)}`,
        idCardNumber: `001${Math.floor(100000000 + Math.random() * 900000000)}`,
        isOnline: true, isVerified: true,
        currentLat: 20.90 + Math.random() * 0.15,
        currentLng: 105.70 + Math.random() * 0.15,
        totalDeliveries: Math.floor(Math.random() * 50),
        totalEarnings: Math.floor(Math.random() * 2000000),
        averageRating: 4.8,
      },
    });
  }
  console.log(`✅ Đã tạo thành công ${newDriversCount} Driver (Tài xế)`);

  // --- Tạo Khách Hàng (nếu chưa có) ---
  const customerList = [];
  for (let i=1; i<=5; i++) {
     const email = `customer_auto_${i}@test.com`;
     const user = await prisma.user.upsert({
       where: { email },
       update: {},
       create: { email, name: `Khách Hàng ${i}`, password: hash, role: 'CUSTOMER', phone: '0988888888' }
     });
     customerList.push(user);
  }

  // --- Tạo Orders ngẫu nhiên ---
  console.log('⏳ Đang tạo các Đơn hàng (Orders), Doanh thu (Earnings), và Lịch sử (Transaction)...');
  let orderCount = 0;
  for (const store of createdStores) {
    const randomOrdersCount = Math.floor(Math.random() * 8) + 5; // Tới 13 đơn mỗi quán
    
    for (let o = 0; o < randomOrdersCount; o++) {
      const customer = customerList[Math.floor(Math.random() * customerList.length)];
      const driver = createdDrivers[Math.floor(Math.random() * createdDrivers.length)];
      const product = (store as any)._products[Math.floor(Math.random() * (store as any)._products.length)];
      
      const qty = Math.floor(Math.random() * 3) + 1;
      const total = product.price * qty;
      const shippingFee = 15000;
      const createdAt = daysAgo(Math.floor(Math.random() * 14)); // Đơn trong 14 ngày qua
      
      const order = await prisma.order.create({
        data: {
          storeId: store.id,
          userId: customer.id,
          driverId: driver.id,
          status: 'DELIVERED',
          total: total,
          shippingFee: shippingFee,
          deliveryAddress: 'Đia chỉ ngẫu nhiên, HN',
          deliveryLat: (store.lat || 20.90) + 0.01,
          deliveryLng: (store.lng || 105.70) + 0.01,
          paymentMethod: 'COD',
          createdAt,
          items: {
            create: [
              { productId: product.id, quantity: qty, price: product.price }
            ]
          }
        }
      });

      // Lịch sử
      await prisma.orderHistory.createMany({
        data: [
          { orderId: order.id, status: 'PENDING', createdAt },
          { orderId: order.id, status: 'DELIVERED', createdAt: new Date(createdAt.getTime() + 30 * 60000) } // Sau 30p
        ]
      });

      // Doanh thu tài xế
      await prisma.driverEarning.create({
        data: {
          driverId: driver.id,
          orderId: order.id,
          baseFee: shippingFee * 0.8,
          tip: 0, bonus: 0,
          totalFee: shippingFee * 0.8,
          createdAt
        }
      });

      // Transaction
      await prisma.transaction.create({
        data: {
          userId: customer.id,
          orderId: order.id,
          amount: total + shippingFee,
          status: 'SUCCESS',
          method: 'COD',
          idempotencyKey: uuidv4(),
          createdAt
        }
      });
      orderCount++;
    }
    
    // Cập nhật lại tổng đơn cho store
    await prisma.store.update({
      where: { id: store.id },
      data: { totalOrders: randomOrdersCount }
    });
  }

  console.log(`✅ Đã rải ngẫu nhiên ${orderCount} đơn hàng giao thành công để Test báo cáo doanh thu.`);

  console.log('\n🎉 Seed hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
