import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu migrate Store data...');

  // 1. Tạo store cho tất cả user có role RESTAURANT
  const restaurantUsers = await prisma.user.findMany({
    where: { role: 'RESTAURANT' },
  });

  for (const user of restaurantUsers) {
    let store = await prisma.store.findUnique({
      where: { ownerId: user.id },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: `Cửa hàng của ${user.name}`,
          ownerId: user.id,
          address: 'Chưa cập nhật',
          phone: user.phone || 'Chưa cập nhật',
          description: 'Cửa hàng đối tác ShopeeFood',
        },
      });
      console.log(`✅ Đã tạo store cho user ${user.name}`);
    }

    // 2. Tạm thời gán tất cả product chưa có store cho store đầu tiên tìm thấy
    // (Trong DB cũ, product không có store, nên ai là admin login vào sẽ ko thấy. 
    // Chúng ta sẽ gán cho store partner đầu tiên làm mặc định để dev)
    if (store) {
       const unassignedProducts = await prisma.product.count({
           where: { storeId: null }
       });
       if (unassignedProducts > 0) {
           await prisma.product.updateMany({
               where: { storeId: null },
               data: { storeId: store.id }
           });
           console.log(`✅ Đã gán ${unassignedProducts} sản phẩm cho store ${store.name}`);
       }

       const unassignedOrders = await prisma.order.count({
           where: { storeId: null }
       });
       if (unassignedOrders > 0) {
           await prisma.order.updateMany({
               where: { storeId: null },
               data: { storeId: store.id }
           });
           console.log(`✅ Đã gán ${unassignedOrders} đơn hàng cho store ${store.name}`);
       }
       // Chỉ gán cho 1 store đầu tiên thôi
       break;
    }
  }

  console.log('🎉 Store migration hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
