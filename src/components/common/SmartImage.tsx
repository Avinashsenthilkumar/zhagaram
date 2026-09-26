import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Image with a shimmer placeholder, native lazy loading and a graceful
 * fallback.
 *
 * Product and category pictures are served out of the database, so they are
 * the slowest thing on any page. Three things matter here:
 *
 *  - `loading="lazy"` so off-screen images never compete with the hero.
 *  - `decoding="async"` so decoding a large JPEG doesn't block the main thread.
 *  - fixed `width`/`height` so the browser reserves the space and the page
 *    doesn't jump around as pictures arrive (layout shift).
 *
 * Pass `priority` for the one image that is visible immediately — usually a
 * page hero — which swaps lazy loading for eager, high-priority fetching.
 */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  width = 800,
  height = 600,
  priority = false,
  fallback = "Image unavailable",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fallback?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid size-full place-items-center bg-[#edf4ee] text-sm text-[#52715d]",
          wrapperClassName,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={cn("relative size-full overflow-hidden", wrapperClassName)}>
      {!loaded ? <div className="img-skeleton absolute inset-0" aria-hidden="true" /> : null}

      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        // @ts-expect-error fetchpriority is valid HTML; React types lag behind
        fetchpriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}
