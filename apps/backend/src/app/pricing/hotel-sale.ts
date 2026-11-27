const cents = (value: number) => Math.round(value * 100) / 100;

// A hotel sale under the agent model: the supplier's net (its GST included),
// our margin, and GST on that margin. The total is rounded up to whole
// rupees; the rounding stays in our margin, never in the tax.
export interface HotelSale {
  margin: number;
  marginGst: number;
  total: number;
}

export function sellHotel(net: number, margin: number, gstRate: number): HotelSale {
  if (margin <= 0) return { margin: 0, marginGst: 0, total: net };
  const marginGst = cents(margin * Math.max(0, gstRate));
  const total = Math.ceil(cents(net + margin + marginGst));
  return { margin: cents(total - net - marginGst), marginGst, total };
}
