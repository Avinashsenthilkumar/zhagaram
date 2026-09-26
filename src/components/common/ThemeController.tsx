import { useEffect } from "react";

import { useSiteSettings } from "@/lib/site-settings";

/**
 * Applies the owner's theme choice from /admin/settings to the document.
 *
 * Renders nothing. It sets BOTH markers on <html>:
 *
 *   data-theme="dark"  read by the plain-CSS overrides in src/styles.css
 *   class="dark"       read by Tailwind's `dark:` variant
 *
 * Two markers rather than one because the admin console is written with
 * hard-coded hex utilities that no Tailwind variant can reach, while new work
 * should be able to use `dark:` normally.
 *
 * The class is applied in an effect, not during render, so the server-rendered
 * HTML and the first client render match and hydration stays clean. The cost is
 * a brief light flash on a cold load for a dark-theme owner; the alternative —
 * a blocking inline script in the document head — is not worth it for a setting
 * only the admin sees.
 */
export function ThemeController() {
  const settings = useSiteSettings();
  const theme = settings.theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    } else {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
