import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('orders/:id')
  async getOrderChatHistory(
    @Param('id') orderId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getOrderChatHistory(orderId, req.user.id);
  }
}
