import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { LogoSpinner } from "@/components/common/LogoSpinner";
import {
  officeAddress,
  officeAddressLine,
  officeMapEmbedUrl,
  officeMapsUrl,
} from "@/data/site";

/**
 * Real Google map for the office.
 *
 * The iframe is only mounted once the block scrolls into view. A Google Maps
 * embed pulls roughly a megabyte of scripts and tiles, so loading it eagerly
 * would undo the image work elsewhere on the site.
 */
export function ContactMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // No IntersectionObserver (very old browsers): just show it.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-border)]">
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-grid size-10 shrink-0 place-items-center rounded-xl bg-[#0B2D5B]/10 text-[#0B2D5B]">
            <MapPin className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Our office
            </p>
            <address className="mt-1.5 text-sm not-italic leading-relaxed text-foreground" data-selectable>
              {officeAddress.line1},<br />
              {officeAddress.line2},<br />
              {officeAddress.city}, {officeAddress.district} - {officeAddress.postalCode}
              <br />
              {officeAddress.state}, {officeAddress.country}
            </address>
          </div>
        </div>

        <a
          href={officeMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B2D5B] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1E4A8A]"
        >
          Get directions
          <ExternalLink className="size-4" />
        </a>
      </div>

      <div ref={containerRef} className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
        {!loaded ? (
          <div className="absolute inset-0 grid place-items-center bg-[#eef2f7]">
            <LogoSpinner size="md" label="Loading map" />
          </div>
        ) : null}

        {inView ? (
          <iframe
            src={officeMapEmbedUrl}
            title={`Map showing ${officeAddressLine}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 size-full border-0"
          />
        ) : null}
      </div>
    </div>
  );
}
