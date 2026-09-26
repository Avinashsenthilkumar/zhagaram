import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { companyCopy } from "@/data/site";

export function AboutPreview() {
  return (
    <section className="bg-card py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">

          {/* =================================
              IMAGE
          ================================= */}
          <div className="relative">
            {/* Decorative frame */}
            <div className="absolute -bottom-4 -left-4 -z-0 h-32 w-32 border-l border-b border-accent/40" />

            <div className="relative z-10 overflow-hidden rounded-2xl">
              <img
                loading="lazy"
                decoding="async"
                src="/images/about/farmers.jpg"
                alt="Agricultural work in Indian fields at dawn. Illustrative photography, not a company facility."
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.02] sm:aspect-[5/4] lg:aspect-[4/5]"
              />

              {/* Image overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-dark/25 via-transparent to-transparent" />
            </div>

            {/* Small label */}
            <div className="absolute bottom-5 left-5 z-20 rounded-md border border-white/20 bg-primary-dark/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                Indian Roots
              </p>
              <p className="mt-1 text-xs text-white/75">
                Sourcing with purpose
              </p>
            </div>
          </div>

          {/* =================================
              CONTENT
          ================================= */}
          <div className="relative">

            {/* Accent line */}
            <div className="absolute -left-6 top-0 hidden h-20 w-px bg-accent lg:block" />

            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Company
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.7rem] lg:leading-[1.1]">
              From Indian roots
              <span className="block text-primary">
                to global routes.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {companyCopy.intro}
            </p>

            {/* Sourcing block */}
            <div className="mt-8 border-y border-border py-6">
              <div className="flex gap-4">
                <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-semibold">01</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Reliable sourcing
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {companyCopy.sourcingLead}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {companyCopy.sourcing.join(", ")}.
                  </p>
                </div>
              </div>
            </div>

            {/* Priorities */}
            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What guides us
              </p>

              <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {companyCopy.priorities.map((item) => (
                  <li
                    key={item}
                    className="group flex items-center gap-3 text-sm text-foreground"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                      <Check className="size-3.5" />
                    </span>

                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-9 flex items-center gap-5">
              <Button href="/about">
                Explore our story
                <ArrowRight className="size-4" />
              </Button>

              <span className="hidden text-xs text-muted-foreground sm:block">
                From sourcing to global delivery
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}