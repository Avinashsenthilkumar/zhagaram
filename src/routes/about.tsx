import { createFileRoute } from "@tanstack/react-router";
import { AboutHero } from "@/components/about/AboutHero";
import { CompanyStory } from "@/components/about/CompanyStory";
import { Mission } from "@/components/about/Mission";
import { Values } from "@/components/about/Values";
import { Vision } from "@/components/about/Vision";
import { CTASection } from "@/components/home/CTASection";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/seo";
import { pageTitle, pageDescription } from "@/lib/metadata";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: pageTitle("About") },
      {
        name: "description",
        content: pageDescription(
          "India-based export and import company sourcing, trading and supplying quality agricultural and food products.",
        ),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <AboutHero />
      <CompanyStory />
      <Vision />
      <Mission />
      <Values />
      <CTASection />
    </>
  );
}
