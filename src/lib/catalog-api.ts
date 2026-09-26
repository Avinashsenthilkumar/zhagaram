import { products as fallbackProducts } from "@/data/products";
import type { Product } from "@/types/product";
import { apiResourceUrl, apiUrl } from "@/lib/api-url";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
};

type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  shortDescription: string | null;
  description: string | null;
  image: string | null;
  images?: string[];
  features: string[];
  category?: CatalogCategory | null;
};

export function mapApiProduct(item: ApiProduct): Product {
  const fallback = fallbackProducts.find((product) => product.slug === item.slug);
  return {
    id: item.id,
    slug: item.slug,
    categoryId: item.categoryId,
    title: item.name,
    shortDescription: item.shortDescription || fallback?.shortDescription || "Quality products for international supply.",
    description: item.description || fallback?.description,
    image: apiResourceUrl(item.image) || fallback?.image || "",
    icon: fallback?.icon || "box",
    features: item.features.length ? item.features : fallback?.features,
  };
}

function fallbackCategories(): CatalogCategory[] {
  return fallbackProducts.map((product) => ({
    id: `static-${product.id}`,
    name: product.title,
    slug: product.slug,
    description: product.shortDescription,
    image: product.image || null,
  }));
}

function fallbackProductItems(): Product[] {
  return fallbackProducts.map((product) => ({ ...product, categoryId: `static-${product.id}` }));
}

export async function fetchCatalogProducts(): Promise<Product[]> {
  try {
    const response = await fetch(apiUrl("/api/products"));
    if (!response.ok) throw new Error("Unable to load products.");
    const result = await response.json() as { success: boolean; data: ApiProduct[] };
    if (!result.success) throw new Error("Unable to load products.");
    const items = result.data.map(mapApiProduct);
    return items.length ? items : fallbackProductItems();
  } catch {
    return fallbackProductItems();
  }
}

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    const response = await fetch(apiUrl("/api/categories"));
    if (!response.ok) throw new Error("Unable to load categories.");
    const result = await response.json() as { success: boolean; data: CatalogCategory[] };
    if (!result.success) throw new Error("Unable to load categories.");
    return result.data.length ? result.data : fallbackCategories();
  } catch {
    return fallbackCategories();
  }
}

export async function fetchCatalogProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(apiUrl(`/api/products/${encodeURIComponent(slug)}`));
    if (response.status === 404) {
      return fallbackProducts.find((product) => product.slug === slug) ?? null;
    }
    if (!response.ok) throw new Error("Unable to load product.");
    const result = await response.json() as { success: boolean; data: ApiProduct };
    if (!result.success) throw new Error("Unable to load product.");
    return mapApiProduct(result.data);
  } catch {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }
}
