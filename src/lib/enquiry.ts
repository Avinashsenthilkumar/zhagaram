import { z } from "zod";

import { products } from "@/data/products";
import { apiUrl } from "@/lib/api-url";

export const supplierEnquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().min(6, "Please enter a phone number."),
  gstNumber: z.string().trim().optional(),
  product: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export const customerEnquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().min(6, "Please enter a phone number."),
  company: z.string().trim().optional(),
  country: z.string().trim().optional(),
  product: z.string().trim().optional(),
  quantity: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

export type SupplierEnquiryInput = z.infer<typeof supplierEnquirySchema>;
export type CustomerEnquiryInput = z.infer<typeof customerEnquirySchema>;

/**
 * The submitted `product` value goes straight into the enquiry email your sales
 * team reads, so it is the human name, not the slug. Sending `product.slug` made
 * every notification say "edible-oils" / "other-products".
 */
export const productOptions = [
  ...products.map((product) => ({
    value: product.title,
    label: product.title,
  })),
  {
    value: "general",
    label: "General enquiry",
  },
];

export async function submitEnquiry(
  data: Record<string, string>,
): Promise<{ ok: true }> {
  const response = await fetch(apiUrl("/api/enquiry"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to send enquiry.");
  }

  return { ok: true };
}

export async function submitSupplierEnquiry(
  data: SupplierEnquiryInput,
): Promise<{ ok: true }> {
  return submitEnquiry({
    formType: "supplier",
    ...data,
  });
}

export async function submitCustomerEnquiry(
  data: CustomerEnquiryInput,
): Promise<{ ok: true }> {
  return submitEnquiry({
    formType: "customer",
    ...data,
  });
}