import { ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { SupplierError, supplierHttpError } from "./supplier-error.js";

describe("supplierHttpError", () => {
  it("tells guests when their nationality can't book, instead of 'not available'", () => {
    const error = supplierHttpError(new SupplierError("NATIONALITY_RESTRICTED", "6534", "tripjack", "abcdef123456"), "Checking room prices");
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.message).toMatch(/chosen nationality can't book this/);
    expect(error.message).toMatch(/Reference: abcdef12/);
  });

  it("keeps the general message for other failures", () => {
    expect(supplierHttpError(new SupplierError("UNAVAILABLE", "x", "tripjack", "ref12345"))).toBeInstanceOf(ServiceUnavailableException);
  });
});
