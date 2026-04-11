import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: { id: string; email: string; name: string; role: string };
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('products/:id/reviews')
  async findByProduct(@Param('id') productId: string) {
    return this.reviewsService.findByProductId(productId);
  }

  @Get('products/:id/rating')
  async getProductRating(@Param('id') productId: string) {
    return this.reviewsService.getProductRating(productId);
  }
}
