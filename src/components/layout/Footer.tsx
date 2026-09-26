import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { footerColumns, footerCopy } from "@/data/footer";
import { apiUrl } from "@/lib/api-url";

type FooterCategory = { id: string; name: string; slug: string };

export function Footer() {
  const [categories, setCategories] = useState<FooterCategory[]>([]);

  useEffect(() => {
    let active = true;
    void fetch(apiUrl("/api/categories"))
      .then((response) => response.json() as Promise<{ success: boolean; data?: FooterCategory[] }>)
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
      <Container className="mt-4 py-4 sm:py-4">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link to="/" aria-label="Home" className="inline-flex items-center"><img loading="lazy" decoding="async" src="/logo.png" alt="ZHAGARAM EXIM LLP" className="h-16 w-auto max-w-[14rem] rounded-sm bg-white object-contain" /></Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">{footerCopy.tagline}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/55">{footerCopy.blurb}</p>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            {dynamicColumns.map((column) => <div key={column.title}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{column.title}</p><ul className="mt-4 space-y-2.5">{column.links.map((link) => <li key={link.href + link.label}><Link to={link.href} className="text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground">{link.label}</Link></li>)}</ul></div>)}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-primary-foreground/10 pt-4 text-xs text-primary-foreground/50 sm:flex-row sm:items-center sm:justify-between"><p>{footerCopy.copyright}</p><p>From Indian roots to global routes.</p></div>
      </Container>
    </footer>
  );
}
