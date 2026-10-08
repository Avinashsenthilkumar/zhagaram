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
    <section className="pt-14 sm:pt-20 lg:pt-28">
      <Container className="px-safe">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <SectionHeading
            kicker="Catalogue"
            title="Our Products"
            description="Agricultural and food categories, sourced for quality and prepared for international supply."
          />
          {/* Full-width on a phone, so it reads as a deliberate section action
              rather than a stray button under the paragraph. */}
          <Button
            href="/products"
            variant="secondary"
            className="w-full shrink-0 sm:w-auto"
          >
            View all products
          </Button>
        </div>
        {loading ? <SectionLoader label="Loading categories" /> : null}

        {/* Swiper measures itself on mount, so it must not be mounted inside a
            hidden container -- render nothing at all while loading. */}
        {!loading ? (
          <>
        {/*
          `carousel-bleed` (styles.css) cancels the Container's gutter and
          re-applies it as padding, so the "peek" of the next card lands
          *inside* the 20px gutter.

          Previously the Swiper used `!overflow-visible` to show that peek. But
          <html> crops horizontal overflow, so the peeking card was sliced off
          flush at the screen edge rather than fading into the margin -- and on
          Android Chrome the visible overflow intermittently made the whole
          page pannable sideways. Overflow is clipped on the carousel itself
          now, which is where it belongs.
        */}
        <div className="carousel-bleed mt-10 sm:mt-12 lg:hidden">
          <Swiper
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={1.12}
            pagination={{ clickable: true }}
            breakpoints={{
              480: { slidesPerView: 1.35, spaceBetween: 18 },
              640: { slidesPerView: 1.7, spaceBetween: 20 },
              768: { slidesPerView: 2.15, spaceBetween: 22 },
            }}
            className="!pb-10"
          >
            {categories.map((category) => (
              <SwiperSlide key={category.id} className="!h-auto">
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
