import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RewardJar - Business Loyalty Platform",
  description: "Create digital stamp cards and loyalty programs for your business. Grow customer retention with QR-based stamp collection and digital wallet integration.",
  keywords: "business loyalty platform, digital stamp cards, customer retention, QR codes, business growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
