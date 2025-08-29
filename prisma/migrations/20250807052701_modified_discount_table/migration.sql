/*
  Warnings:

  - You are about to drop the column `appliesOncePerCustomer` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `asyncUsageCount` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `combinesWith` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `configuration` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `discountClasses` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `Discount` table. All the data in the column will be lost.
  - You are about to drop the column `usageLimit` on the `Discount` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "code" TEXT,
    "status" TEXT,
    "functionId" TEXT,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "config" JSONB,
    "shopifyRaw" JSONB,
    "lastSyncAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Discount" ("code", "createdAt", "endsAt", "id", "shopifyId", "startsAt", "status", "title", "type", "updatedAt") SELECT "code", "createdAt", "endsAt", "id", "shopifyId", "startsAt", "status", "title", "type", "updatedAt" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE UNIQUE INDEX "Discount_shopifyId_key" ON "Discount"("shopifyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
