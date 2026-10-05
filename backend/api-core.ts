/**
 * The ZHAGARAM API, with no web framework attached.
 *
 * `handleApiRequest` and `handleEnquiryRequest` only touch `req.method`,
 * `req.url`, `req.headers`, `req.body` and the familiar
 * `res.status().json()` surface, so the same functions serve two hosts:
 *
 *   backend/index.ts            Express, for `npm run dev:api` and any
 *                               long-running Node host
 *   server/routes/api/[...].ts  the Nitro function on Vercel
 *
 * This file MUST NOT import express, cors or compression. It lives outside
 * `server/` on purpose -- see the header of backend/index.ts.
 */
import "dotenv/config";

import { z } from "zod";

import { prisma } from "./db";
import { comparePassword, getAuthUserFromRequest, hashPassword, requireAdmin, signJwt } from "./auth";
import { sendEmail } from "./mailer";

const siteUrl = process.env.APP_URL || process.env.PUBLIC_SITE_URL || "https://zhagaramexim.com";


const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(120),
});

const categorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional().nullable(),
  imageData: z.string().max(12_000_000).optional().nullable(),
  imageMimeType: z.string().optional().nullable(),
});

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180),
  categoryId: z.string().trim().min(1).optional().nullable(),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(10000).optional().nullable(),
  images: z.array(z.string().trim().min(1)).max(20).optional(),
  imageData: z.string().max(12_000_000).optional().nullable(),
  imageMimeType: z.string().optional().nullable(),
  features: z.array(z.string().trim().min(1)).max(50).optional(),
  status: z.string().trim().min(1).max(40).optional(),
});

const reviewSchema = z.object({
  productId: z.string().trim().min(1),

  reviewerName: z
    .string()
    .trim()
    .min(2)
    .max(120),

  rating: z.number().int().min(1).max(5),

  title: z
    .string()
    .trim()
    .min(2)
    .max(120),

  comment: z
    .string()
    .trim()
    .min(10)
    .max(4000),
});
const reviewModerationSchema = z.object({
  status: z.enum(["APPROVED", "DECLINED", "PENDING"]),
});

/** The one and only SiteSetting row. */
const SETTINGS_ID = "singleton";

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

const settingsSchema = z.object({
  companyName: z.string().trim().min(2).max(160).optional(),
  shortName: z.string().trim().min(2).max(120).optional(),
  tagline: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  logoData: z.string().max(12_000_000).optional().nullable(),
  logoMimeType: z.string().optional().nullable(),
  phone: optionalText(60),
  email: optionalText(200),
  address: optionalText(400),
  whatsapp: optionalText(60),
  linkedin: optionalText(300),
  instagram: optionalText(300),
  facebook: optionalText(300),
  theme: z.enum(["light", "dark"]).optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(200),
});

const supplierEnquiryRequestSchema = z.object({
  formType: z.literal("supplier"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  gstNumber: z.string().trim().max(50).optional(),
  product: z.string().trim().max(180).optional(),
  message: z.string().trim().max(5000).optional(),
});

const customerEnquiryRequestSchema = z.object({
  formType: z.literal("customer"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(40),
  company: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  product: z.string().trim().max(180).optional(),
  quantity: z.string().trim().max(120).optional(),
  message: z.string().trim().max(5000).optional(),
});

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 3 * 1024 * 1024;

function validateImage(imageData: string | null | undefined, imageMimeType: string | null | undefined) {
  if (!imageData && !imageMimeType) return { imageData: null, imageMimeType: null };
  if (!imageData || !imageMimeType || !allowedImageMimeTypes.has(imageMimeType)) {
    throw new Error("Images must be JPEG, PNG, or WebP files.");
  }
  const normalized = imageData.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error("Invalid image data.");
  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.length || bytes.length > maxImageBytes) throw new Error("Images must be smaller than 3 MB.");
  return { imageData: normalized, imageMimeType };
}

// SVG is allowed for the logo but not for catalogue images: a logo is a piece of
// brand artwork the owner uploads once, and vector keeps it crisp at every size.
// It is served from our own origin through an <img> tag, where SVG cannot run
// script, so this does not widen the attack surface.
const allowedLogoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

function validateLogo(logoData: string | null | undefined, logoMimeType: string | null | undefined) {
  if (!logoData && !logoMimeType) return { logoData: null, logoMimeType: null };
  if (!logoData || !logoMimeType || !allowedLogoMimeTypes.has(logoMimeType)) {
    throw new Error("The logo must be a JPEG, PNG, WebP or SVG file.");
  }
  const normalized = logoData.replace(/^data:[^;]+;base64,/, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) throw new Error("Invalid logo data.");
  const bytes = Buffer.from(normalized, "base64");
  if (!bytes.length || bytes.length > maxImageBytes) throw new Error("The logo must be smaller than 3 MB.");
  return { logoData: normalized, logoMimeType };
}

/**
 * Read the settings row, creating it on first access.
 *
 * `upsert` rather than `findUnique` so the API never has to answer "no settings
 * exist yet" -- a database that has had the migration but not the seed still
 * serves the schema defaults.
 */
async function getSiteSettings() {
  // Read first. /api/settings is hit by the header on EVERY page, and an
  // unconditional upsert would make that a write against the database on every
  // single page view. The upsert only runs the one time the row is missing.
  const existing = await prisma.siteSetting.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;

  return prisma.siteSetting.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

/**
 * Strip the base64 logo before it goes over the wire and hand back a URL.
 *
 * The URL carries `?v=<updatedAt>` because /api/settings/logo is a fixed path:
 * without the version, a replaced logo would sit behind the browser's
 * `max-age=3600` for an hour and the owner would think the upload failed.
 */
function serializeSettings<T extends { logoMimeType?: string | null; updatedAt?: Date | string }>(settings: T) {
  const { logoData: _logoData, ...rest } = settings as T & { logoData?: string | null };
  const version = settings.updatedAt ? new Date(settings.updatedAt).getTime() : 0;
  return {
    ...rest,
    logo: settings.logoMimeType ? `/api/settings/logo?v=${version}` : null,
  };
}

function imageUrl(imageData: string | null | undefined, imageMimeType: string | null | undefined, legacyImage?: string) {
  if (imageData && imageMimeType) return `data:${imageMimeType};base64,${imageData}`;
  return legacyImage || null;
}

/**
 * `?v=<updatedAt>` on every stored-image URL.
 *
 * The path alone (/api/products/rice/image) never changes, so the only safe
 * cache lifetime was a short one. With the row's updatedAt in the query string,
 * editing a product mints a NEW url, and the old one can be cached for a year
 * by the browser and by Vercel's CDN. That is what takes repeat image requests
 * off the function entirely.
 */
function imageVersion(row: { updatedAt?: Date | string | null }): string {
  if (!row.updatedAt) return "";
  const time = new Date(row.updatedAt).getTime();
  return Number.isFinite(time) ? `?v=${time}` : "";
}

function serializeCategory<T extends object>(category: T, includeImageData = false) {
  const image = category as {
    id?: string;
    slug?: string;
    imageData?: string | null;
    imageMimeType?: string | null;
    updatedAt?: Date | string | null;
  };
  const imageValue = includeImageData
    ? imageUrl(image.imageData, image.imageMimeType)
    : image.imageMimeType && image.slug
      ? `/api/categories/${encodeURIComponent(image.slug)}/image${imageVersion(image)}`
      : null;
  return { ...category, image: imageValue };
}

/**
 * Drop the raw base64 column from a row before it goes over the wire.
 * Responses carry an image URL instead; the bytes are served by
 * /api/products/<slug>/image, which the browser and service worker cache.
 */
function withoutImageData<T extends object>(row: T) {
  const { imageData: _imageData, ...rest } = row as T & { imageData?: string | null };
  return rest;
}

function serializeProduct<T extends object>(product: T, includeImageData = false) {
  const image = product as {
    slug?: string;
    imageData?: string | null;
    imageMimeType?: string | null;
    images?: string[];
    updatedAt?: Date | string | null;
  };
  const firstLegacyImage = image.images?.[0] || null;
  const hasStoredImage = Boolean(image.imageMimeType) || Boolean(firstLegacyImage?.startsWith("data:"));
  const imageValue = includeImageData
    ? imageUrl(image.imageData, image.imageMimeType, firstLegacyImage ?? undefined)
    : image.slug && hasStoredImage
      ? `/api/products/${encodeURIComponent(image.slug)}/image${imageVersion(image)}`
      : firstLegacyImage || null;
  return { ...product, image: imageValue };
}

/**
 * Stored images are addressed with a version (see `imageVersion`), so the bytes
 * behind a given url never change. `s-maxage` is the one that matters on Vercel:
 * it lets the CDN answer repeat requests without invoking the function or
 * touching Postgres at all. No `immutable`, so a missing version still heals
 * itself within the day rather than sticking forever.
 */
const IMAGE_CACHE_CONTROL = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800";

/**
 * Cache policy for a request WITHOUT `?v=`.
 *
 * The year-long policy above is only safe because the url changes when the
 * image does. An unversioned url is a fixed address for changing bytes, so
 * caching it that long would pin a replaced photo for a year with no way to
 * clear it short of renaming the product. Anything arriving without a version
 * -- an old page still in someone's tab, a bookmarked image, a call site whose
 * query forgot to select updatedAt -- gets five minutes instead.
 */
const UNVERSIONED_IMAGE_CACHE_CONTROL = "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

/** Public JSON the CDN may hold briefly. Never used for admin or auth routes. */
function cacheJson(res: any, seconds: number) {
  res.setHeader("Cache-Control", `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=300`);
}

function sendStoredImage(
  res: any,
  imageData: string | null | undefined,
  imageMimeType: string | null | undefined,
  legacyImage?: string,
  versioned = false,
) {
  const cacheControl = versioned ? IMAGE_CACHE_CONTROL : UNVERSIONED_IMAGE_CACHE_CONTROL;
  if (!imageData && legacyImage?.startsWith("data:")) {
    const match = legacyImage.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      res.setHeader("Content-Type", match[1]);
      res.setHeader("Cache-Control", cacheControl);
      return res.status(200).send(Buffer.from(match[2], "base64"));
    }
  }

  if (!imageData || !imageMimeType) {
    if (legacyImage && !legacyImage.startsWith("data:")) return res.redirect(302, legacyImage);
    return res.status(404).end();
  }

  const normalized = imageData.replace(/^data:[^;]+;base64,/, "");
  res.setHeader("Content-Type", imageMimeType);
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("Content-Length", String(Buffer.byteLength(normalized, "base64")));
  return res.status(200).send(Buffer.from(normalized, "base64"));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function enquiryNotificationEmail(body: Record<string, string>, isSupplierForm: boolean) {
  const field = (label: string, value?: string) => value ? `<tr><td style="padding:12px;background:#f7faf8;color:#6b7280;font-size:12px;width:34%;">${label}</td><td style="padding:12px;color:#123d2b;font-size:13px;font-weight:600;word-break:break-word;">${escapeHtml(value)}</td></tr>` : "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head><body style="margin:0;padding:0;background:#f3f6f4;font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f4;"><tr><td align="center" style="padding:40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e3ebe6;border-radius:18px;overflow:hidden;"><tr><td style="padding:28px 32px;border-bottom:1px solid #edf1ee;"><div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#9b7b18;text-transform:uppercase;">ZHAGARAM EXIM LLP</div><div style="font-size:23px;font-weight:700;color:#123d2b;line-height:1.3;margin-top:6px;">New ${isSupplierForm ? "Supplier" : "Customer"} Enquiry <span style="float:right;font-size:10px;padding:7px 11px;border-radius:30px;background:${isSupplierForm ? "#eaf5ef" : "#fff7df"};color:${isSupplierForm ? "#075333" : "#8a6812"};">${isSupplierForm ? "SUPPLIER" : "CUSTOMER"}</span></div></td></tr><tr><td style="height:4px;background:#c9a227;font-size:0;">&nbsp;</td></tr><tr><td style="padding:32px 32px 20px;"><div style="display:inline-block;padding:6px 11px;background:#eaf5ef;color:#075333;border-radius:30px;font-size:10px;font-weight:700;letter-spacing:.8px;">WEBSITE ENQUIRY</div><div style="font-size:27px;font-weight:700;line-height:1.25;color:#123d2b;margin-top:14px;">${escapeHtml(body.name)}</div><p style="color:#6b7280;font-size:14px;line-height:1.7;">A new enquiry has been submitted through the ZHAGARAM EXIM website.</p></td></tr><tr><td style="padding:8px 32px 12px;"><div style="color:#075333;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">Contact Information</div><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2ebe5;border-radius:12px;">${field("Name", body.name)}${field("Company", body.company)}${field("Email", body.email)}${field("Phone", body.phone || "N/A")}${field("Country", body.country)}${field("GST Number", body.gstNumber)}</table></td></tr><tr><td style="padding:20px 32px 12px;"><div style="color:#075333;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">Product Details</div><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2ebe5;border-radius:12px;">${field("Product", body.product)}${field("Quantity", body.quantity)}</table></td></tr><tr><td style="padding:20px 32px 28px;"><div style="color:#075333;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px;">Message</div><div style="padding:18px;background:#f8faf9;border:1px solid #e2ebe5;border-left:4px solid #c9a227;border-radius:12px;color:#374151;font-size:14px;line-height:1.8;word-break:break-word;">${escapeHtml(body.message).replaceAll("\n", "<br />")}</div></td></tr><tr><td style="padding:24px 32px;background:#f5f8f6;border-top:1px solid #e5ece8;"><a href="mailto:${escapeHtml(body.email)}" style="display:inline-block;padding:13px 20px;background:#075333;color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:700;">Reply by Email</a></td></tr><tr><td align="center" style="padding:26px 32px;background:#092f20;color:#ffffff;"><strong>ZHAGARAM EXIM LLP</strong><div style="margin-top:7px;color:#b7c8bf;font-size:12px;">From Indian roots to global routes.</div><div style="margin-top:12px;color:#71877c;font-size:10px;">Website Enquiry Notification</div></td></tr></table></td></tr></table></body></html>`;
}

function enquiryConfirmationEmail(body: Record<string, string>) {
  return `<div style="margin:0;padding:40px 16px;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937;"><div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5ebe7;box-shadow:0 8px 30px rgba(16,37,27,0.08);"><div style="padding:28px 32px;background:#ffffff;border-bottom:1px solid #edf1ee;text-align:center;"><img src="${siteUrl}/logo.png" alt="ZHAGARAM EXIM LLP" style="display:block;width:180px;max-width:100%;height:auto;margin:0 auto;" /></div><div style="padding:36px 32px;"><div style="display:inline-block;padding:7px 12px;background:#eaf5ef;color:#075333;border-radius:999px;font-size:12px;font-weight:bold;letter-spacing:.5px;margin-bottom:18px;">ENQUIRY RECEIVED</div><h1 style="margin:0 0 14px;color:#123d2b;font-size:28px;line-height:1.25;">Thank you, ${escapeHtml(body.name)}!</h1><p style="margin:0 0 18px;color:#4b5563;font-size:15px;line-height:1.8;">Thank you for contacting <strong style="color:#075333;">ZHAGARAM EXIM LLP</strong>. We have successfully received your enquiry.</p><p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.8;">Our team will review your requirements and get back to you shortly.</p><div style="background:#f7faf8;border:1px solid #e2ebe5;border-radius:14px;padding:22px;"><h2 style="margin:0 0 18px;color:#123d2b;font-size:17px;">Enquiry Summary</h2><table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;"><tr><td style="padding:9px 0;color:#6b7280;width:42%;">Product</td><td style="padding:9px 0;color:#123d2b;font-weight:600;">${escapeHtml(body.product)}</td></tr>${body.quantity ? `<tr><td style="padding:9px 0;color:#6b7280;">Quantity</td><td style="padding:9px 0;color:#123d2b;font-weight:600;">${escapeHtml(body.quantity)}</td></tr>` : ""}</table></div><div style="margin-top:24px;padding:18px 20px;background:#fff9e8;border-left:4px solid #d4a72c;border-radius:8px;"><p style="margin:0;color:#5f512b;font-size:14px;line-height:1.7;"><strong>What happens next?</strong><br />Our team will review your enquiry and contact you with the relevant information and next steps.</p></div><p style="margin:30px 0 0;color:#4b5563;font-size:14px;line-height:1.7;">Best regards,<br /><strong style="color:#075333;">ZHAGARAM EXIM LLP</strong></p></div><div style="padding:20px 32px;background:#0b2f20;text-align:center;color:#ffffff;font-size:13px;"><strong>From Indian Roots to Global Routes</strong><p style="margin:7px 0 0;color:#b8c9c0;font-size:11px;">This is an automated confirmation email. Please do not reply to this message.</p></div></div></div>`;
}

function setAuthCookie(res: any, token: string) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = production ? "None" : "Lax";
  const secure = production ? " Secure;" : "";
  res.setHeader("Set-Cookie", `token=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=604800; SameSite=${sameSite};${secure}`);
}

function clearAuthCookie(res: any) {
  const production = process.env.NODE_ENV === "production";
  const sameSite = production ? "None" : "Lax";
  const secure = production ? " Secure;" : "";
  res.setHeader("Set-Cookie", `token=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite};${secure}`);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicUser(user: { id: string; email: string; name: string | null; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

const publicCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageMimeType: true,
  // Carried so the image URL can include ?v=<updatedAt>. That version is what
  // lets the CDN cache the bytes for a year: a replaced image gets a new URL
  // rather than waiting out a max-age.
  updatedAt: true,
} as const;

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  categoryId: true,
  shortDescription: true,
  description: true,
  imageMimeType: true,
  features: true,
  status: true,
  updatedAt: true,
} as const;

async function findProduct(identifier: string) {
  return prisma.product.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    select: {
      ...publicProductSelect,
      category: { select: publicCategorySelect },
    },
  });
}

async function findCategory(identifier: string) {
  return prisma.category.findFirst({
    where: { OR: [{ id: identifier }, { slug: identifier }] },
    select: {
      ...publicCategorySelect,
      products: {
        orderBy: { createdAt: "desc" },
        select: publicProductSelect,
      },
    },
  });
}

function approvedReviewInclude() {
  return {
    user: { select: { id: true, name: true } },
  } as const;
}

export async function handleApiRequest(req: any, res: any) {
  const url = new URL(req.originalUrl || req.url || "/", "http://localhost");
  const path = url.pathname.replace(/\/$/, "") || "/";
  const method = String(req.method || "GET").toUpperCase();

  // Default to "never cache". The public catalogue routes opt back in with
  // cacheJson(); everything touching a session or the admin panel must not be
  // held by a browser or, far worse, by the shared CDN -- one admin's dashboard
  // served to the next visitor is exactly the bug this prevents.
  if (path.startsWith("/api/admin") || path.startsWith("/api/auth")) {
    res.setHeader("Cache-Control", "no-store, private");
  }

  // Whether this image request carries the ?v=<updatedAt> that makes a long
  // cache safe. See UNVERSIONED_IMAGE_CACHE_CONTROL.
  const hasVersion = Boolean(url.searchParams.get("v"));

  if (path === "/api/health" && method === "GET") {
    return res.status(200).json({ success: true, message: "API is running" });
  }

  if (path === "/api/auth/register" && method === "POST") {
    const payload = registerSchema.parse(req.body ?? {});
    const email = normalizeEmail(payload.email);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const user = await prisma.user.create({
      data: { email, name: payload.name, passwordHash: await hashPassword(payload.password) },
      select: { id: true, email: true, name: true, role: true },
    });
    setAuthCookie(res, signJwt({ userId: user.id, role: user.role }));
    return res.status(201).json({ success: true, data: { user: publicUser(user) } });
  }

  if (path === "/api/auth/login" && method === "POST") {
    const payload = loginSchema.parse(req.body ?? {});
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(payload.email) } });

    if (!user?.passwordHash || !(await comparePassword(payload.password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    setAuthCookie(res, signJwt({ userId: user.id, role: user.role }));
    return res.status(200).json({ success: true, data: { user: publicUser(user) } });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, data: { loggedOut: true } });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = await getAuthUserFromRequest(req);
    return user
      ? res.status(200).json({ success: true, data: { user: publicUser(user) } })
      : res.status(401).json({ success: false, message: "Unauthorized." });
  }

  // ---- Site settings -------------------------------------------------------
  // Public read: the header, footer and contact page render from this.
  if (path === "/api/settings" && method === "GET") {
    const settings = await getSiteSettings();
    // Shorter than the catalogue: the owner expects a saved logo or phone number
    // to show up on the live site quickly.
    cacheJson(res, 30);
    return res.status(200).json({ success: true, data: serializeSettings(settings) });
  }

  if (path === "/api/settings/logo" && method === "GET") {
    const settings = await getSiteSettings();
    return sendStoredImage(res, settings.logoData, settings.logoMimeType, undefined, hasVersion);
  }

  if (path === "/api/admin/settings" && method === "GET") {
    await requireAdmin(req);
    const settings = await getSiteSettings();
    return res.status(200).json({ success: true, data: serializeSettings(settings) });
  }

  if (path === "/api/admin/settings" && method === "PATCH") {
    await requireAdmin(req);
    const payload = settingsSchema.parse(req.body ?? {});
    // Only touch the logo columns when the client actually sent one, so saving
    // the contact details does not wipe the uploaded logo.
    const logo =
      payload.logoData !== undefined || payload.logoMimeType !== undefined
        ? validateLogo(payload.logoData, payload.logoMimeType)
        : {};
    const { logoData: _logoData, logoMimeType: _logoMimeType, ...rest } = payload;

    // The form posts "" for a cleared optional field. Store NULL instead, so
    // "not set" is one value in the database rather than two.
    const cleaned = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, value === "" ? null : value]),
    ) as typeof rest;

    await getSiteSettings();
    const settings = await prisma.siteSetting.update({
      where: { id: SETTINGS_ID },
      data: { ...cleaned, ...logo },
    });
    return res.status(200).json({ success: true, data: serializeSettings(settings) });
  }

  if (path === "/api/admin/password" && method === "POST") {
    const admin = await requireAdmin(req);
    const payload = passwordChangeSchema.parse(req.body ?? {});
    const record = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { passwordHash: true },
    });

    // Re-check the current password even though the caller is already
    // authenticated: a session left open on a shared machine must not be enough
    // to take the account over.
    if (!record?.passwordHash || !(await comparePassword(payload.currentPassword, record.passwordHash))) {
      return res.status(401).json({ success: false, message: "Your current password is not correct." });
    }

    if (payload.currentPassword === payload.newPassword) {
      return res.status(400).json({ success: false, message: "The new password must be different from the current one." });
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(payload.newPassword) },
    });
    return res.status(200).json({ success: true, data: { updated: true } });
  }
  // ---- end site settings ---------------------------------------------------

  if (path === "/api/categories" && method === "GET") {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: publicCategorySelect,
    });
    cacheJson(res, 60);
    return res.status(200).json({ success: true, data: categories.map((category) => serializeCategory(category)) });
  }

  if (path === "/api/testimonials" && method === "GET") {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED", product: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        rating: true,
        comment: true,
        title: true,
        reviewerName: true,
        user: { select: { name: true } },
        product: { select: { name: true } },
      },
    });
    cacheJson(res, 60);
    return res.status(200).json({
      success: true,
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        content: review.comment,
        name: review.reviewerName || review.user?.name || "Verified customer",
        role: "Verified customer",
        productName: review.product?.name || undefined,
      })),
    });
  }

  if (path.startsWith("/api/categories/") && path.endsWith("/image") && method === "GET") {
    const identifier = path.slice("/api/categories/".length, -"/image".length);
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }] },
      select: { imageData: true, imageMimeType: true },
    });
    return category
      ? sendStoredImage(res, category.imageData, category.imageMimeType, undefined, hasVersion)
      : res.status(404).end();
  }

  if (path.startsWith("/api/categories/") && method === "GET") {
    const category = await findCategory(path.slice("/api/categories/".length));
    return category
      ? res.status(200).json({ success: true, data: { ...serializeCategory(category), products: category.products.map((product) => serializeProduct(product)) } })
      : res.status(404).json({ success: false, message: "Category not found." });
  }

  if (path === "/api/products" && method === "GET") {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: publicProductSelect,
    });
    cacheJson(res, 60);
    return res.status(200).json({ success: true, data: products.map((product) => serializeProduct(product)) });
  }

  if (path.startsWith("/api/products/") && path.endsWith("/image") && method === "GET") {
    const identifier = path.slice("/api/products/".length, -"/image".length);
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: identifier }, { slug: identifier }], status: "ACTIVE" },
      select: { imageData: true, imageMimeType: true, images: true },
    });
    return product
      ? sendStoredImage(res, product.imageData, product.imageMimeType, product.images?.[0], hasVersion)
      : res.status(404).end();
  }

  if (path.startsWith("/api/products/") && !path.endsWith("/reviews") && method === "GET") {
    const identifier = path.slice("/api/products/".length);
    const product = await findProduct(identifier);

    if (!product || product.status !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: approvedReviewInclude(),
    });
    return res.status(200).json({ success: true, data: { ...serializeProduct(product), category: product.category ? serializeCategory(product.category) : null, reviews } });
  }

  if (path.startsWith("/api/products/") && path.endsWith("/reviews") && method === "GET") {
    const identifier = path.slice("/api/products/".length, -"/reviews".length);
    const product = await findProduct(identifier);
    if (!product || product.status !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: approvedReviewInclude(),
    });
    return res.status(200).json({ success: true, data: reviews });
  }

  if (path.startsWith("/api/products/") && path.endsWith("/reviews") && method === "POST") {
    // Authentication is optional for reviews.
    // Logged-in users keep the existing duplicate-pending protection.
    // Guest users are stored with userId = null.
    const user = await getAuthUserFromRequest(req);

    const identifier = path.slice("/api/products/".length, -"/reviews".length);
    const product = await findProduct(identifier);

    if (!product || product.status !== "ACTIVE") {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const payload = reviewSchema.parse({
      ...(req.body ?? {}),
      productId: product.id,
    });

    if (user) {
      const existingPending = await prisma.review.findFirst({
        where: {
          productId: product.id,
          userId: user.id,
          status: "PENDING",
        },
        select: { id: true },
      });

      if (existingPending) {
        return res.status(409).json({
          success: false,
          message: "You already have a review waiting for approval.",
        });
      }
    }

    const review = user
  ? await prisma.review.create({
      data: {
        ...payload,
        userId: user.id,
      },
    })
  : await prisma.review.create({
      data: {
        ...payload,
      },
    });
    return res.status(201).json({
      success: true,
      data: review,
      message: "Review submitted for approval.",
    });
  }

  if (path === "/api/admin/dashboard" && method === "GET") {
    await requireAdmin(req);
    const [categories, products, reviews, pendingReviews, approvedReviews, declinedReviews] = await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.review.count(),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.review.count({ where: { status: "DECLINED" } }),
    ]);
    return res.status(200).json({ success: true, data: { categories, products, reviews, pendingReviews, approvedReviews, declinedReviews } });
  }

  if (path === "/api/admin/categories" && method === "GET") {
    await requireAdmin(req);
    // PERF: never select `imageData`. It is a base64 blob of up to 3 MB per
    // row, and sending it made the admin list grow to tens of megabytes. The
    // admin UI only needs a URL to render a thumbnail, exactly like the public
    // site, so `serializeCategory(..., false)` returns
    // `/api/categories/<slug>/image` and the browser caches it.
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageMimeType: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({ success: true, data: categories.map((category) => serializeCategory(category)) });
  }

  if (path === "/api/admin/products" && method === "GET") {
    await requireAdmin(req);
    // PERF: same as categories above -- `include: { category: true }` pulled
    // every column of both tables, including two base64 image blobs per row.
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        shortDescription: true,
        description: true,
        images: true,
        imageMimeType: true,
        features: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true, slug: true, imageMimeType: true },
        },
      },
    });
    return res.status(200).json({ success: true, data: products.map((product) => serializeProduct(product)) });
  }

  if (path === "/api/admin/categories" && method === "POST") {
    await requireAdmin(req);
    const payload = categorySchema.parse(req.body ?? {});
    const image = payload.imageData !== undefined || payload.imageMimeType !== undefined
      ? validateImage(payload.imageData, payload.imageMimeType)
      : {};
    const item = await prisma.category.create({ data: { ...payload, ...image } });
    // PERF: strip the base64 before responding -- the client never reads it.
    return res.status(201).json({ success: true, data: withoutImageData(serializeCategory(item)) });
  }

  if (path.startsWith("/api/admin/categories/") && ["PATCH", "DELETE"].includes(method)) {
    await requireAdmin(req);
    const id = path.slice("/api/admin/categories/".length);
    const payload = categorySchema.partial().parse(req.body ?? {});
    const image = payload.imageData !== undefined || payload.imageMimeType !== undefined
      ? validateImage(payload.imageData, payload.imageMimeType)
      : {};
    const item = method === "PATCH"
      ? await prisma.category.update({ where: { id }, data: { ...payload, ...image } })
      : await prisma.category.delete({ where: { id } });
    return res.status(200).json({ success: true, data: method === "PATCH" ? withoutImageData(serializeCategory(item)) : { deleted: true } });
  }

  if (path === "/api/admin/products" && method === "POST") {
    await requireAdmin(req);
    const payload = productSchema.parse(req.body ?? {});
    const image = validateImage(payload.imageData, payload.imageMimeType);
    const item = await prisma.product.create({ data: { ...payload, ...image, categoryId: payload.categoryId || null, images: payload.images ?? [], features: payload.features ?? [] } });
    return res.status(201).json({ success: true, data: withoutImageData(serializeProduct(item)) });
  }

  if (path.startsWith("/api/admin/products/") && ["PATCH", "DELETE"].includes(method)) {
    await requireAdmin(req);
    const id = path.slice("/api/admin/products/".length);
    const payload = productSchema.partial().parse(req.body ?? {});
    const image = payload.imageData !== undefined || payload.imageMimeType !== undefined
      ? validateImage(payload.imageData, payload.imageMimeType)
      : {};
    const item = method === "PATCH"
      ? await prisma.product.update({ where: { id }, data: { ...payload, ...image } })
      : await prisma.product.delete({ where: { id } });
    return res.status(200).json({ success: true, data: method === "PATCH" ? withoutImageData(serializeProduct(item)) : { deleted: true } });
  }


  if (path === "/api/admin/reviews" && method === "GET") {
    await requireAdmin(req);
    const status = url.searchParams.get("status");
    const reviews = await prisma.review.findMany({
      where: status ? { status: z.enum(["PENDING", "APPROVED", "DECLINED"]).parse(status) } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        // `imageMimeType` is what tells us a product has an image stored in the
        // database. Selecting only `images` meant every product uploaded through
        // the admin panel (which writes imageData/imageMimeType, not `images`)
        // showed a letter placeholder instead of its thumbnail.
        product: { select: { id: true, name: true, slug: true, images: true, imageMimeType: true, updatedAt: true } },
      },
    });
    const serializedReviews = reviews.map((review) => ({
      ...review,
      product: review.product ? serializeProduct(review.product) : null,
    }));
    return res.status(200).json({ success: true, data: serializedReviews });
  }

  if (path.startsWith("/api/admin/reviews/") && path.endsWith("/status") && method === "PATCH") {
    const admin = await requireAdmin(req);
    const id = path.slice("/api/admin/reviews/".length, -"/status".length);
    const payload = reviewModerationSchema.parse(req.body ?? {});
    const review = await prisma.review.update({ where: { id }, data: {
      status: payload.status,
      reviewedAt: payload.status === "PENDING" ? null : new Date(),
      reviewedBy: payload.status === "PENDING" ? null : admin.id,
    } });
    return res.status(200).json({ success: true, data: review });
  }

  if (path.startsWith("/api/admin/reviews/") && method === "PATCH") {
    const admin = await requireAdmin(req);
    const id = path.slice("/api/admin/reviews/".length);
    const payload = reviewModerationSchema.parse(req.body ?? {});
    const review = await prisma.review.update({ where: { id }, data: {
      status: payload.status,
      reviewedAt: payload.status === "PENDING" ? null : new Date(),
      reviewedBy: payload.status === "PENDING" ? null : admin.id,
    } });
    return res.status(200).json({ success: true, data: review });
  }

  if (path.startsWith("/api/admin/reviews/") && method === "DELETE") {
    await requireAdmin(req);
    const id = path.slice("/api/admin/reviews/".length);
    await prisma.review.delete({ where: { id } });
    return res.status(200).json({ success: true, data: { deleted: true } });
  }

  return null;
}

export async function handleEnquiryRequest(req: any, res: any) {
  if (req.method && req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const rawBody = req.body ?? {};
  const formType = rawBody.formType;
  const parsed = formType === "supplier"
    ? supplierEnquiryRequestSchema.safeParse(rawBody)
    : formType === "customer"
      ? customerEnquiryRequestSchema.safeParse(rawBody)
      : null;

  if (!parsed || !parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Please check the enquiry details and try again.",
    });
  }

  const body = parsed.data;
  const isSupplierForm = body.formType === "supplier";
  if (!process.env.MAIL_TO) {
    // Name the variable in the LOG, not in the response: the visitor cannot act
    // on it and it tells a stranger how the deployment is wired.
    console.error("Enquiry rejected: MAIL_TO is not configured.");
    return res.status(500).json({
      success: false,
      message: "Enquiries are not configured to be delivered yet. Please contact us directly.",
    });
  }

  const subject = isSupplierForm ? `New Supplier Enquiry - ${body.product}` : `New Customer Enquiry - ${body.product}`;
  const enquiryHtml = enquiryNotificationEmail(body, isSupplierForm);

  try {
    await sendEmail({
      to: process.env.MAIL_TO,
      subject,
      html: enquiryHtml,
    });

    // The internal notification is the source-of-truth delivery. A failure in
    // the optional customer confirmation must not make a successfully received
    // enquiry look like a failed submission to the website visitor.
    try {
      await sendEmail({
        to: body.email,
        subject: "Thank you for contacting ZHAGARAM EXIM LLP",
        html: enquiryConfirmationEmail(body),
      });
    } catch (confirmationError) {
      console.error("Enquiry confirmation email error", confirmationError);
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry submitted successfully.",
    });
  } catch (error) {
    console.error("Enquiry submission error", error);

    // Pass the mail provider's own reason through. These messages are about the
    // SITE's configuration, not the visitor's data, and they are what turns
    // "mail is not working" into a one-minute fix instead of a log hunt.
    const detail = error instanceof Error ? error.message : "";
    const isProviderMessage = /resend|domain|verify|testing emails|api key|from address/i.test(detail);

    return res.status(500).json({
      success: false,
      message: isProviderMessage
        ? `Email could not be sent: ${detail}`
        : "Something went wrong while sending the enquiry.",
    });
  }
}
