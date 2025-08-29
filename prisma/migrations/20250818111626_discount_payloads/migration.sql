/*
  Warnings:

  - You are about to drop the column `config` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `lastSyncAt` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyId` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `shopifyRaw` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `DiscountPayload` table. All the data in the column will be lost.
  - Added the required column `collections` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryPercentage` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderPercentage` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productPercentage` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `products` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shop` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Made the column `functionId` on table `Discount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startsAt` on table `Discount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Discount` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT,
    "method" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "productPercentage" REAL NOT NULL,
    "orderPercentage" REAL NOT NULL,
    "deliveryPercentage" REAL NOT NULL,
    "products" JSONB NOT NULL,
    "collections" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Discount" ("code", "createdAt", "endsAt", "functionId", "id", "startsAt", "title", "updatedAt") SELECT "code", "createdAt", "endsAt", "functionId", "id", "startsAt", "title", "updatedAt" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_DiscountPayload" ("emailSent", "id", "status", "title", "updatedAt") SELECT "emailSent", "id", "status", "title", "updatedAt" FROM "DiscountPayload";
DROP TABLE "DiscountPayload";
ALTER TABLE "new_DiscountPayload" RENAME TO "DiscountPayload";
CREATE UNIQUE INDEX "DiscountPayload_id_key" ON "DiscountPayload"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
