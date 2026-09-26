import { ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";

export function ExportCTA() {
  return (
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="overflow-hidden rounded-2xl bg-primary px-8 py-12 text-primary-foreground sm:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Next step
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight">
            Ready to move a consignment?
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-foreground/75">
            Share the product, quantity, and destination. A quote request is the starting point.
          </p>
          <div className="mt-8">
            <Button href="/get-a-quote" variant="gold">
              Get a Quote
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
