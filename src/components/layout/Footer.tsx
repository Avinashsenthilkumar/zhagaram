import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { footerColumns, footerCopy } from "@/data/footer";
import { cachedJson } from "@/lib/api-cache";
import { useSiteSettings } from "@/lib/site-settings";

type FooterCategory = { id: string; name: string; slug: string };

export function Footer() {
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const settings = useSiteSettings();

  useEffect(() => {
    let active = true;
    void cachedJson<{ success: boolean; data?: FooterCategory[] }>("/api/categories")
      .then((result) => { if (active && result.success) setCategories(result.data ?? []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const dynamicColumns = footerColumns.map((column) => {
    if (column.title !== "Products") return column;
    return {
      ...column,
      links: [
        { label: "All products", href: "/products" },
        ...(categories.length ? categories.map((category) => ({ label: category.name, href: `/products?category=${encodeURIComponent(category.slug)}` })) : column.links.slice(1)),
      ],
    };
  });

  return (
    <footer className="bg-primary-dark text-primary-foreground">
      {/*
        The footer used to be `py-4` top and bottom at every width, which on a
        phone squeezed the logo, four link columns and the legal line into a
        cramped band. It now gets real vertical rhythm, and on mobile it clears
        the fixed bottom tab bar instead of hiding its last line underneath it.
      */}
      <Container className="px-safe pb-[calc(2.5rem_+_var(--tabbar-offset))] pt-12 sm:pb-12 sm:pt-14 lg:pb-14">
        <div className="grid gap-10 sm:gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div className="min-w-0">
            <Link to="/" aria-label="Home" className="inline-flex items-center">
              <img
                loading="lazy"
                decoding="async"
                src={settings.logo ?? "/logo.png"}
                alt={settings.companyName}
                data-plain
                className="h-14 w-auto max-w-[12rem] rounded-sm bg-white object-contain sm:h-16 sm:max-w-[14rem]"
              />
            </Link>
            {/*
              `whitespace-nowrap` is gone. "ZHAGARAM EXIM LLP" at
              `tracking-[0.18em]` uppercase is wider than a 360px phone's
              content column, so the nowrap pushed the footer past the screen
              edge -- invisible only because <html> crops horizontal overflow.
              It wraps now, and the letter-spacing eases off on small screens.
            */}
            <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-primary-foreground sm:tracking-[0.18em]">
              {settings.companyName}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              {footerCopy.tagline}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/55">
              {footerCopy.blurb}
            </p>
          </div>

          {/*
            Two columns at phone width rather than one tall stack, then three
            from `sm`. A single column made the footer roughly a screen and a
            half tall on its own.
          */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 sm:gap-10">
            {dynamicColumns.map((column) => (
              <div key={column.title} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent sm:tracking-[0.18em]">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        to={link.href}
                        className="inline-block py-0.5 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{footerCopy.copyright}</p>
          <p>From Indian roots to global routes.</p>
        </div>
      </Container>
    </footer>
  );
}
