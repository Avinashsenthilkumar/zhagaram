import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "spices",
    slug: "spices",
    title: "Spices",
    shortDescription:
      "Indian spices sourced for quality, aroma, and consistent international supply.",
    description:
      "Spices are a core agricultural export category. Selection focuses on quality and careful handling so that flavour, colour, and cleanliness are preserved through packaging and onward logistics. Specific spice names, grades, and origin claims are published only when verified by the business.",
    image: "/images/export/quality.jpg",
    icon: "sparkles",
    features: [
      "Sourced from reliable farmers, manufacturers, and trusted suppliers",
      "Quality checking and selection before dispatch",
      "Proper packaging and labelling for export movement",
    ],
  },
  {
    id: "edible-oils",
    slug: "edible-oils",
    title: "Edible Oils",
    shortDescription:
      "Edible oils procured from trusted manufacturers and suppliers for export supply.",
    description:
      "Edible oils are sourced through manufacturers and trusted suppliers, with attention to quality, packaging, and timely movement along the export route. Product-specific oil types, processing methods, and certifications are not listed until the business confirms them.",
    image: "/images/products/edible-oils.jpg",
    icon: "droplets",
    features: [
      "Manufacturer and supplier sourcing",
      "Quality selection prior to packing",
      "Export-ready packaging and documentation support",
    ],
  },
  {
    id: "nuts",
    slug: "nuts",
    title: "Nuts",
    shortDescription:
      "Nuts selected for quality and supplied through a managed export process.",
    description:
      "Nuts are handled as a quality-sensitive food category. Sourcing, checking, grading, and packaging sit inside the same supply route used for other agricultural products. Varietal lists and origin maps will be added when verified.",
    image: "/images/products/nuts.jpg",
    icon: "nut",
    features: [
      "Quality checking and selection",
      "Segregation and grading where required",
      "Storage and inventory management before shipping",
    ],
  },
  {
    id: "pulses",
    slug: "pulses",
    title: "Pulses",
    shortDescription:
      "Pulses sourced from Indian agricultural supply chains for international buyers.",
    description:
      "Pulses are sourced from reliable farmers and suppliers and moved through quality checking, grading, packaging, and logistics. Named pulse varieties, crop seasons, and volumes are omitted until the business supplies verified figures.",
    image: "/images/products/pulses.jpg",
    icon: "leaf",
    features: [
      "Sourcing from trusted agricultural suppliers",
      "Cleaning and processing when required",
      "Documentation and quality compliance before freight",
    ],
  },
  {
    id: "rice",
    slug: "rice",
    title: "Rice",
    shortDescription:
      "Rice supplied as a core Indian agricultural staple for international markets.",
    description:
      "Rice is sourced, checked, packed, and shipped through the company’s export route. Grain type, milling specifications, and origin claims are published only with verified business data.",
    image: "/images/products/rice.jpg",
    icon: "wheat",
    features: [
      "Quality selection and grading",
      "Proper packaging and labelling",
      "Port, freight, and international shipping coordination",
    ],
  },
  {
    id: "other-products",
    slug: "other-products",
    title: "Other Products",
    shortDescription:
      "Additional agricultural and food products sourced for international supply.",
    description:
      "Beyond the named categories, other agricultural and food products may be sourced from farmers, manufacturers, and trusted suppliers according to enquiry. Items are confirmed case by case rather than listed as a catalogue of unverified SKUs.",
    image: "/images/export/packaging.jpg",
    icon: "box",
    features: [
      "Enquiry-led sourcing",
      "Same quality, packaging, and documentation discipline",
      "International supply through the established export route",
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 3): Product[] {
  return products.filter((product) => product.slug !== slug).slice(0, limit);
}
