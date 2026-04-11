-- AlterTable
ALTER TABLE "products" ADD COLUMN     "calories" INTEGER,
ADD COLUMN     "is_spicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_vegetarian" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
