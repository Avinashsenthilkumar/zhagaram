import { useSyncExternalStore } from "react";

import { siteConfig } from "@/data/site";
import { apiUrl } from "@/lib/api-url";

/**
 * Owner-editable site settings, loaded once from /api/settings and shared by
 * every component that needs them.
 *
 * THIS IS A STORE, NOT A PER-COMPONENT FETCH, AND THAT MATTERS.
 * The first version cached the in-flight promise but gave each component its own
 * `useState` + mount-effect. Saving in /admin/settings cleared the cache, but no
 * component ever re-read it: the effects had already run and would not run
 * again. So the theme switch did nothing until a full page reload, and the same
 * was true of the logo and company name. A module-level store with subscribers
 * fixes it — one fetch, and every reader updates the moment the value changes.
 *
 * `useSyncExternalStore` is the right hook for this: it is SSR-safe through
 * `getServerSnapshot`, which returns the defaults so the server-rendered HTML
 * matches the first client render and hydration stays clean.
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

/**
 * The current value. `getSnapshot` must return a STABLE reference between
 * renders or useSyncExternalStore loops forever, so this is only reassigned
 * when the settings actually change.
 */
let current: SiteSettings = defaultSiteSettings;
let pending: Promise<SiteSettings | null> | null = null;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function publish(next: SiteSettings | null) {
  if (!next) return;
  current = next;
  emit();
}

/** Shared, cached request. Never rejects — a failure means "keep the defaults". */
export function loadSiteSettings(): Promise<SiteSettings | null> {
  if (!pending) {
    pending = fetch(apiUrl("/api/settings"))
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        const value =
          result && (result as { success?: boolean }).success
            ? normalize((result as { data?: unknown }).data)
            : null;
        publish(value);
        return value;
      })
      .catch(() => null);
  }
  return pending;
}

/**
 * Re-read from the API and tell every subscriber.
 * Called by the settings page after a successful save, which is what makes the
 * theme, logo and company name change without a page reload.
 */
export function refreshSiteSettings(): Promise<SiteSettings | null> {
  pending = null;
  return loadSiteSettings();
}

/** Apply a value the caller already has, without a round trip. */
export function setSiteSettings(value: SiteSettings) {
  publish(normalize(value));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Kick the first load off the first time anything subscribes. Later
  // subscribers reuse the cached promise.
  void loadSiteSettings();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SiteSettings {
  return current;
}

function getServerSnapshot(): SiteSettings {
  return defaultSiteSettings;
}

/** Settings for rendering. Always returns something usable, never null. */
export function useSiteSettings(): SiteSettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
