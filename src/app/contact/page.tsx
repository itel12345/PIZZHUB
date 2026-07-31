import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { ContactPage } from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact Us — PizzHub",
  description: "Get in touch with the PizzHub team.",
};

export default function Contact() {
  return (
    <>
      <Navbar />
      <main>
        <ContactPage />
      </main>
      <Footer />
    </>
  );
}