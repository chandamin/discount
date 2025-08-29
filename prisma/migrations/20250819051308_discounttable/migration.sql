/*
  Warnings:

  - You are about to drop the `DiscountNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiscountNotification";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Discount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "functionId" TEXT,
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
INSERT INTO "new_Discount" ("code", "collections", "createdAt", "deliveryPercentage", "endsAt", "functionId", "id", "method", "orderPercentage", "productPercentage", "products", "shop", "startsAt", "title", "updatedAt") SELECT "code", "collections", "createdAt", "deliveryPercentage", "endsAt", "functionId", "id", "method", "orderPercentage", "productPercentage", "products", "shop", "startsAt", "title", "updatedAt" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
