import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { RouteTimeline } from "@/components/export/RouteTimeline";

export function SupplyRoute({ preview = false }: { preview?: boolean }) {
  return (
    <section className={preview ? "bg-muted/60 py-20 sm:py-28" : "py-16 sm:py-20"}>
      <Container>
        <SectionHeading
          kicker="Process"
          title="Our Supply & Export Route"
          description="The same path every consignment follows — from farmers and trusted suppliers to importers, distributors, and customers."
        />
        <div className="mt-12">
          <RouteTimeline />
        </div>
      </Container>
    </section>
  );
}
