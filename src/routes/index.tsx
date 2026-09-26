import { createFileRoute } from "@tanstack/react-router";
import { AboutPreview } from "@/components/home/AboutPreview";
import { CTASection } from "@/components/home/CTASection";
import { FAQPreview } from "@/components/home/FAQPreview";
import { Hero } from "@/components/home/Hero";
import { ProductCategories } from "@/components/home/ProductCategories";
import { SupplyRoutePreview } from "@/components/home/SupplyRoutePreview";
import { Testimonials } from "@/components/home/Testimonials";
import { VisionMission } from "@/components/home/VisionMission";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/seo";
import { pageTitle, pageDescription } from "@/lib/metadata";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: pageTitle() },
      { name: "description", content: pageDescription() },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Hero />
      <AboutPreview />
      <ProductCategories />
      <WhyChooseUs />
      <SupplyRoutePreview />
      <VisionMission />
      <Testimonials />
      <FAQPreview />
      <CTASection />
    </>
  );
}
