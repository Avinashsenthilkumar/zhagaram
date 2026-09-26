import { siteConfig } from "@/data/site";

export function pageTitle(title?: string) {
  if (!title) return `${siteConfig.name} — ${siteConfig.tagline}`;
  return `${title} | ${siteConfig.name}`;
}

export function pageDescription(description?: string) {
  return description ?? siteConfig.description;
}
