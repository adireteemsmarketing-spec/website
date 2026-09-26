import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/components/cart-provider";
import { StoreProvider } from "@/components/store-provider";
import { CurrencyProvider } from '@/components/currency-provider';
import { brand } from "@/lib/brand";
import { CustomerProvider } from "@/components/customer-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.slogan}`,
  description: brand.mission,
  icons: {
    icon: "/favicon.ico",
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // Browser extensions such as Scribe add attributes before hydration.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <CurrencyProvider><StoreProvider><CustomerProvider><CartProvider><Header />
        <main className="flex-1">{children}</main>
        <Footer /></CartProvider></CustomerProvider></StoreProvider></CurrencyProvider>
      </body>
    </html>
  );
}
