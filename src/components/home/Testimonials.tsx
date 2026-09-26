import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { apiUrl } from "@/lib/api-url";
import { SectionLoader } from "@/components/common/LogoSpinner";

type Testimonial = { id: string; rating: number; content: string; name: string; role: string; productName?: string };

export function Testimonials() {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch(apiUrl("/api/testimonials"))
      .then((response) => response.json() as Promise<{ success: boolean; data?: Testimonial[] }>)
      .then((result) => { if (active && result.success) setItems(result.data ?? []); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="overflow-hidden bg-light-grey pt-20 sm:pt-28">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading kicker="Relationships" title="What partners say" description="Building trusted relationships through quality sourcing, transparent communication, and reliable global supply." />
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <button ref={prevRef} type="button" aria-label="Previous testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-primary/15 bg-white text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"><ArrowLeft className="size-4" /></button>
            <button ref={nextRef} type="button" aria-label="Next testimonial" className="inline-flex size-11 items-center justify-center rounded-full border border-primary/15 bg-white text-primary transition-all hover:border-primary hover:bg-primary hover:text-white"><ArrowRight className="size-4" /></button>
          </div>
        </div>

        <div className="relative mt-12">
          {loading ? (
            <SectionLoader label="Loading testimonials" />
          ) : items.length ? (
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1.05}
              loop={items.length > 3}
              speed={700}
              autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
              pagination={{ clickable: true, el: ".testimonial-pagination" }}
              navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
              onBeforeInit={(swiper) => {
                if (typeof swiper.params.navigation !== "boolean" && swiper.params.navigation) {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }
              }}
              breakpoints={{ 640: { slidesPerView: 1.2 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              className="!overflow-visible"
            >
              {items.map((item) => (
                <SwiperSlide key={item.id} className="h-auto">
                  <article className="group relative flex h-full min-h-[310px] flex-col justify-between overflow-hidden rounded-2xl border border-primary/10 bg-white p-7 shadow-[0_10px_40px_rgba(16,37,27,0.06)] sm:p-8">
                    <div className="absolute right-6 top-5 opacity-[0.06]"><Quote className="size-24 text-primary" /></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-1">{Array.from({ length: item.rating }).map((_, index) => <Star key={index} className="size-4 fill-accent text-accent" />)}</div>
                      <p className="mt-7 text-[15px] leading-7 text-foreground/75">“{item.content}”</p>
                    </div>
                    <div className="relative z-10 mt-8 border-t border-primary/10 pt-5">
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.role}{item.productName ? ` · ${item.productName}` : ""}</p>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/15 bg-white px-6 py-10 text-sm text-muted-foreground">Customer reviews will appear here after they are approved.</div>
          )}
          <div className="mt-7 flex items-center justify-between sm:hidden">
            <div className="testimonial-pagination flex items-center gap-2" />
            <div className="flex gap-2">
              <button type="button" onClick={() => prevRef.current?.click()} aria-label="Previous testimonial" className="inline-flex size-10 items-center justify-center rounded-full border border-primary/15 bg-white text-primary"><ArrowLeft className="size-4" /></button>
              <button type="button" onClick={() => nextRef.current?.click()} aria-label="Next testimonial" className="inline-flex size-10 items-center justify-center rounded-full border border-primary/15 bg-white text-primary"><ArrowRight className="size-4" /></button>
            </div>
          </div>
          <div className="testimonial-pagination mt-8 hidden justify-center sm:flex" />
        </div>
      </Container>
    </section>
  );
}
