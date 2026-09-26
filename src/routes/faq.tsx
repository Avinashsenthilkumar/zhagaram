import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { FaqAccordion } from "@/components/common/FaqAccordion";
import { PageHero } from "@/components/common/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { CTASection } from "@/components/home/CTASection";
import { faqs } from "@/data/faq";
import { pageTitle } from "@/lib/metadata";
import { faqJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: pageTitle("FAQ") },
      {
        name: "description",
        content: "Questions about ZHAGARAM EXIM LLP products, sourcing, and the export route.",
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <PageHero
  image="/images/faq/faq-banner.png"
  kicker="FAQ"
  title="Frequently asked questions"
  description="Find answers about our products, sourcing and export process."
  crumbs={[
    { label: "Home", href: "/" },
    { label: "FAQ" },
  ]}
/>
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl">
          <FaqAccordion items={faqs} />
        </Container>
      </section>
      <CTASection />
    </>
  );
}
