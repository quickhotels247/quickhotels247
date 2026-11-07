// Help-page answers. Keep them true to how the site works today; anything
// that depends on the rate (cancellation, refunds) points to what was shown
// at booking.
export interface Faq {
  question: string;
  answer: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  faqs: Faq[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "bookings",
    title: "Bookings",
    faqs: [
      {
        question: "How do I know my booking is confirmed?",
        answer:
          "Your booking is confirmed only once the hotel or airline has confirmed it. You'll then see it as Confirmed in My bookings. If it says \"Confirmation in progress\", please don't book again: we're waiting for the supplier and will update you.",
      },
      {
        question: "Where can I see my bookings?",
        answer:
          "Sign in and open My bookings from the account menu. Each booking shows your references, stay or flight details, what you paid and its cancellation policy. If you booked as a guest, contact us with your booking reference.",
      },
      {
        question: "Why did the price change at checkout?",
        answer:
          "Hotel and flight prices are live and can change between search and checkout. We check the price again before you pay; if it changed, we show the new price and ask you to accept it before continuing.",
      },
    ],
  },
  {
    id: "cancellations",
    title: "Cancellations and changes",
    faqs: [
      {
        question: "Can I cancel for free?",
        answer:
          "It depends on the rate. Each room shows whether it has free cancellation and until when, and the exact policy is saved with your booking. After that time, the charges shown in the policy apply.",
      },
      {
        question: "How do I cancel or change a booking?",
        answer:
          "Contact us using the form below with your booking reference and what you'd like to change. Changes depend on the hotel or airline and on availability.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments and refunds",
    faqs: [
      {
        question: "Which taxes and fees are included?",
        answer:
          "The price we show includes taxes and our fees unless it says otherwise. Some hotels charge extra at the property (for example a city tax or resort fee); when they do, it's listed under the hotel's policies before you book.",
      },
      {
        question: "When will I get my refund?",
        answer:
          "Refunds follow the cancellation policy of your booking. Once a refund is approved, it goes back to the original payment method; how long your bank takes to show it varies.",
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    faqs: [
      {
        question: "Do I need an account to book?",
        answer: "No, you can book as a guest. An account lets you see all your trips in one place, save hotels and travellers, and check out faster.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to Account → Security → Delete account. You can't delete it while a booking is upcoming or in progress. Records of past bookings are kept without your personal profile, as required for invoices.",
      },
    ],
  },
];
