export class ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  isAvailable: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  calories?: number | null;
  tags?: string[];
  averageRating?: number;
  totalReviews?: number;
}
