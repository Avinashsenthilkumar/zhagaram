import { ArrowRight } from "lucide-react";

import { Container } from "@/components/common/Container";
import { companyCopy } from "@/data/site";

export function Vision() {
  return (
    <section className="bg-primary-dark py-20 text-primary-foreground sm:py-28">
      <Container>
        {/* Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Our Vision
            </p>
          </div>

          <p className="mt-7 text-xl leading-[1.5] font-medium tracking-tight text-primary-foreground/90 sm:text-2xl lg:text-[2rem] lg:leading-[1.4]">
            {companyCopy.vision}
          </p>
        </div>

        {/* Vision Image */}
        <div className="group relative mt-12 overflow-hidden rounded-2xl">
          <img
            loading="lazy"
            decoding="async"
            src="/images/about/vision.jpg"
            alt="Aerial agricultural landscape. Illustrative imagery."
            className="aspect-[21/9] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />

          {/* Image overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark/45 via-transparent to-transparent" />

          {/* Route */}
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox="0 0 1200 400"
            aria-hidden
          >
            <path
              className="route-line"
              d="M60 300 C 280 260, 340 80, 560 140 S 860 340, 1140 90"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
              opacity="0.85"
            />

            <circle
              cx="60"
              cy="300"
              r="5"
              fill="#D4AF37"
            />

            <circle
              cx="1140"
              cy="90"
              r="5"
              fill="#FFFFFF"
            />
          </svg>

          {/* Image label */}
          <div className="absolute bottom-5 left-5 flex items-center gap-3 sm:bottom-7 sm:left-7">
            <span className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-primary-dark/70 text-accent backdrop-blur-sm">
              <ArrowRight className="size-4" />
            </span>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                From India
              </p>

              <p className="mt-0.5 text-sm font-medium text-white">
                To global markets
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}