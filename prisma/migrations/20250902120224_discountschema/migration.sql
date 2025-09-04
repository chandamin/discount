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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Discount_id_fkey" FOREIGN KEY ("id") REFERENCES "DiscountPayload" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Discount" ("code", "collections", "createdAt", "deliveryPercentage", "endsAt", "functionId", "id", "method", "orderPercentage", "productPercentage", "products", "shop", "startsAt", "title", "updatedAt") SELECT "code", "collections", "createdAt", "deliveryPercentage", "endsAt", "functionId", "id", "method", "orderPercentage", "productPercentage", "products", "shop", "startsAt", "title", "updatedAt" FROM "Discount";
DROP TABLE "Discount";
ALTER TABLE "new_Discount" RENAME TO "Discount";
CREATE UNIQUE INDEX "Discount_shop_title_key" ON "Discount"("shop", "title");
CREATE UNIQUE INDEX "Discount_shop_code_key" ON "Discount"("shop", "code");
CREATE TABLE "new_DiscountPayload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME
);
INSERT INTO "new_DiscountPayload" ("id", "status", "title", "updatedAt") SELECT "id", "status", "title", "updatedAt" FROM "DiscountPayload";
DROP TABLE "DiscountPayload";
ALTER TABLE "new_DiscountPayload" RENAME TO "DiscountPayload";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
