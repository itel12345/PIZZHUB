import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export const metadata: Metadata = {
  title: "Contact — PizzHub",
};

export default function Contact() {
  return (
    <>
      <Navbar />
      <main>
        <PlaceholderPage
          eyebrow="Contact"
          title="This page is being plated."
          description="Reach us through the details in the footer for now — a full contact page is coming soon."
        />
      </main>
      <Footer />
    </>
  );
}