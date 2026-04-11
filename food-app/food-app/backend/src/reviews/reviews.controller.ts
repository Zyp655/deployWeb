import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

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

  @Get('reviews/seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  async getSellerReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewsService.findBySellerStoreId(req.user.id);
  }

  @Patch('reviews/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RESTAURANT)
  async replyToReview(
    @Param('id') reviewId: string,
    @Body('reply') reply: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.replyToReview(req.user.id, reviewId, reply);
  }

  @Get('reviews/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllReviews() {
    return this.reviewsService.findAll();
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteReview(@Param('id') reviewId: string) {
    return this.reviewsService.delete(reviewId);
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
