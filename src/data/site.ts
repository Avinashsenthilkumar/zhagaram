import type { CompanyCopy, ContactPlaceholder, SiteConfig } from "@/types/site";

export const siteConfig: SiteConfig = {
  name: "ZHAGARAM EXIM LLP",
  shortName: "ZHAGARAM EXIM",
  tagline: "From Indian Roots to Global Routes",
  description:
    "India-based export and import company supplying quality agricultural and food products to international markets.",
  locale: "en",
  url: "https://zhagaramexim.com",
};

export const companyCopy: CompanyCopy = {
  intro:
    "ZHAGARAM EXIM LLP is an India-based Export and Import company involved in sourcing, trading and international supply of quality agricultural and food products.",
  sourcingLead: "Products are sourced from:",
  sourcing: ["Reliable farmers", "Manufacturers", "Trusted suppliers"],
  prioritiesLead: "The business focuses on:",
  priorities: [
    "Quality",
    "Competitive pricing",
    "Proper packaging",
    "Timely supply",
    "Reliability",
    "Transparency",
    "Long-term partnerships",
  ],
  aim: "Connecting quality Indian agricultural products with international markets.",
  vision:
    "To become a trusted global trading partner by connecting high-quality Indian agricultural products with international markets through reliable sourcing, consistent quality, and responsible business practices.",
  mission:
    "To source quality products from trusted farmers, manufacturers, and suppliers, ensure proper handling and packaging, and deliver them efficiently to customers worldwide while building long-term relationships based on quality, transparency, and timely service.",
};

export const heroCopy = {
  kicker: "Agricultural export & import",
  supporting:
    "Sourcing quality Indian agricultural and food products and supplying them through a carefully managed international route — from farm and factory to importer, distributor, and customer.",
  primaryCta: "Get a Quote",
  secondaryCta: "Explore Products",
};

export const officeAddress = {
  line1: "2E, Perumal Street",
  line2: "South Udayarpalayam",
  city: "Attur",
  district: "Salem",
  postalCode: "636102",
  state: "Tamil Nadu",
  country: "India",
};

/** Single-line address, used for schema.org, map links and the footer. */
export const officeAddressLine = `${officeAddress.line1}, ${officeAddress.line2}, ${officeAddress.city}, ${officeAddress.district} - ${officeAddress.postalCode}`;

/** Google Maps deep link ("Open in Maps" / "Get directions"). */
export const officeMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${officeAddressLine}, ${officeAddress.state}, ${officeAddress.country}`,
)}`;

/**
 * Embed URL for the map iframe.
 *
 * Uses the keyless `maps.google.com/maps?output=embed` endpoint so the map
 * works immediately with no API key, no billing account and no quota. If you
 * later want Street View, custom styling or a branded pin, swap this for the
 * Maps Embed API and put the key in VITE_GOOGLE_MAPS_KEY.
 */
export const officeMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
  `${officeAddressLine}, ${officeAddress.state}, ${officeAddress.country}`,
)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;

export const contactPlaceholders: ContactPlaceholder[] = [
  {
    label: "Office",
    value: officeAddressLine,
    note: `${officeAddress.state}, ${officeAddress.country}`,
  },
  {
    label: "Email",
    value: "To be published",
    note: "Official email will appear here once verified by the business.",
  },
  {
    label: "Phone",
    value: "To be published",
    note: "Direct phone and WhatsApp numbers are not listed until confirmed.",
  },
];

export const formNotice =
  "Your enquiry is validated and sent securely to the ZHAGARAM EXIM team. You will receive a confirmation email after successful submission.";
