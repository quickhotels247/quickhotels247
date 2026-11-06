// Royalty-free Unsplash photos for destination, property-type and offer
// tiles. Hotel photos come from TripJack content.
const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

export const homeImages = {
  hero: unsplash("1566073771259-6a8506099945", 2000),
  bali: unsplash("1537996194471-e657df975ab4", 800),
  dubai: unsplash("1512453979798-5ea266f8880c", 800),
  paris: unsplash("1502602898657-3e91760cbb34", 800),
  newYork: unsplash("1496442226666-8d4d0e62e6e9", 800),
  grandVista: unsplash("1571896349842-33c89424de2d", 800),
  azureBay: unsplash("1540541338287-41700207dee6", 800),
  palmCove: unsplash("1582719508461-905c673771fd", 800),
  jungleRetreat: unsplash("1520250497591-112f2f40a3f4", 800),
  // India
  goa: unsplash("1512343879784-a960bf40e7f2", 800),
  jaipur: unsplash("1477587458883-47145ed94245", 800),
  mumbai: unsplash("1570168007204-dfb528c6958f", 800),
  delhi: unsplash("1587474260584-136574528ed5", 800),
  agra: unsplash("1564507592333-c60657eea523", 800),
  kerala: unsplash("1593693397690-362cb9666fc2", 800),
  manali: unsplash("1626621341517-bbf3d9990a23", 800),
  shimla: unsplash("1597074866923-dc0589150358", 800),
  darjeeling: unsplash("1544634076-a90160ddf44c", 800),
  andaman: unsplash("1586500036706-41963de24d8b", 800),
  // Property types and offers
  hotelRoom: unsplash("1611892440504-42a792e24d32", 800),
  resort: unsplash("1571003123894-1f0594d2b5d9", 800),
  villa: unsplash("1613490493576-7fde63acd811", 800),
  apartment: unsplash("1522708323590-d24dbb6b0267", 800),
  homestay: unsplash("1505691938895-1758d7feb511", 800),
  beachHut: unsplash("1499793983690-e29da59ef1c2", 900),
  spa: unsplash("1540555700478-4be289fbecef", 900),
};
