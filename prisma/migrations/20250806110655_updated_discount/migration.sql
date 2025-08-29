/*
  Warnings:

  - You are about to drop the column `shopifyId` on the `Discount` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_Discount" ("appliesOncePerCustomer", "asyncUsageCount", "code", "combinesWith", "configuration", "createdAt", "discountClasses", "endsAt", "id", "method", "startsAt", "status", "title", "updatedAt", "usageLimit") SELECT "appliesOncePerCustomer", "asyncUsageCount", "code", "combinesWith", "configuration", "createdAt", "discountClasses", "endsAt", "id", "method", "startsAt", "status", "title", "updatedAt", "usageLimit" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
