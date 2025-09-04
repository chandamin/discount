/*
  Warnings:

  - Added the required column `shop` to the `FcmToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FcmToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FcmToken" ("createdAt", "id", "token", "updatedAt") SELECT "createdAt", "id", "token", "updatedAt" FROM "FcmToken";
DROP TABLE "FcmToken";
ALTER TABLE "new_FcmToken" RENAME TO "FcmToken";
CREATE UNIQUE INDEX "FcmToken_token_key" ON "FcmToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
