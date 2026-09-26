import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionLoader } from "@/components/common/LogoSpinner";
import type { Product } from "@/types/product";

export function ProductGrid({
  items,
  loading = false,
}: {
  items: Product[];
  loading?: boolean;
}) {
  if (loading) return <SectionLoader label="Loading products" />;

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <p className="text-sm font-medium">No products to show yet.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Products added in the admin console appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden">
        <Swiper
          modules={[Pagination]}
          spaceBetween={18}
          slidesPerView={1.08}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 1.7, spaceBetween: 20 },
            768: { slidesPerView: 2.15, spaceBetween: 22 },
          }}
          className="!overflow-visible !pb-9"
        >
          {items.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {items.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  );
}
