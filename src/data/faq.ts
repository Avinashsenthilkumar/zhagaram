import type { FAQ } from "@/types/faq";

/**
 * Questions and answers are drawn only from supplied business requirements.
 * Legal, certification, and volume claims are intentionally omitted.
 */
export const faqs: FAQ[] = [
  {
    id: "what-we-do",
    question: "What does ZHAGARAM EXIM LLP do?",
    answer:
      "ZHAGARAM EXIM LLP is an India-based export and import company involved in sourcing, trading, and international supply of quality agricultural and food products.",
  },
  {
    id: "products",
    question: "Which product categories do you supply?",
    answer:
      "The current product categories are Spices, Edible Oils, Nuts, Pulses, Rice, and Other Products. Specific SKUs under each category are confirmed against enquiry rather than listed as unverified catalogue items.",
  },
  {
    id: "sourcing",
    question: "Where are products sourced from?",
    answer:
      "Products are sourced from reliable farmers, manufacturers, and trusted suppliers, with an emphasis on quality, competitive pricing, proper packaging, and timely supply.",
  },
  {
    id: "export-route",
    question: "What does the supply and export route include?",
    answer:
      "The route runs from farmers and trusted suppliers through sourcing, quality checking, grading, processing if required, packaging, storage, documentation, logistics, port and freight forwarding, international shipping, and onward to importers, distributors, and customers.",
  },
  {
    id: "priorities",
    question: "What does the company focus on?",
    answer:
      "Quality, competitive pricing, proper packaging, timely supply, reliability, transparency, and long-term partnerships.",
  },
  {
    id: "quote",
    question: "How can I request a quote?",
    answer:
      "Use the Get a Quote form with your name, company, email, phone, country, product interest, quantity, and message. A mail service will be connected once official contact details are published.",
  },
];
