import {
  Anchor,
  Box,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Droplets,
  Eye,
  Factory,
  FileCheck2,
  Globe,
  Handshake,
  Layers,
  Leaf,
  Nut,
  Package,
  Scale,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Sprout,
  Tractor,
  Truck,
  Users,
  Warehouse,
  Wheat,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/types/common";

const icons: Record<IconName, LucideIcon> = {
  leaf: Leaf,
  handshake: Handshake,
  workflow: Workflow,
  package: Package,
  "file-check": FileCheck2,
  ship: Ship,
  sprout: Sprout,
  scale: Scale,
  clock: Clock3,
  shield: ShieldCheck,
  eye: Eye,
  users: Users,
  tractor: Tractor,
  search: Search,
  "check-circle": CheckCircle2,
  layers: Layers,
  factory: Factory,
  warehouse: Warehouse,
  clipboard: ClipboardList,
  truck: Truck,
  anchor: Anchor,
  globe: Globe,
  sparkles: Sparkles,
  droplets: Droplets,
  nut: Nut,
  wheat: Wheat,
  box: Box,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  // `icons[name]` is undefined for any name not in the map, and rendering
  // <undefined /> throws "Element type is invalid", which unmounts the entire
  // page — a blank screen from one bad string. Icon names reach here from
  // database rows now that products are editable, so the fallback matters.
  const Cmp = icons[name] ?? Box;
  return <Cmp className={className} strokeWidth={1.6} aria-hidden />;
}
