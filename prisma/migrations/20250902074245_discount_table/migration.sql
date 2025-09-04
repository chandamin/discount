/*
  Warnings:

  - A unique constraint covering the columns `[shop,title]` on the table `Discount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shop,code]` on the table `Discount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Discount_shop_title_key" ON "Discount"("shop", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_shop_code_key" ON "Discount"("shop", "code");
