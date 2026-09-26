import { ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { siteConfig } from "@/data/site";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground sm:py-28">
      <img
        loading="lazy"
        decoding="async"
        src="/images/export/port.jpg"
        alt="Port and cargo ships at dusk. Illustrative logistics photography."
        className="absolute inset-0 size-full object-cover opacity-90 "
      />
      <div className="absolute inset-0 bg-primary/30" />
      <Container className="relative text-center">
        {/* <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Get a Quote
        </p> */}
        <h2 className="mx-auto mt-4 max-w-2xl text-white text-3xl font-semibold tracking-tight sm:text-5xl">
          Tell us what you need to move.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-primary-foreground/100">
          {siteConfig.tagline}. Share product, quantity, and destination — we will take it from there once official contact channels are live.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button href="/get-a-quote" variant="gold" size="lg">
            Get a Quote
            <ArrowRight className="size-4" />
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            Contact
          </Button>
        </div>
      </Container>
    </section>
  );
}
