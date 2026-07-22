import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export const metadata: Metadata = {
  title: "About — PizzHub",
};

export default function About() {
  return (
    <>
      <Navbar />
      <main>
        <PlaceholderPage
          eyebrow="About"
          title="Our story is still being written."
          description="This page is on the way. In the meantime, come see what's on the menu."
        />
      </main>
      <Footer />
    </>
  );
}