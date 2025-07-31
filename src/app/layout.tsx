import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
// import { EnvironmentValidator } from "@/components/startup/EnvironmentValidator";
// import { validateServerEnvironment } from "@/lib/startup-validation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RewardJar - Business Loyalty Platform",
  description: "Create digital stamp cards and loyalty programs for your business. Grow customer retention with QR-based stamp collection and digital wallet integration.",
  keywords: "business loyalty platform, digital stamp cards, customer retention, QR codes, business growth",
};

// Validate environment variables at startup (server-side)
// Temporarily disabled for debugging
// try {
//   validateServerEnvironment()
// } catch (error) {
//   console.error('🚨 Server startup blocked due to environment validation failure')
//   // Error is logged, but we let the app continue to show the error UI
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
