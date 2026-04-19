import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrder() {
  const allOrders = await prisma.order.findMany({ select: { id: true, storeId: true, paymentMethod: true } });
  const matches = allOrders.filter(o => o.id.toUpperCase().includes('C5FEE7E0') || o.id.toUpperCase().startsWith('C5FEE7E0'));
  
  if (matches.length > 0) {
    for (const match of matches) {
      const order = await prisma.order.findUnique({
        where: { id: match.id },
        include: {
          store: {
            include: { owner: true }
          }
        }
      });
      console.log(JSON.stringify(order, null, 2));
    }
  } else {
    console.log("Order not found with C5FEE7E0.");
    console.log("All order IDs:", allOrders.map(o => o.id).join(', '));
  }
}

checkOrder().catch(console.error).finally(() => prisma.$disconnect());
