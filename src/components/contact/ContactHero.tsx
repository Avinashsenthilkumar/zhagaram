import { PageHero } from "@/components/common/PageHero";

export function ContactHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageHero
      image="/images/contact/contact-banner.png"
      // kicker="Contact"
      title={title}
      description={description}
      crumbs={[
        { label: "Home", href: "/" },
        { label: title },
      ]}
    />
  );
}
