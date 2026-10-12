import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { SavedAddressesPage } from "@/components/profile";

export const metadata: Metadata = {
  title: "Saved Addresses — PizzHub",
};

export default function AddressesProfilePage() {
  return (
    <>
      <Navbar />
      <main>
        <SavedAddressesPage />
      </main>
      <Footer />
    </>
  );
}