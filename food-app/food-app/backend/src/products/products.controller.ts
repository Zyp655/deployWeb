import { Controller, Get, Param, Req, Query, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProductsService, RecommendedProductDto } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { Request } from 'express';

@Controller('products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('recommended')
  async getRecommended(@Req() req: Request): Promise<RecommendedProductDto[]> {
    const token = req.headers.authorization?.split(' ')[1];
    return this.productsService.getRecommended(token);
  }

  @Get(':id')
  @CacheTTL(300000) // 5 minutes
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get()
  @CacheTTL(300000) // 5 minutes
  async findAll(@Query() query: any): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(query);
  }
}
