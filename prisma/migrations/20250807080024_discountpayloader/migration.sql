-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME
);
INSERT INTO "new_DiscountPayload" ("id", "status", "title", "updatedAt") SELECT "id", "status", "title", "updatedAt" FROM "DiscountPayload";
DROP TABLE "DiscountPayload";
ALTER TABLE "new_DiscountPayload" RENAME TO "DiscountPayload";
CREATE UNIQUE INDEX "DiscountPayload_id_key" ON "DiscountPayload"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
