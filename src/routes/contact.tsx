import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/common/Container";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactMap } from "@/components/contact/ContactMap";

import { Button } from "@/components/common/Button";
import { pageTitle } from "@/lib/metadata";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: pageTitle("Contact") },
      {
        name: "description",
        content:
          "Visit or contact ZHAGARAM EXIM LLP at 2E, Perumal Street, South Udayarpalayam, Attur, Salem - 636102, Tamil Nadu, India.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <ContactHero
        title="Contact"
        description="Visit our office in Attur, Salem, or send us an enquiry and our team will get back to you."
      />

      <section className="py-16 sm:py-20">
        <Container>
          {/* Enquiry forms now live on /get-a-quote, where you first choose
              whether you are buying or supplying. */}
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <ContactDetails />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/get-a-quote">Get a Quote</Button>
              </div>
            </div>

            <ContactMap />
          </div>
        </Container>
      </section>
    </>
  );
}
