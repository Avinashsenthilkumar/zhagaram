import type { ProcessStep } from "@/types/process";

export const supplyRoute: ProcessStep[] = [
  {
    id: 1,
    title: "Farmers / Trusted Suppliers",
    shortTitle: "Source",
    description:
      "Produce begins with reliable farmers, manufacturers, and trusted suppliers.",
    icon: "tractor",
  },
  {
    id: 2,
    title: "Sourcing & Procurement",
    shortTitle: "Procure",
    description:
      "Requirements are matched to available quality lots and confirmed for supply.",
    icon: "search",
  },
  {
    id: 3,
    title: "Quality Checking & Selection",
    shortTitle: "Check",
    description:
      "Lots are checked and selected so that only suitable product continues.",
    icon: "check-circle",
  },
  {
    id: 4,
    title: "Segregation & Grading",
    shortTitle: "Grade",
    description:
      "Product is segregated and graded according to the agreed requirement.",
    icon: "layers",
  },
  {
    id: 5,
    title: "Processing / Cleaning, if required",
    shortTitle: "Process",
    description:
      "Cleaning or processing is carried out when the product needs it.",
    icon: "factory",
  },
  {
    id: 6,
    title: "Packaging & Labelling",
    shortTitle: "Package",
    description:
      "Goods are packed and labelled for storage, handling, and export movement.",
    icon: "package",
  },
  {
    id: 7,
    title: "Storage & Inventory Management",
    shortTitle: "Store",
    description:
      "Packed goods are held and tracked until documentation and transport are ready.",
    icon: "warehouse",
  },
  {
    id: 8,
    title: "Documentation & Quality Compliance",
    shortTitle: "Document",
    description:
      "Export paperwork and quality compliance are prepared before freight.",
    icon: "clipboard",
  },
  {
    id: 9,
    title: "Transportation & Logistics",
    shortTitle: "Logistics",
    description:
      "Inland movement is arranged from storage toward the port of loading.",
    icon: "truck",
  },
  {
    id: 10,
    title: "Port / Freight Forwarding",
    shortTitle: "Freight",
    description:
      "Port handling and freight forwarding connect the cargo to the vessel or carrier.",
    icon: "anchor",
  },
  {
    id: 11,
    title: "International Shipping",
    shortTitle: "Ship",
    description:
      "Cargo moves on the international leg toward the buyer’s market.",
    icon: "ship",
  },
  {
    id: 12,
    title: "Importers / Distributors / Customers",
    shortTitle: "Global Customer",
    description:
      "Goods reach importers, distributors, and customers at destination.",
    icon: "globe",
  },
];
