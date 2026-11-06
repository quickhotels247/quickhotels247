import type { FaqEntry } from "./types";

// General answers. CONFIRM BEFORE LAUNCH: anything about our fees, payment or
// cancellations must match the final terms and TripJack's rules (spec §3.4).
export const flightFaqs: FaqEntry[] = [
  {
    id: "cheapest",
    question: "How do I find the cheapest flights?",
    answer:
      "Be flexible: compare nearby dates and airports, check one-stop flights as well as direct ones, and book early for busy dates like holidays and long weekends. Sort results by price to see the lowest fares first.",
  },
  {
    id: "one-way",
    question: "Can I book one-way flights?",
    answer: "Yes. Choose One-way in the search bar, then pick your route, date and travellers.",
  },
  {
    id: "multi-city",
    question: "Can I book a trip with several stops?",
    answer: "Yes. Choose Multi-city and add up to five flights, each with its own route and date.",
  },
  {
    id: "advance",
    question: "How far in advance can I book a flight?",
    answer:
      "Airlines usually open bookings several months ahead, often up to about a year. How far ahead you can book depends on the airline and route.",
  },
  {
    id: "closer",
    question: "Do flights get cheaper closer to departure?",
    answer:
      "Usually not. Fares tend to rise as seats sell, especially in the last few weeks. Last-minute deals do happen, but booking earlier is the safer choice.",
  },
  {
    id: "fees",
    question: "Are there extra fees when I pay?",
    answer:
      "The full price, including taxes and any fees, is shown in the price breakdown before you pay. Nothing is added after you confirm.",
  },
];
