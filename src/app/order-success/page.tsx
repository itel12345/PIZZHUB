import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import { OrderSuccessPage } from "@/components/order-success";

export const metadata: Metadata = {
  title: "Order Confirmed — PizzHub",
};

export default function OrderSuccess() {
  return (
    <>
      <Navbar />
      <main>
        {/* OrderSuccessPage reads ?orderId= via useSearchParams(), which
            requires a Suspense boundary — without it, Next.js either
            errors at build time or forces this whole route to bail out
            of static rendering implicitly. This route is inherently
            dynamic anyway (it's rendering someone's just-placed order),
            so an explicit boundary here is the correct, intentional fix
            rather than a workaround. */}
        <Suspense fallback={null}>
          <OrderSuccessPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}