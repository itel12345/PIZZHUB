// src/components/contact/data/contactData.ts
//
// Same reasoning as about/data/aboutData.ts — repeated/list-based
// content lives here, separate from the components rendering it, so a
// future CMS swap only touches this file.

export interface ContactInfoCard {
  title: string;
  detail: string;
  description: string;
}

export const CONTACT_INFO: ContactInfoCard[] = [
  {
    title: "Email Us",
    detail: "itelemma0@gmail.com",
    description: "For general questions, feedback, or partnership inquiries.",
  },
  {
    title: "Call Us",
    detail: "+233 05 084 3789",
    description: "Available every day for urgent order or delivery issues.",
  },
  {
    title: "Visit Us",
    detail: "12 Independence Avenue, Accra",
    description: "Our flagship kitchen, open for pickup and dine-in.",
  },
  {
    title: "Working Hours",
    detail: "10:00 AM – 11:00 PM",
    description: "Seven days a week, including public holidays.",
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How long does delivery usually take?",
    answer:
      "Most orders arrive within 30–45 minutes, depending on your location and the delivery method you choose at checkout.",
  },
  {
    question: "Do you offer pickup instead of delivery?",
    answer:
      "Yes — select Pickup as your delivery method during checkout and your order will be ready at our location in 15–20 minutes.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We currently accept Cash on Delivery and Mobile Money, with more options on the way.",
  },
  {
    question: "Can I change my order after placing it?",
    answer:
      "Reach out to our support team as soon as possible — if your order hasn't entered preparation yet, we'll do our best to update it.",
  },
  {
    question: "Do you cater for large events?",
    answer:
      "We do! Contact us directly with your event details and we'll put together a custom order for you.",
  },
];