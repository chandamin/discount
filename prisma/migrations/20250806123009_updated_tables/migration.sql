/*
  Warnings:

  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DiscountCollections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DiscountProducts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `combinesWith` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `configuration` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `discountClasses` on the `Discount` table. All the data in the column will be lost.
  - Added the required column `configurationId` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopifyId` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Made the column `appliesOncePerCustomer` on table `Discount` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Collection_shopifyId_key";

-- DropIndex
DROP INDEX "Product_shopifyId_key";

-- DropIndex
DROP INDEX "_DiscountCollections_B_index";

-- DropIndex
DROP INDEX "_DiscountCollections_AB_unique";

-- DropIndex
DROP INDEX "_DiscountProducts_B_index";

-- DropIndex
DROP INDEX "_DiscountProducts_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Collection";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_DiscountCollections";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_DiscountProducts";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "DiscountConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartLinePercentage" REAL NOT NULL,
    "orderPercentage" REAL NOT NULL,
    "deliveryPercentage" REAL NOT NULL,
    "metafieldId" TEXT
);

-- CreateTable
CREATE TABLE "DiscountConfigurationCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discountConfigurationId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    CONSTRAINT "DiscountConfigurationCollection_discountConfigurationId_fkey" FOREIGN KEY ("discountConfigurationId") REFERENCES "DiscountConfiguration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscountConfigurationProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discountConfigurationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "DiscountConfigurationProduct_discountConfigurationId_fkey" FOREIGN KEY ("discountConfigurationId") REFERENCES "DiscountConfiguration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CombinesWith" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderDiscounts" BOOLEAN NOT NULL,
    "productDiscounts" BOOLEAN NOT NULL,
    "shippingDiscounts" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "DiscountClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    CONSTRAINT "DiscountClass_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "code" TEXT,
    "usageLimit" INTEGER,
    "appliesOncePerCustomer" BOOLEAN NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "asyncUsageCount" INTEGER,
    "configurationId" TEXT NOT NULL,
    "combinesWithId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Discount_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "DiscountConfiguration" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Discount_combinesWithId_fkey" FOREIGN KEY ("combinesWithId") REFERENCES "CombinesWith" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Discount" ("appliesOncePerCustomer", "asyncUsageCount", "code", "createdAt", "endsAt", "id", "method", "startsAt", "status", "title", "updatedAt", "usageLimit") SELECT "appliesOncePerCustomer", "asyncUsageCount", "code", "createdAt", "endsAt", "id", "method", "startsAt", "status", "title", "updatedAt", "usageLimit" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE UNIQUE INDEX "Discount_shopifyId_key" ON "Discount"("shopifyId");
CREATE UNIQUE INDEX "Discount_configurationId_key" ON "Discount"("configurationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DiscountConfigurationCollection_discountConfigurationId_idx" ON "DiscountConfigurationCollection"("discountConfigurationId");

-- CreateIndex
CREATE INDEX "DiscountConfigurationProduct_discountConfigurationId_idx" ON "DiscountConfigurationProduct"("discountConfigurationId");
