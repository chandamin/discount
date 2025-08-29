-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DiscountPayload_id_fkey" FOREIGN KEY ("id") REFERENCES "Discount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DiscountPayload" ("emailSent", "id", "status", "title", "updatedAt") SELECT "emailSent", "id", "status", "title", "updatedAt" FROM "DiscountPayload";
DROP TABLE "DiscountPayload";
ALTER TABLE "new_DiscountPayload" RENAME TO "DiscountPayload";
CREATE UNIQUE INDEX "DiscountPayload_id_key" ON "DiscountPayload"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
