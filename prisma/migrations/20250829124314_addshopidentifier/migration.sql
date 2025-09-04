/*
  Warnings:

  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Shop_domain_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Shop";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL DEFAULT 'unknown',
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME,
    CONSTRAINT "DiscountPayload_id_fkey" FOREIGN KEY ("id") REFERENCES "Discount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscountPayload" ("id", "status", "title", "updatedAt") SELECT "id", "status", "title", "updatedAt" FROM "DiscountPayload";
DROP TABLE "DiscountPayload";
ALTER TABLE "new_DiscountPayload" RENAME TO "DiscountPayload";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
