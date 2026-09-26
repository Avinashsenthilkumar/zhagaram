-- Preserve existing review data while adding guest reviewer names.
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

ALTER TABLE "Review" ADD COLUMN "reviewerName" TEXT;

UPDATE "Review"
SET "reviewerName" = 'Customer'
WHERE "reviewerName" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "reviewerName" SET NOT NULL;

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Review_status_idx" ON "Review"("status");

ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
