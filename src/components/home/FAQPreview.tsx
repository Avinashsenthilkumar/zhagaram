import { Link } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { SectionHeading } from "@/components/common/SectionHeading";
import { FaqAccordion } from "@/components/common/FaqAccordion";
import { faqs } from "@/data/faq";

export function FAQPreview() {
  return (
    <section className="bg-card py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            kicker="Questions"
            title="Frequently asked"
            description="Answers taken from the supplied business description. Legal and certification claims are not invented."
          />
          <div>
            <FaqAccordion items={faqs.slice(0, 4)} />
            <Link
              to="/faq"
              className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
            >
              View all questions
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
