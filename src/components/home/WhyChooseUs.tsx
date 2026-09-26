import { Container } from "@/components/common/Container";
import { IconBox } from "@/components/common/IconBox";
import { SectionHeading } from "@/components/common/SectionHeading";
import { whyChooseUs } from "@/data/values";
import type { IconName } from "@/types/common";

export function WhyChooseUs() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          kicker="Approach"
          title="Why Choose Us?"
          description="A reliable, well-managed supply chain — quality selection, grading, packaging, documentation, logistics, and dependable service."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]"
            >
              <IconBox name={item.icon as IconName} />
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
