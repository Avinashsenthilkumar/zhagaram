ALTER TABLE "Category"
  ADD COLUMN "imageData" TEXT,
  ADD COLUMN "imageMimeType" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "imageData" TEXT,
  ADD COLUMN "imageMimeType" TEXT;