export interface Product {
  id: string;
  slug: string;
  categoryId?: string | null;
  title: string;
  shortDescription: string;
  description?: string;
  image: string;
  icon?: string;
  features?: string[];
}
