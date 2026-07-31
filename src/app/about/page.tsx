import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { AboutPage } from "@/components/about";

export const metadata: Metadata = {
  title: "About Us — PizzHub",
  description: "The story, values, and people behind PizzHub.",
};

export default function About() {
  return (
    <>
      <Navbar />
      <main>
        <AboutPage />
      </main>
      <Footer />
    </>
  );
}