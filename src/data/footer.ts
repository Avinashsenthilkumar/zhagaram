import { legalNavigation, mainNavigation } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import type { FooterColumn } from "@/types/common";

export const footerColumns: FooterColumn[] = [
  {
    title: "Explore",
    links: mainNavigation.map((item) => ({ label: item.label, href: item.href })),
  },
  {
    title: "Products",
    links: [
      { label: "All products", href: "/products" },
      { label: "Spices", href: "/products/spices" },
      { label: "Edible Oils", href: "/products/edible-oils" },
      { label: "Nuts", href: "/products/nuts" },
      { label: "Pulses", href: "/products/pulses" },
      { label: "Rice", href: "/products/rice" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Export Process", href: "/export-process" },
      { label: "Get a Quote", href: "/get-a-quote" },
      ...legalNavigation.map((item) => ({ label: item.label, href: item.href })),
    ],
  },
];

export const footerCopy = {
  name: siteConfig.name,
  tagline: siteConfig.tagline,
  blurb:
    "India-based export and import of quality agricultural and food products. Imagery on this site is illustrative and does not depict company facilities.",
  copyright: `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
};
