export interface ValueItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface WhyChooseItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export type IconName =
  | "leaf"
  | "handshake"
  | "workflow"
  | "package"
  | "file-check"
  | "ship"
  | "sprout"
  | "scale"
  | "clock"
  | "shield"
  | "eye"
  | "users"
  | "tractor"
  | "search"
  | "check-circle"
  | "layers"
  | "factory"
  | "warehouse"
  | "clipboard"
  | "truck"
  | "anchor"
  | "globe"
  | "sparkles"
  | "droplets"
  | "nut"
  | "wheat"
  | "box";
