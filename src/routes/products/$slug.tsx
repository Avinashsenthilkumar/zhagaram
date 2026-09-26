import { createFileRoute, notFound } from "@tanstack/react-router";
import { CTASection } from "@/components/home/CTASection";
import { ProductDetails } from "@/components/products/ProductDetails";
import { ProductFeatures } from "@/components/products/ProductFeatures";
import { ProductHero } from "@/components/products/ProductHero";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchCatalogProduct } from "@/lib/catalog-api";
import { pageTitle } from "@/lib/metadata";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/products/$slug")({
  staleTime: 30_000,
  loader: async ({ params }) => {
    const product = await fetchCatalogProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: pageTitle(loaderData?.product.title) },
      {
        name: "description",
        content: loaderData?.product.shortDescription ?? "",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  return (
    <>
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.title, path: `/products/${product.slug}` },
          ]),
        ]}
      />
      <ProductHero
        title={product.title}
        description={product.shortDescription}
        image={product.image || undefined}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.title },
        ]}
      />
      <ProductDetails product={product} />
      <ProductFeatures product={product} />

      <RelatedProducts slug={product.slug} />
      <CTASection />
    </>
  );
}
