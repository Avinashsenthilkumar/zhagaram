import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { siteConfig } from "@/data/site";
import { pageTitle } from "@/lib/metadata";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: pageTitle("Privacy Policy") },
      { name: "description", content: "Privacy policy for the ZHAGARAM EXIM LLP website." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <>
      <PageHero
        kicker="Legal"
        title="Privacy Policy"
        description="This policy covers the information this website currently collects. It will be updated when official contact details and a mail service are connected."
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl space-y-8 text-sm leading-relaxed text-muted-foreground">
          <p>
            {siteConfig.name} publishes this site to describe its export and import work. Direct identifiers such as email, phone, and office address are not listed until they are verified.
          </p>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Information you provide</h2>
            <p className="mt-2">
              The enquiry and quote forms collect name, company, email, phone, country, product interest, quantity, and message. Until a server-side mail integration is added, submissions are stored only in the browser that sent them and are not transmitted to a company mailbox.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Information we do not collect yet</h2>
            <p className="mt-2">
              No payment data is taken. No account system is offered. Analytics, advertising pixels, and mailing lists are not claimed on this site.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Contact about privacy</h2>
            <p className="mt-2">
              Use the enquiry form. A dedicated privacy contact will be published with the official email address.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
