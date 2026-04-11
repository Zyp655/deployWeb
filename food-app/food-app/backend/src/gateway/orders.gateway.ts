import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      
      // Join a room specific to this user based on their ID
      client.join(`user_${payload.sub}`);
      console.log(`Client connected: ${client.id} joined user_${payload.sub}`);

      // If user is a driver, join 'drivers' room
      if (payload.role === 'DRIVER') {
        client.join('drivers');
        console.log(`Client ${client.id} joined drivers room`);
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitOrderStatusUpdate(userId: string, orderId: string, status: string, note?: string) {
    this.server.to(`user_${userId}`).emit('order-status-updated', {
      orderId,
      status,
      note,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastToDrivers(event: string, payload: any) {
    this.server.to('drivers').emit(event, payload);
  }

  @SubscribeMessage('update-driver-location')
  handleDriverLocationUpdate(
    @MessageBody() data: { orderId: string; customerId: string; lat: number; lng: number }
  ) {
    if (!data.customerId) return;
    this.server.to(`user_${data.customerId}`).emit('driver-location-updated', {
      orderId: data.orderId,
      lat: data.lat,
      lng: data.lng,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('send-chat-message')
  async handleChatMessage(
    client: Socket,
    @MessageBody() data: { orderId: string; receiverId: string; content: string }
  ) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return;

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      const senderId = payload.sub;

      // Ensure the order exists
      const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
      if (!order) return;

      // Verify sender is part of this order (either driver or user)
      if (order.userId !== senderId && order.driverId !== senderId) return;

      // Verify receiver is part of this order
      if (order.userId !== data.receiverId && order.driverId !== data.receiverId) return;

      // Save to database
      const message = await this.prisma.chatMessage.create({
        data: {
          orderId: data.orderId,
          senderId,
          receiverId: data.receiverId,
          content: data.content,
        },
        include: {
          sender: { select: { id: true, name: true, role: true } }
        }
      });

      // Emit to receiver's room
      this.server.to(`user_${data.receiverId}`).emit('chat-message-received', message);
      
      // Also emit back to sender's room to confirm it's sent
      this.server.to(`user_${senderId}`).emit('chat-message-received', message);

    } catch (e) {
      console.error('Error handling chat message:', e);
    }
  }
}
