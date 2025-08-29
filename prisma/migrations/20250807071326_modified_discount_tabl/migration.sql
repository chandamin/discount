-- CreateTable
CREATE TABLE "DiscountPayload" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "updatedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountPayload_id_key" ON "DiscountPayload"("id");
