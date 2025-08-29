/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Discount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Discount_id_key" ON "Discount"("id");
