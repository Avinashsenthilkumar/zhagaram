import { Container } from "@/components/common/Container";
import { IconBox } from "@/components/common/IconBox";
import { SectionHeading } from "@/components/common/SectionHeading";
import { values } from "@/data/values";
import type { IconName } from "@/types/common";

export function Values() {
  return (
    <section className="bg-card py-20 sm:py-28">
      <Container>
        <SectionHeading
          kicker="Priorities"
          title="What the business stands on"
          description="These priorities come from the supplied company description — not from invented certifications or awards."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((item) => (
            <article key={item.id} className="rounded-2xl bg-background p-6 shadow-[var(--shadow-border)]">
              <IconBox name={item.icon as IconName} />
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
