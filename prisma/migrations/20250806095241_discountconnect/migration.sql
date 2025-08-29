/*
  Warnings:

  - The primary key for the `Discount` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `customMessage` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `percentage` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `saleMessage` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `storeUrl` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `Discount` table. All the data in the column will be lost.
  - Added the required column `combinesWith` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configuration` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountClasses` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopifyId` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_DiscountProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DiscountProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Discount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DiscountProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DiscountCollections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DiscountCollections_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DiscountCollections_B_fkey" FOREIGN KEY ("B") REFERENCES "Discount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "code" TEXT,
    "usageLimit" INTEGER,
    "appliesOncePerCustomer" BOOLEAN,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "discountClasses" TEXT NOT NULL,
    "combinesWith" JSONB NOT NULL,
    "asyncUsageCount" INTEGER,
    "configuration" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Discount" ("createdAt", "id", "updatedAt") SELECT "createdAt", "id", "updatedAt" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE UNIQUE INDEX "Discount_shopifyId_key" ON "Discount"("shopifyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_shopifyId_key" ON "Collection"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyId_key" ON "Product"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscountProducts_AB_unique" ON "_DiscountProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscountProducts_B_index" ON "_DiscountProducts"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscountCollections_AB_unique" ON "_DiscountCollections"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscountCollections_B_index" ON "_DiscountCollections"("B");
