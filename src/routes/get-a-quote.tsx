import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, ShoppingCart } from "lucide-react";
import { z } from "zod";
import { Container } from "@/components/common/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactHero } from "@/components/contact/ContactHero";
import { products } from "@/data/products";
import { pageTitle } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/get-a-quote")({
  // The choice lives in the URL, so it can be linked, shared and reached with
  // the browser back button instead of trapping people inside a modal.
  validateSearch: z.object({
    type: z.enum(["customer", "supplier"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: pageTitle("Get a Quote") },
      {
        name: "description",
        content:
          "Request a quote for spices, edible oils, nuts, pulses, rice or other agricultural products, or apply to supply your products to ZHAGARAM EXIM LLP.",
      },
    ],
  }),
  component: QuotePage,
});

const options = [
  {
    type: "customer" as const,
    icon: ShoppingCart,
    title: "I want to buy",
    subtitle: "Customer enquiry",
    description:
      "You are sourcing agricultural or food products and want pricing, quantities and shipping terms.",
    points: [
      "Request product pricing",
      "Share quantity and destination",
      "Get packing and timing details",
    ],
  },
  {
    type: "supplier" as const,
    icon: Building2,
    title: "I want to supply",
    subtitle: "Supplier enquiry",
    description:
      "You are a farmer, manufacturer or trader and want to supply your products to us for export.",
    points: [
      "Introduce your products",
      "Share available quantity",
      "Start a supply partnership",
    ],
  },
];

function QuotePage() {
  const { type } = Route.useSearch();
  const navigate = useNavigate();

  if (!type) return <QuoteChooser />;

  const isSupplier = type === "supplier";

  return (
    <>
      <ContactHero
        title={isSupplier ? "Supplier Enquiry" : "Get a Quote"}
        description={
          isSupplier
            ? "Tell us about your products and available quantity. Our team will review your details and get back to you."
            : "Tell us the product, quantity, and destination. Your enquiry is validated before it is sent to our team."
        }
      />

      <section className="py-10 sm:py-16">
        <Container className="px-safe">
          <button
            type="button"
            data-touch-target
            onClick={() => void navigate({ to: "/get-a-quote", search: {} })}
            className="-ml-2 mb-6 inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-[#0B2D5B] transition-colors hover:text-[#1E4A8A] sm:mb-8"
          >
            <ArrowLeft className="size-4" />
            Choose a different enquiry type
          </button>

          {/*
            The form comes FIRST on a phone (`order-first lg:order-none`).
            Previously the "What to include" checklist sat above it, so on
            opening /get-a-quote you had to scroll past a column of guidance
            before the fields appeared -- the page looked like it had no form.
            On desktop the two-column order is unchanged.
          */}
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div className="lg:order-first">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent sm:tracking-[0.22em]">
                What to include
              </p>
              <h2 className="mt-3 text-[clamp(1.5rem,6vw,1.875rem)] font-semibold leading-tight tracking-tight">
                A clear request helps us respond.
              </h2>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {isSupplier ? (
                  <>
                    <li>Name and company</li>
                    <li>Email, phone, and GST number</li>
                    <li>Product you can supply</li>
                    <li>Available quantity and location in the message</li>
                  </>
                ) : (
                  <>
                    <li>Name and company</li>
                    <li>Email, phone, and country</li>
                    <li>Product category and approximate quantity</li>
                    <li>Any packing or timing notes in the message</li>
                  </>
                )}
              </ul>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Categories
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {products.map((product) => product.title).join(" · ")}
              </p>
            </div>

            <div className="order-first lg:order-none">
              <ContactForm
                heading={isSupplier ? "Supplier enquiry" : "Quote request"}
                variant={type}
                submitLabel="Submit enquiry"
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function QuoteChooser() {
  return (
    <>
      <ContactHero
        title="Get a Quote"
        description="First, tell us which side you are on. We will show you the right form."
      />

      <section className="py-10 sm:py-20">
        <Container className="px-safe">
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2 sm:gap-6">
            {options.map((option) => {
              const Icon = option.icon;
              const isSupplier = option.type === "supplier";

              return (
                <Link
                  key={option.type}
                  to="/get-a-quote"
                  search={{ type: option.type }}
                  preload="intent"
                  className={cn(
                    "group flex flex-col rounded-2xl border bg-card p-5 text-left sm:p-7",
                    "shadow-[var(--shadow-border)] transition-all duration-200",
                    // `hover:-translate-y-1` on a touch device sticks after a
                    // tap, leaving the card visibly lifted. Scoped to devices
                    // that actually hover.
                    "[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[var(--shadow-border-hover)]",
                    isSupplier ? "border-[#D4AF37]/30" : "border-[#0B2D5B]/15",
                  )}
                >
                  <span
                    className={cn(
                      "inline-grid size-14 place-items-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                      isSupplier
                        ? "bg-[#D4AF37]/15 text-[#9A7B15]"
                        : "bg-[#0B2D5B]/10 text-[#0B2D5B]",
                    )}
                  >
                    <Icon className="size-7" />
                  </span>

                  <p className="mt-5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:mt-6 sm:tracking-[0.2em]">
                    {option.subtitle}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                    {option.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
                    {option.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-[0.45rem] size-1.5 shrink-0 rounded-full",
                            isSupplier ? "bg-[#D4AF37]" : "bg-[#0B2D5B]",
                          )}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <span
                    className={cn(
                      "mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 sm:mt-7",
                      "text-sm font-semibold transition-colors duration-200",
                      isSupplier
                        ? "bg-[#D4AF37] text-[#1a1405] group-hover:bg-[#c5a132]"
                        : "bg-[#0B2D5B] text-white group-hover:bg-[#1E4A8A]",
                    )}
                  >
                    Continue
                  </span>
                </Link>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
            Not sure which applies? Choose <strong>I want to buy</strong> — we will route your
            enquiry to the right team either way.
          </p>
        </Container>
      </section>
    </>
  );
}
