/*
  Warnings:

  - You are about to drop the `CombinesWith` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscountClass` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscountConfiguration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscountConfigurationCollection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DiscountConfigurationProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `combinesWithId` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `configurationId` on the `Discount` table. All the data in the column will be lost.
  - Added the required column `combinesWith` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `configuration` to the `Discount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discountClasses` to the `Discount` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DiscountConfigurationCollection_discountConfigurationId_idx";

-- DropIndex
DROP INDEX "DiscountConfigurationProduct_discountConfigurationId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CombinesWith";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscountClass";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscountConfiguration";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscountConfigurationCollection";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscountConfigurationProduct";
PRAGMA foreign_keys=on;

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
    "configuration" JSONB NOT NULL,
    "combinesWith" JSONB NOT NULL,
    "discountClasses" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Discount" ("appliesOncePerCustomer", "asyncUsageCount", "code", "createdAt", "endsAt", "id", "method", "shopifyId", "startsAt", "status", "title", "type", "updatedAt", "usageLimit") SELECT "appliesOncePerCustomer", "asyncUsageCount", "code", "createdAt", "endsAt", "id", "method", "shopifyId", "startsAt", "status", "title", "type", "updatedAt", "usageLimit" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE UNIQUE INDEX "Discount_shopifyId_key" ON "Discount"("shopifyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
