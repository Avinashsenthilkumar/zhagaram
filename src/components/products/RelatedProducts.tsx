import { useEffect, useState } from "react";
import { Container } from "@/components/common/Container";
import { ProductGrid } from "@/components/products/ProductGrid";
import { fetchCatalogProducts } from "@/lib/catalog-api";
import type { Product } from "@/types/product";

export function RelatedProducts({ slug }: { slug: string }) {
  const [related, setRelated] = useState<Product[]>([]);
  useEffect(() => {
    let active = true;
    void fetchCatalogProducts().then((items) => { if (active) setRelated(items.filter((product) => product.slug !== slug).slice(0, 6)); }).catch(() => { if (active) setRelated([]); });
    return () => { active = false; };
  }, [slug]);
  if (!related.length) return null;
  return <section className="overflow-hidden py-16 sm:py-20"><Container><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">You may also like</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Related products</h2></div></div><div className="mt-8"><ProductGrid items={related} /></div></Container></section>;
}
