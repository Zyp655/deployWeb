import { Controller, Get, Param, Req, Query } from '@nestjs/common';
import { ProductsService, RecommendedProductDto } from './products.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('recommended')
  async getRecommended(@Req() req: Request): Promise<RecommendedProductDto[]> {
    const token = req.headers.authorization?.split(' ')[1];
    return this.productsService.getRecommended(token);
  }

  @Get('flash-sales')
  async getFlashSales() {
    return this.productsService.getFlashSaleProducts();
  }

  @Get('search/suggest')
  async searchSuggest(@Query('q') q: string) {
    if (!q) return { products: [], stores: [] };
    return this.productsService.searchSuggest(q);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Get()
  async findAll(@Query() query: any): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(query);
  }
}
