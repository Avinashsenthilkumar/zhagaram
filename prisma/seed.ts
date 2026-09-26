import "dotenv/config";

import { readFileSync } from "node:fs";

// The generator in prisma/schema.prisma is `provider = "prisma-client"` with
// `output = "../src/generated/prisma"`, so the client lives THERE -- the
// `@prisma/client` package only ships the runtime, not a generated client.
// Importing `PrismaClient` from "@prisma/client" made `npm run db:seed` fail
// before it opened a connection. Every other file in the project already
// imports from the generated path; this one had been missed.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Seeding writes schema-adjacent data, so prefer the direct (unpooled) URL when
// one is configured -- the same order prisma.config.ts uses for migrations.
const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL (or DIRECT_URL) is required to run the Prisma seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

function readPublicImage(path: string) {
  const data = readFileSync(new URL(`../public${path}`, import.meta.url)).toString("base64");
  const extension = path.split(".").pop()?.toLowerCase();
  const mimeType = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
  return { imageData: data, imageMimeType: mimeType };
}

const catalog = [
  {
    name: "Spices",
    slug: "spices",
    description: "Indian spices sourced for quality, aroma, and consistent international supply.",
    imagePath: "/images/export/quality.jpg",
    products: [
      {
        name: "Turmeric",
        slug: "turmeric",
        shortDescription: "Bright, aromatic turmeric sourced from Indian growers.",
        description: "Consistent colour, aroma, and quality for food manufacturers and distributors.",
        images: ["/images/export/quality.jpg"],
        features: ["Food-grade sourcing", "Bulk export packaging", "Custom specifications"],
      },
      {
        name: "Cumin",
        slug: "cumin",
        shortDescription: "Fragrant cumin selected for dependable export quality.",
        description: "Available in whole and processed formats for wholesale supply.",
        images: ["/images/export/quality.jpg"],
        features: ["Strong aroma", "Quality inspected", "Export-ready packing"],
      },
    ],
  },
  {
    name: "Pulses",
    slug: "pulses",
    description: "Pulses sourced from Indian agricultural supply chains for international buyers.",
    imagePath: "/images/products/pulses.jpg",
    products: [
      {
        name: "Chickpeas",
        slug: "chickpeas",
        shortDescription: "Clean, uniform chickpeas for global food supply chains.",
        description: "Packed to buyer requirements with dependable shipment coordination.",
        images: ["/images/products/pulses.jpg"],
        features: ["Uniform grading", "Bulk formats", "Supply continuity"],
      },
    ],
  },
];

async function seed() {
  for (const categoryInput of catalog) {
    const categoryImage = readPublicImage(categoryInput.imagePath);
    const category = await prisma.category.upsert({
      where: { slug: categoryInput.slug },
      update: {
        name: categoryInput.name,
        description: categoryInput.description,
        ...categoryImage,
      },
      create: {
        name: categoryInput.name,
        slug: categoryInput.slug,
        description: categoryInput.description,
        ...categoryImage,
      },
    });

    for (const productInput of categoryInput.products) {
      await prisma.product.upsert({
        where: { slug: productInput.slug },
        update: {
          name: productInput.name,
          categoryId: category.id,
          shortDescription: productInput.shortDescription,
          description: productInput.description,
          images: productInput.images,
          features: productInput.features,
          status: "ACTIVE",
        },
        create: {
          name: productInput.name,
          slug: productInput.slug,
          categoryId: category.id,
          shortDescription: productInput.shortDescription,
          description: productInput.description,
          images: productInput.images,
          features: productInput.features,
        },
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { name: process.env.ADMIN_NAME || "Administrator", role: "ADMIN", passwordHash: await hashPassword(adminPassword) },
      create: { email: adminEmail, name: process.env.ADMIN_NAME || "Administrator", role: "ADMIN", passwordHash: await hashPassword(adminPassword) },
    });
    console.log(`Seeded admin account: ${adminEmail}`);
  } else {
    console.log("Skipped admin seed. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.");
  }

  console.log("Seeded catalog categories and products.");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
