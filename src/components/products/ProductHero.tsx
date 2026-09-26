import { PageHero } from "@/components/common/PageHero";

export function ProductHero({
  title,
  description,
  image,
  crumbs,
}: {
  title: string;
  description: string;
  image?: string;
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <PageHero
      image={image ?? "/images/products/products-banner.png"}
      kicker="Products"
      title={title}
      description={description}
      crumbs={crumbs}
    />
  );
}
