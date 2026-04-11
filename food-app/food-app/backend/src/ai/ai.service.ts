import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private readonly aiApiKey = process.env.AI_SERVICE_API_KEY || 'DEV_SECRET_KEY';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async searchProducts(query: string, userId: string = 'anonymous') {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiUrl}/search`, {
          params: { q: query, userId },
          headers: { 'x-api-key': this.aiApiKey },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('AI Service Search Error:', error);
      throw new InternalServerErrorException('Lỗi kết nối đến dịch vụ AI Search');
    }
  }

  async chat(message: string, userId: string = 'anonymous') {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiUrl}/chat`,
          { message, userId },
          { headers: { 'x-api-key': this.aiApiKey } },
        ),
      );
      return response.data;
    } catch (error) {
      console.error('AI Service Chat Error:', error);
      throw new InternalServerErrorException('Lỗi kết nối đến dịch vụ AI Chatbot');
    }
  }
}
