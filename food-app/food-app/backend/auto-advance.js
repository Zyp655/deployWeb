const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

async function run() {
  const user = await prisma.user.findFirst();
  const token = jwt.sign({ sub: user.id, email: user.email, role: 'ADMIN' }, process.env.JWT_SECRET);
  console.log("Started auto-advance script with token...");
  
  const statuses = ['CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED'];
  
  while (true) {
    try {
      const order = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
      if (order && order.status !== 'DELIVERED') {
        const nextStatus = statuses[statuses.indexOf(order.status) + 1] || statuses[0];
        if (order.status === 'PENDING') {
          await fetch(`http://localhost:4000/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: 'CONFIRMED' })
          });
        } else {
          await fetch(`http://localhost:4000/orders/${order.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: nextStatus })
          });
        }
        console.log('Updated order', order.id, 'to', nextStatus);
        await new Promise(r => setTimeout(r, 4000));
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch(e) { console.error(e.message); await new Promise(r => setTimeout(r, 1000)); }
  }
}
run();
