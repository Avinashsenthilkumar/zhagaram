import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/lib/site-settings";

/**
 * Brand lockup: the mark on top, the company name centred underneath.
 *
 * The name is real text rather than part of the image, so it stays sharp on
 * every screen, scales with the layout, and is readable to search engines and
 * screen readers.
 */
export function Logo({
  tone = "dark",
  compact = false,
  showName = true,
}: {
  tone?: "dark" | "light";
  compact?: boolean;
  showName?: boolean;
}) {
  // Name and mark come from the owner's settings (/admin/settings) and fall back
  // to the values built into src/data/site.ts until something is saved.
  const settings = useSiteSettings();
  const name = settings.companyName;
  const logoSrc = settings.logo ?? "/logo.png";

  return (
    <Link
      to="/"
      className="group flex flex-col items-center gap-1 rounded-sm border-0 text-center outline-none focus-visible:outline-none"
      aria-label={`${name} home`}
    >
      <img
        src={logoSrc}
        alt={name}
        width={720}
        height={595}
        // The header logo is the first thing painted, so it must not be lazy.
        loading="eager"
        decoding="sync"
        // @ts-expect-error fetchpriority is valid HTML, React types lag behind
        fetchpriority="high"
        className={cn(
          "w-auto max-w-none border-0 object-contain outline-none",
          "transition-transform duration-300 group-hover:scale-[1.03]",
          compact
            ? "h-9 sm:h-10 lg:h-11"
            : "h-10 sm:h-11 lg:h-12 xl:h-[3.25rem]",
        )}
      />

      {showName ? (
        <span
          className={cn(
            "whitespace-nowrap font-semibold leading-none tracking-[0.18em]",
            compact
              ? "text-[0.5rem] sm:text-[0.55rem]"
              : "text-[0.55rem] sm:text-[0.6rem] lg:text-[0.68rem]",
            // The brand navy, the same #0B2D5B used by the theme, the PWA
            // splash and the bottom tab bar. `light` stays white for dark headers.
            tone === "light" ? "text-white" : "text-[#0B2D5B]",
          )}
        >
          {name}
        </span>
      ) : null}
    </Link>
  );
}
