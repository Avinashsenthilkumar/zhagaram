-- Site-wide settings edited from /admin/settings. Exactly one row, id 'singleton'.
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'ZHAGARAM EXIM LLP',
    "shortName" TEXT NOT NULL DEFAULT 'ZHAGARAM EXIM',
    "tagline" TEXT NOT NULL DEFAULT 'From Indian Roots to Global Routes',
    "description" TEXT NOT NULL DEFAULT 'India-based export and import company supplying quality agricultural and food products to international markets.',
    "logoData" TEXT,
    "logoMimeType" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "whatsapp" TEXT,
    "linkedin" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- Seed the single row so a fresh database serves defaults before anyone visits
-- the settings page.
INSERT INTO "SiteSetting" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
