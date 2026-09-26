import { Container } from "@/components/common/Container";
import { companyCopy } from "@/data/site";

export function Mission() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Our Mission
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Source well. Handle properly. Deliver with care.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {companyCopy.mission}
            </p>
          </div>
          <img
            loading="lazy"
            decoding="async"
            src="/images/export/port.jpg"
            alt="International shipping at port. Illustrative photography, not a claimed company terminal."
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
