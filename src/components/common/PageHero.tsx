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
      className="relative -mt-[4.25rem] overflow-hidden border-b border-primary/10 bg-primary-dark text-primary-foreground"
      style={
        image
          ? {
              backgroundImage: `
                linear-gradient(
                  90deg,
                  rgba(11, 45, 91, 0.94) 0%,
                  rgba(11, 45, 91, 0.84) 20%,
                  rgba(11, 45, 91, 0.65) 30%,
                  rgba(11, 45, 91, 0.42) 50%
                ),
                url("${image}")
              `,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <Container className="relative z-10 pt-28 pb-14 sm:pt-32 sm:pb-20 lg:pt-36">
        <Breadcrumb items={crumbs} tone="dark" />

        {kicker ? (
          <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent sm:text-xs">
            {kicker}
          </p>
        ) : null}

        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            {description}
          </p>
        ) : null}

        {children}
      </Container>
    </section>
  );
}