import {
  Box,
  CheckCircle2,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Container } from "@/components/common/Container";
import { ProductReviews } from "@/components/products/ProductReviews";
import { apiResourceUrl } from "@/lib/api";
import type { Product } from "@/types/product";

export function ProductDetails({
  product,
}: {
  product: Product;
}) {
  const imageUrl = apiResourceUrl(product.image);

  return (
    <section className="bg-light-grey pt-12 sm:pt-16 lg:pt-20">
      <Container>
        {/* PRODUCT DETAILS */}
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">

          {/* IMAGE */}
          <div className="group relative">
            <div className="absolute -bottom-3 -left-2 -z-0 size-20 border-b border-l border-accent/40 sm:-bottom-4 sm:-left-4 sm:size-24" />

            <div className="relative z-10 overflow-hidden rounded-2xl">
              {imageUrl ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={imageUrl}
                  alt={product.title}
                  className="
                    aspect-[4/3]
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-[1.02]
                    sm:aspect-[16/10]
                    lg:aspect-[4/3]
                  "
                />
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-[#edf4ee] text-sm text-[#52715d]">
                  Image unavailable
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark/20 via-transparent to-transparent" />
            </div>
          </div>

          {/* CONTENT */}
          <div className="relative">
            <div className="absolute -left-5 top-0 hidden h-16 w-px bg-accent lg:block" />

            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-accent" />

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                Category
              </p>
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {product.title}
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
              {product.description}
            </p>

            {/* PRODUCT FOCUS */}
            <div className="mt-8 border-y border-border py-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Our focus
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">

                {/* Quality */}
                <div className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Quality
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Careful selection and quality-focused sourcing.
                    </p>
                  </div>
                </div>

                {/* Handling */}
                <div className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Careful handling
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Proper handling throughout the supply process.
                    </p>
                  </div>
                </div>

                {/* Packaging */}
                <div className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Box className="size-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Packaging
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Packaging aligned with onward logistics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="mt-6 flex gap-3 border-l-2 border-primary/20 pl-4">
              <Truck className="mt-0.5 size-4 shrink-0 text-primary" />

              <p className="text-xs leading-5 text-muted-foreground">
                Specifications, grades, and origin details are
                published only when they are verified by the
                business.
              </p>
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <ProductReviews product={product} />
      </Container>
    </section>
  );
}