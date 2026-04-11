import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { Request } from 'express';

// For non-auth endpoints, we use optional user
interface OptionalAuthRequest extends Request {
  user?: { id: string };
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('search')
  async search(@Query('q') q: string, @Req() req: OptionalAuthRequest) {
    const userId = req.user?.id || 'anonymous';
    if (!q) return { results: [], query: '' };
    return this.aiService.searchProducts(q, userId);
  }

  @Post('chat')
  async chat(@Body('message') message: string, @Req() req: OptionalAuthRequest) {
    const userId = req.user?.id || 'anonymous';
    return this.aiService.chat(message, userId);
  }
}
