import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SupabaseAuthSync from "@/components/startup/SupabaseAuthSync";
// import { EnvironmentValidator } from "@/components/startup/EnvironmentValidator";
// import { validateServerEnvironment } from "@/lib/startup-validation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RewardJar - Launch a Digital Loyalty Program in Minutes",
  description: "Professional digital stamp cards and membership cards designed by experts. Submit your business details, we create custom cards for Apple Wallet, Google Wallet, and web. No technical setup required.",
  keywords: "digital stamp cards, membership cards, business loyalty program, Apple Wallet, Google Wallet, customer retention, professional design, business onboarding",
};

// Validate environment variables at startup (server-side)
// Temporarily disabled for debugging
// try {
//   validateServerEnvironment()
// } catch (error) {
//   
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
        {/* Prevent theme flash: set initial dark class before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('rewardjar-theme');
                  var systemDark = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
                  var isDark = saved === 'dark' || (saved !== 'light' && systemDark);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch (_) {}
              })();
            `,
          }}
        />
        <ThemeProvider defaultTheme="system">
          {/* Sync Supabase auth state to server cookies to avoid re-login loops */}
          <SupabaseAuthSync />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
