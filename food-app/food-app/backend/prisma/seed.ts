import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    name: 'Phở Bò Tái',
    description: 'Phở bò truyền thống với nước dùng ninh xương 12 tiếng, thịt bò tái mềm, rau thơm tươi.',
    price: 55000,
    image: '/images/pho-bo.jpg',
    category: 'Món nước',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    calories: 450,
    tags: ['Bán chạy', 'Truyền thống'],
  },
  {
    name: 'Bún Chả Hà Nội',
    description: 'Bún chả nướng than hoa thơm lừng, kèm nước mắm pha chua ngọt và rau sống.',
    price: 50000,
    image: '/images/bun-cha.jpg',
    category: 'Món nước',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    calories: 520,
    tags: ['Bán chạy', 'Đặc sản Hà Nội'],
  },
  {
    name: 'Bánh Mì Thịt Nướng',
    description: 'Bánh mì giòn rụm, nhân thịt nướng đậm đà, đồ chua, rau mùi, ớt tươi.',
    price: 30000,
    image: '/images/banh-mi.jpg',
    category: 'Món khô',
    isAvailable: true,
    isSpicy: true,
    isVegetarian: false,
    calories: 380,
    tags: ['Cay', 'Nhanh gọn'],
  },
  {
    name: 'Cơm Tấm Sườn Bì Chả',
    description: 'Cơm tấm Sài Gòn đặc biệt: sườn nướng, bì, chả trứng, mỡ hành, nước mắm.',
    price: 60000,
    image: '/images/com-tam.jpg',
    category: 'Cơm',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    calories: 680,
    tags: ['Bán chạy', 'Đặc sản Sài Gòn'],
  },
  {
    name: 'Gỏi Cuốn Tôm Thịt',
    description: 'Gỏi cuốn tươi mát với tôm, thịt luộc, bún, rau sống, chấm tương đậu phộng.',
    price: 35000,
    image: '/images/goi-cuon.jpg',
    category: 'Khai vị',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    calories: 280,
    tags: ['Healthy', 'Ít calo'],
  },
  {
    name: 'Bò Lúc Lắc',
    description: 'Thịt bò Úc xào lúc lắc với tỏi, tiêu đen, ăn kèm cơm trắng nóng hổi.',
    price: 85000,
    image: '/images/bo-luc-lac.jpg',
    category: 'Món mặn',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: false,
    calories: 620,
    tags: ['Cao cấp', 'Bò Úc'],
  },
  {
    name: 'Chè Thái',
    description: 'Chè thập cẩm kiểu Thái với nước cốt dừa, trái cây tươi, thạch lá dứa.',
    price: 25000,
    image: '/images/che-thai.jpg',
    category: 'Tráng miệng',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: true,
    calories: 320,
    tags: ['Chay', 'Ngọt mát'],
  },
  {
    name: 'Trà Sen Vàng',
    description: 'Trà ướp sen tươi Tây Hồ, hương thơm nhẹ nhàng, thanh mát giải nhiệt.',
    price: 20000,
    image: '/images/tra-sen.jpg',
    category: 'Đồ uống',
    isAvailable: true,
    isSpicy: false,
    isVegetarian: true,
    calories: 50,
    tags: ['Chay', 'Ít calo', 'Healthy'],
  },
];

async function main() {
  console.log('🌱 Updating products with filter attributes...');

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          isAvailable: product.isAvailable,
          isSpicy: product.isSpicy,
          isVegetarian: product.isVegetarian,
          calories: product.calories,
          tags: product.tags,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          isAvailable: product.isAvailable,
          isSpicy: product.isSpicy,
          isVegetarian: product.isVegetarian,
          calories: product.calories,
          tags: product.tags,
        },
      });
    }
  }

  console.log(`✅ Seeded ${products.length} products successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
