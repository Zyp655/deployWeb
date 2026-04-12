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
  ) { }

  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  async searchProducts(query: string, userId: string = 'anonymous') {
    try {
      const queryNorm = this.removeAccents(query).trim();
      let products = await this.prisma.product.findMany({
        where: { isAvailable: true },
      });

      const { isProductTimeValid } = require('../utils/time-utils');
      products = products.filter(p => isProductTimeValid(p.saleStartTime, p.saleEndTime));

      const scored = products.map((product) => {
        let score = 0;
        const nameNorm = this.removeAccents(product.name || '');
        const descNorm = this.removeAccents(product.description || '');
        const catNorm = this.removeAccents(product.category || '');
        const tags = Array.isArray(product.tags) ? product.tags : [];

        if (nameNorm.includes(queryNorm)) score += 10;
        if (descNorm.includes(queryNorm)) score += 5;
        if (catNorm.includes(queryNorm)) score += 3;

        for (const tag of tags) {
          if (typeof tag === 'string' && this.removeAccents(tag).includes(queryNorm)) {
            score += 2;
          }
        }

        const words = queryNorm.split(/\s+/);
        for (const word of words) {
          if (word.length >= 2) {
            if (nameNorm.includes(word)) score += 1;
            if (descNorm.includes(word)) score += 0.5;
          }
        }

        return { item: product, score };
      });

      const results = scored
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => ({ ...x.item, score: x.score }));

      return { results, query };
    } catch (error) {
      console.error('AI Service Search Error:', error);
      throw new InternalServerErrorException('Lỗi tìm kiếm sản phẩm');
    }
  }

  async chat(message: string, userId: string = 'anonymous') {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured in environment');
      }

      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey });

      const products = await this.prisma.product.findMany({
        where: { isAvailable: true },
        take: 25,
      });

      const itemsStr = products.map((p) => `${p.name} (${p.price} VND)`).join(', ');
      const menuContext = products.length > 0 ? `Menu hiện tại của nhà hàng gồm có: ${itemsStr}.` : '';

      const systemPrompt = `Bạn là trợ lý ảo thân thiện của ứng dụng đặt món ăn (Food App). 
Hãy tư vấn cho khách hàng bằng tiếng Việt một cách lịch sự, nhiệt tình và tự nhiên nhất.
${menuContext}
Hãy trả lời ngắn gọn (dưới 4 câu) và tập trung vào các câu hỏi liên quan tới thức ăn, đặt hàng, phí ship (phí cơ bản 5000đ/Km), và menu. Nếu khách hàng hỏi món không có, hãy gợi ý món khác trong menu.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 250,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content?.trim() || "Xin lỗi, hiện tại tôi đang quá tải. Vui lòng thử lại sau chút nhé!";

      return { reply, status: 'ok' };
    } catch (error: any) {
      console.error('AI Service Chat Error:', error?.message);
      return {
        reply: "Xin lỗi, hiện tại tôi đang quá tải. Vui lòng thử lại sau chút nhé!",
        status: 'error'
      };
    }
  }
}
