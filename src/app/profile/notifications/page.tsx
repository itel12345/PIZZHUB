import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { NotificationsPage } from "@/components/profile";

export const metadata: Metadata = {
  title: "Notifications — PizzHub",
};

export default function NotificationsProfilePage() {
  return (
    <>
      <Navbar />
      <main>
        <NotificationsPage />
      </main>
      <Footer />
    </>
  );
}