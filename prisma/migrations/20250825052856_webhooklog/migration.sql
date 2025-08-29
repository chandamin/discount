/*
  Warnings:

  - You are about to drop the column `emailSent` on the `DiscountPayload` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
