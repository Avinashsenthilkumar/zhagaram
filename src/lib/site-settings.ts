import { useEffect, useState } from "react";

import { siteConfig } from "@/data/site";
import { apiUrl } from "@/lib/api-url";

/**
 * Owner-editable site settings, loaded from /api/settings.
 *
 * WHY A CLIENT-SIDE FETCH RATHER THAN THE SSR LOADER
 * --------------------------------------------------
 * The header and footer render on every page, including ones with no loader of
 * their own. Fetching in the component keeps the first server-rendered HTML
 * identical to the first client render (both use `siteConfig`), so there is no
 * hydration mismatch, and the real values swap in a moment later. The trade-off
 * is a brief flash of the built-in name on a cold load; the alternative was
 * threading settings through every route's loader.
 *
 * The in-flight promise is cached at module scope so the header, the footer and
 * the contact page share ONE request instead of three.
 */
export type SiteSettings = {
  companyName: string;
  shortName: string;
  tagline: string;
  description: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  theme: "light" | "dark";
};

/** What the app shows before (or instead of) anything the owner has saved. */
export const defaultSiteSettings: SiteSettings = {
  companyName: siteConfig.name,
  shortName: siteConfig.shortName,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  logo: null,
  phone: null,
  email: null,
  address: null,
  whatsapp: null,
  linkedin: null,
  instagram: null,
  facebook: null,
  theme: "light",
};

let pending: Promise<SiteSettings | null> | null = null;

function normalize(value: unknown): SiteSettings {
  const raw = (value ?? {}) as Partial<SiteSettings>;
  const text = (input: unknown, fallback: string) =>
    typeof input === "string" && input.trim() ? input : fallback;
  const optional = (input: unknown) =>
    typeof input === "string" && input.trim() ? input : null;

  return {
    companyName: text(raw.companyName, defaultSiteSettings.companyName),
    shortName: text(raw.shortName, defaultSiteSettings.shortName),
    tagline: text(raw.tagline, defaultSiteSettings.tagline),
    description: text(raw.description, defaultSiteSettings.description),
    logo: optional(raw.logo),
    phone: optional(raw.phone),
    email: optional(raw.email),
    address: optional(raw.address),
    whatsapp: optional(raw.whatsapp),
    linkedin: optional(raw.linkedin),
    instagram: optional(raw.instagram),
    facebook: optional(raw.facebook),
    theme: raw.theme === "dark" ? "dark" : "light",
  };
}

/** Shared, cached request. Never rejects — a failure means "use the defaults". */
export function loadSiteSettings(): Promise<SiteSettings | null> {
  if (!pending) {
    pending = fetch(apiUrl("/api/settings"))
      .then((response) => (response.ok ? response.json() : null))
      .then((result) =>
        result && (result as { success?: boolean }).success
          ? normalize((result as { data?: unknown }).data)
          : null,
      )
      .catch(() => null);
  }
  return pending;
}

/**
 * Drop the cache so the next read hits the API.
 * Called by the settings page after a successful save.
 */
export function refreshSiteSettings(): Promise<SiteSettings | null> {
  pending = null;
  return loadSiteSettings();
}

/** Settings for rendering. Always returns something usable, never null. */
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    let active = true;
    void loadSiteSettings().then((value) => {
      if (active && value) setSettings(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return settings;
}
