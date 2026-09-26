import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionLoader } from "@/components/common/LogoSpinner";
import { fetchCatalogCategories } from "@/lib/catalog-api";
import type { Product } from "@/types/product";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export function ProductCategories() {
  const [categories, setCategories] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetchCatalogCategories().then((items) => {
      if (!active) return;
      setCategories(items.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.name,
        shortDescription: item.description || "Explore products in this category.",
        image: item.image || "",
      })));
    }).catch(() => {
      if (active) setCategories([]);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <section className="pt-20 sm:pt-28">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            kicker="Catalogue"
            title="Our Products"
            description="Agricultural and food categories, sourced for quality and prepared for international supply."
          />
          <Button href="/products" variant="secondary">
            View all products
          </Button>
        </div>
        {loading ? <SectionLoader label="Loading categories" /> : null}

        {/* Swiper measures itself on mount, so it must not be mounted inside a
            hidden container -- render nothing at all while loading. */}
        {!loading ? (
          <>
        <div className="mt-12 lg:hidden">
          <Swiper
            modules={[Pagination]}
            spaceBetween={18}
            slidesPerView={1.08}
            pagination={{ clickable: true }}
            breakpoints={{ 640: { slidesPerView: 1.7, spaceBetween: 20 }, 768: { slidesPerView: 2.15, spaceBetween: 22 } }}
            className="!overflow-visible !pb-9"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id} className="h-auto">
                <ProductCard product={category} categoryLink />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-3">
          {categories.map((category) => (
            <ProductCard key={category.id} product={category} categoryLink />
          ))}
        </div>
          </>
        ) : null}
      </Container>
    </section>
  );
}
