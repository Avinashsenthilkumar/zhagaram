import { Container } from "@/components/common/Container";
import { IconBox } from "@/components/common/IconBox";
import type { Product } from "@/types/product";

export function ProductFeatures({ product }: { product: Product }) {
  if (!product.features?.length) return null;
  return (
    <section className="bg-card py-16">
      <Container>
        <h2 className="text-2xl font-semibold tracking-tight">Quality and supply</h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-3">
          {product.features.map((feature, index) => (
            <li key={feature} className="rounded-2xl bg-background p-5 shadow-[var(--shadow-border)]">
              <IconBox name={index === 0 ? "leaf" : index === 1 ? "package" : "file-check"} />
              <p className="mt-4 text-sm leading-relaxed">{feature}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
