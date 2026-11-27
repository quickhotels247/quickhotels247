import type { Money, RoomOption } from "@quickhotels/types/hotels";

const round = (value: number) => Math.round(value * 100) / 100;

// "₹9,392 + ₹1,528 taxes and fees": the price before taxes (room and our
// markup, after any promotion), the taxes and fees, and the total. The
// crossed-out regular price is shown the same way (before taxes).
export interface PriceParts {
  price: number;
  taxes: number;
  total: number;
  was: number | null;
  currency: string;
}

export function priceParts(total: Money, taxesAndFees: number | null | undefined, strikethrough?: Money | null): PriceParts {
  const taxes = round(taxesAndFees ?? 0);
  return {
    price: round(total.amount - taxes),
    taxes,
    total: total.amount,
    was: strikethrough ? round(strikethrough.amount - taxes) : null,
    currency: total.currency,
  };
}

export const roomPriceParts = (option: RoomOption) =>
  priceParts(option.totalPrice, option.priceBreakup.taxes + option.priceBreakup.managementFee + option.priceBreakup.managementFeeTax, option.strikethroughPrice);
