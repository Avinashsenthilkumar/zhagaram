DROP INDEX IF EXISTS "Review_productVariantId_status_idx";

ALTER TABLE "Review" DROP COLUMN IF EXISTS "productVariantId";

DROP TABLE IF EXISTS "ProductVariant";