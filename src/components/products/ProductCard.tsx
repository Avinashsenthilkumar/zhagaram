import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { apiResourceUrl } from "@/lib/api";
import { SmartImage } from "@/components/common/SmartImage";
import type { Product } from "@/types/product";

export function ProductCard({
  product,
  categoryLink = false,
}: {
  product: Product;
  categoryLink?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-border-hover)]">
      {categoryLink ? (
        <Link
          to="/products"
          search={{ category: product.slug }}
          preload="intent"
          className="block"
        >
          <CardContent product={product} />
        </Link>
      ) : (
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          preload="intent"
          className="block"
        >
          <CardContent product={product} />
        </Link>
      )}
    </article>
  );
}

function CardContent({ product }: { product: Product }) {
  const imageUrl = apiResourceUrl(product.image);

  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden bg-[#edf4ee]">
        <SmartImage
          src={imageUrl}
          alt={product.title}
          width={600}
          height={450}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold tracking-tight">
          {product.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {product.shortDescription}
        </p>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          View More
          <ArrowUpRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </>
  );
}