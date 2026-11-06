// Royalty-free Unsplash photos for the flights page. Replace with our own
// imagery or destination content later.
const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

export const flightImages = {
  hero: unsplash("1436491865332-7a61a109cc05", 2000),
  goa: unsplash("1512343879784-a960bf40e7f2", 800),
  mumbai: unsplash("1570168007204-dfb528c6958f", 800),
  delhi: unsplash("1587474260584-136574528ed5", 800),
  jaipur: unsplash("1477587458883-47145ed94245", 800),
  dubai: unsplash("1512453979798-5ea266f8880c", 800),
  singapore: unsplash("1525625293386-3f8f99389edd", 800),
  bangkok: unsplash("1508009603885-50cf7c579365", 800),
  maldives: unsplash("1514282401047-d79a71a590e8", 800),
  bali: unsplash("1537996194471-e657df975ab4", 800),
  london: unsplash("1513635269975-59663e0ac1ad", 800),
  kerala: unsplash("1593693397690-362cb9666fc2", 800),
};
