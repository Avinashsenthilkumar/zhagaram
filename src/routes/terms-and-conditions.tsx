import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { siteConfig } from "@/data/site";
import { pageTitle } from "@/lib/metadata";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: pageTitle("Terms & Conditions") },
      { name: "description", content: "Website terms for ZHAGARAM EXIM LLP." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <>
      <PageHero
        kicker="Legal"
        title="Terms & Conditions"
        description="These terms apply to use of this website. They are not a substitute for a negotiated supply contract."
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Terms & Conditions" },
        ]}
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
          <p>
            The site is published by {siteConfig.name} to describe agricultural and food export and import services. Information is limited to what the business has supplied. Photographs are illustrative and do not represent owned factories, warehouses, or offices unless later labelled as such.
          </p>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quotes and enquiries</h2>
            <p className="mt-2">
              Submitting a form is a request for information. It is not an offer, acceptance, or guarantee of supply, price, or shipping time. A binding transaction requires a separate written confirmation.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Accuracy</h2>
            <p className="mt-2">
              Product categories, process steps, vision, and mission follow the supplied requirements. The company does not, on this site, claim certifications, export volumes, countries served, years of experience, or customer counts.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Changes</h2>
            <p className="mt-2">
              These terms will be revised when official contact details, registered office information, or commercial policies are provided.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
