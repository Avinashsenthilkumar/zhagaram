import { Container } from "@/components/common/Container";
import { companyCopy } from "@/data/site";

export function CompanyStory() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            loading="lazy"
            decoding="async"
            src="/images/about/farmers.jpg"
            alt="Agricultural work in Indian fields. Illustrative photography, not a company facility."
            className="aspect-[5/4] w-full rounded-2xl object-cover"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Company story
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Connecting Indian agriculture with international markets
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {companyCopy.intro}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {companyCopy.aim}
            </p>
            <div className="mt-8">
              <p className="text-sm font-semibold">{companyCopy.sourcingLead}</p>
              <ul className="mt-3 space-y-2">
                {companyCopy.sourcing.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
