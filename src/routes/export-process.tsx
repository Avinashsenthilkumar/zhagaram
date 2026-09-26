import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/common/PageHero";
import { ExportCTA } from "@/components/export/ExportCTA";
import { SupplyRoute } from "@/components/export/SupplyRoute";
import { pageTitle } from "@/lib/metadata";

export const Route = createFileRoute("/export-process")({
  head: () => ({
    meta: [
      { title: pageTitle("Export Process") },
      {
        name: "description",
        content:
          "The supply and export route from farmers and trusted suppliers through quality, packaging, documentation, logistics, and international shipping.",
      },
    ],
  }),
  component: ExportProcessPage,
});

function ExportProcessPage() {
  return (
    <>
      <PageHero
  image="/images/export/export-process-banner.png"
  kicker="Export Process"
  title="From sourcing to international delivery"
  description="A structured supply and export process connecting Indian products with global customers."
  crumbs={[
    { label: "Home", href: "/" },
    { label: "Export Process" },
  ]}
/>
      <SupplyRoute />
      <ExportCTA />
    </>
  );
}
