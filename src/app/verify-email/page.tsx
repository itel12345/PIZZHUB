import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/footer/Footer";
import VerifyEmailPanel from "@/components/auth/pages/VerifyEmailPanel";

// The one-time token lives in the URL: keep these pages out of search
// results and never send it onward in a Referer header.
export const metadata: Metadata = {
  title: "Verify your email — PizzHub",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <Navbar />
      <main>
        <VerifyEmailPanel token={typeof token === "string" && token ? token : null} />
      </main>
      <Footer />
    </>
  );
}
