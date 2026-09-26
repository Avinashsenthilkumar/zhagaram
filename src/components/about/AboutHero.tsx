import { PageHero } from "@/components/common/PageHero";
import { companyCopy } from "@/data/site";

export function AboutHero() {
  return (
    <PageHero
  image="/images/about/about-banner.png"
  kicker="About"
  title="An India-based export and import house"
  description={companyCopy.intro}
  crumbs={[
    { label: "Home", href: "/" },
    { label: "About" },
  ]}
/>
  );
}
