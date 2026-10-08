import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Container } from "@/components/common/Container";
import type { BreadcrumbItem } from "@/types/common";

export function PageHero({
  kicker,
  title,
  description,
  crumbs,
  image,
  children,
}: {
  kicker?: string;
  title: string;
  description?: string;
  crumbs: BreadcrumbItem[];
  image?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className="-mt-header relative overflow-hidden border-b border-primary/10 bg-primary-dark text-primary-foreground"
    >
      {/*
        The banner and its scrim moved out of an inline `backgroundImage` and
        into real layers, because the scrim has to change direction by
        viewport.

        The old single gradient ran at 90deg and was already down to 0.42 alpha
        by the 50% mark. On a desktop that is correct -- the text occupies the
        left third. On a phone the text spans the full width, so the right-hand
        half of every heading sat on bare photo: white type on a bright banner,
        which is exactly the "not good in mobile view" complaint. Below `sm`
        the scrim is now vertical and much heavier, so the text has a dark bed
        under it the whole way across.
      */}
      {image ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${image}")` }}
          />
          {/* `page-hero-scrim` is defined in styles.css: vertical and heavy
              below `sm`, the original 90deg reveal from `sm` up. Kept out of a
              Tailwind arbitrary value because a gradient that long is both
              unreadable inline and easy to break on the next edit. */}
          <div aria-hidden className="page-hero-scrim absolute inset-0" />
        </>
      ) : null}

      <Container className="px-safe relative z-10 pb-12 pt-[calc(var(--header-offset)_+_2.5rem)] sm:pb-20 sm:pt-[calc(var(--header-offset)_+_4rem)]">
        <Breadcrumb items={crumbs} tone="dark" />

        {kicker ? (
          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent sm:text-xs sm:tracking-[0.22em]">
            {kicker}
          </p>
        ) : null}

        {/*
          clamp() instead of a `text-3xl` → `sm:text-4xl` → `lg:text-5xl` step
          ladder. Page titles here include "Terms & Conditions" and "Supplier
          Enquiry"; at a fixed 30px on a 320px screen those broke awkwardly.
          The heading now scales with the viewport and never overflows.
        */}
        <h1 className="mt-4 max-w-3xl text-[clamp(1.75rem,7vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
          {title}
        </h1>

        {description ? (
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-white/90 sm:mt-5 sm:text-lg">
            {description}
          </p>
        ) : null}

        {children}
      </Container>
    </section>
  );
}