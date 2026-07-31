import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { ProfilePage } from "@/components/profile";

export const metadata: Metadata = {
  title: "My Account — PizzHub",
};

export default function Profile() {
  return (
    <>
      <Navbar />
      <main>
        <ProfilePage />
      </main>
      <Footer />
    </>
  );
}