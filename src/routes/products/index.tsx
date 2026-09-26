import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductHero } from "@/components/products/ProductHero";
import { fetchCatalogCategories, fetchCatalogProducts } from "@/lib/catalog-api";
import { pageTitle } from "@/lib/metadata";

export const Route = createFileRoute("/products/")({
  validateSearch: z.object({ category: z.string().optional() }),
  loaderDeps: ({ search }) => ({ category: search.category }),
  staleTime: 30_000,
  loader: async ({ deps }) => {
    try {
      const [categories, products] = await Promise.all([
        fetchCatalogCategories(),
        fetchCatalogProducts(),
      ]);
      const selected = deps.category?.toLowerCase();
      const selectedCategory = selected ? categories.find((category) => category.slug.toLowerCase() === selected || category.id === selected) : null;
      return {
        categories,
        products: selectedCategory ? products.filter((product) => product.categoryId === selectedCategory.id) : products,
        selectedCategoryId: selectedCategory?.id ?? null,
      };
    } catch {
      return { categories: [], products: [], selectedCategoryId: null };
    }
  },
  head: () => ({
    meta: [
      { title: pageTitle("Products") },
      {
        name: "description",
        content:
          "Spices, edible oils, nuts, pulses, rice, and other agricultural products for international supply.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { categories, products, selectedCategoryId } = Route.useLoaderData();
  const visibleCategories = selectedCategoryId
    ? categories.filter((category) => category.id === selectedCategoryId)
    : categories;
  return (
    <>
      <ProductHero
        title="Our Products"
        description="Agricultural and food products, sourced from farmers, manufacturers, and trusted suppliers."
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Products" },
        ]}
      />
      <section className="py-16 sm:py-20">
        <Container>
          <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Category pages describe the supply approach. Named SKUs, grades, and certifications are added only when the business verifies them.
          </p>
          {visibleCategories.length ? (
            <div className="space-y-14">
              {visibleCategories.map((category) => {
                const categoryProducts = products.filter(
                  (product) => product.categoryId === category.id,
                );
                return (
                  <section key={category.id}>
                    <div className="mb-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Category</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{category.name}</h2>
                        {category.description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p> : null}
                      </div>
                    </div>
                    {categoryProducts.length ? (
                      <ProductGrid items={categoryProducts} />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-sm text-muted-foreground">
                        Products for this category are being updated. Please check back shortly.
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : products.length ? <ProductGrid items={products} /> : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Products are being updated. Please check back shortly.
            </div>
          )}
        </Container>
      </section>
      <section className="pb-20">
        <Container>
          <div className="rounded-2xl bg-primary px-8 py-10 text-primary-foreground">
            <h2 className="text-2xl font-semibold tracking-tight">Need a specific lot?</h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
              Share the category, quantity, and destination on the quote form.
            </p>
            <div className="mt-6">
              <Button href="/get-a-quote" variant="gold">
                Get a Quote
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
