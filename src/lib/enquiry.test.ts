import assert from "node:assert/strict";
import test from "node:test";

import {
  customerEnquirySchema,
  supplierEnquirySchema,
} from "./enquiry.ts";

test("supplier schema accepts supplier details and rejects extra quantity/company fields", () => {
  const valid = supplierEnquirySchema.parse({
    name: "Asha Kumar",
    email: "asha@example.com",
    phone: "9876543210",
    gstNumber: "27ABCDE1234F1Z5",
    product: "spices",
    message: "We have a steady supply available for export.",
  });

  assert.equal(valid.gstNumber, "27ABCDE1234F1Z5");
  assert.equal(valid.product, "spices");

  assert.throws(() => {
    supplierEnquirySchema.parse({
      name: "Asha Kumar",
      email: "asha@example.com",
      phone: "9876543210",
      gstNumber: "",
      product: "spices",
      message: "We have a steady supply available for export.",
    });
  });
});

test("customer enquiry schema keeps quantity and description fields", () => {
  const valid = customerEnquirySchema.parse({
    name: "Rahul Verma",
    company: "Global Trade Co.",
    email: "rahul@example.com",
    phone: "9123456789",
    country: "United Arab Emirates",
    product: "nuts",
    quantity: "500 cartons",
    message: "We need a competitive price and shipment plan.",
  });

  assert.equal(valid.quantity, "500 cartons");
  assert.equal(valid.message, "We need a competitive price and shipment plan.");
});
