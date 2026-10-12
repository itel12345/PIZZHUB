import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import BackgroundGlow from "@/components/effects/BackgroundGlow";

import { FavoritesProvider } from "@/components/favorites";
import { CartProvider, CartToastProvider } from "@/components/cart";
import { AuthProvider } from "@/components/auth";
import { ThemeProvider } from "@/components/theme";
import { noFlashThemeScript } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PizzHub",
  description: "Fresh and delicious pizzas delivered to your door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // Same reasoning as the <body> suppressHydrationWarning just
      // below, extended to <html>: the no-flash script in <head> sets
      // data-theme on this element synchronously before React
      // hydrates (that's the entire point — see lib/theme.ts), which
      // would otherwise be flagged as a hydration mismatch even though
      // it's expected and intentional. Only suppresses attribute
      // warnings on this one element, same as the existing usage below.
      suppressHydrationWarning
    >
      <head>
        {/* Sets data-theme on <html> before first paint so a returning
            visitor who chose "light" never sees a flash of the default
            dark theme while React hydrates and ThemeProvider mounts —
            see lib/theme.ts's noFlashThemeScript for why this has to be
            a real inline script rather than a React effect. */}
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript() }} />
      </head>
      {/*
        suppressHydrationWarning here (Next.js's own recommended fix, see
        https://nextjs.org/docs/messages/react-hydration-error) tells
        React to skip mismatch warnings for direct attribute changes on
        <body> specifically — e.g. bis_skin_checked, injected by some
        antivirus "web protection" tools before React hydrates. It does
        NOT suppress mismatches anywhere else in the tree, so a real bug
        in a component further down would still show up normally.
      */}
      <body suppressHydrationWarning>
        {/* The one, global instance — page-specific copies previously
            in menu/page.tsx and StoryExperience.tsx were removed in
            favor of this single instance, so every page gets the exact
            same background treatment instead of some pages having
            their own separate copy and others having none at all. */}
        <BackgroundGlow />

        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <CartToastProvider>{children}</CartToastProvider>
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}