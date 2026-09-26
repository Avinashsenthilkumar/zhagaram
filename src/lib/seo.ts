import { siteConfig } from "@/data/site";
import type { FAQ } from "@/types/faq";
import type { Product } from "@/types/product";

/**
 * Structured data requires ABSOLUTE urls. `image` and breadcrumb `item` were
 * emitting site-relative paths ("/products/rice", "/api/products/rice/image"),
 * which search engines discard -- so the rich results this markup exists for
 * were never eligible.
 */
const siteOrigin = siteConfig.url.replace(/\/+$/, "");

function absoluteUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  return `${siteOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteOrigin,
    description: siteConfig.description,
    slogan: siteConfig.tagline,
    areaServed: "Worldwide",
  };
}

export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.shortDescription,
    image: absoluteUrl(product.image),
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
