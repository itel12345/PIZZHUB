import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export const metadata: Metadata = {
  title: "Your Profile — PizzHub",
};

export default function Profile() {
  return (
    <>
      <Navbar />
      <main>
        <PlaceholderPage
          eyebrow="Profile"
          title="Accounts aren't set up yet."
          description="Once login is connected, your profile, orders, and addresses will live here."
        />
      </main>
      <Footer />
    </>
  );
}