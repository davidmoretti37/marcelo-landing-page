import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import GSAPProvider from "@/components/providers/GSAPProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["200", "300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Spark Jets | Elevating Excellence in Aviation",
  description:
    "Aircraft Sales, Acquisition & Management. Founded by international aviation veteran Marcelo Borin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-cream text-navy" suppressHydrationWarning>
        <LenisProvider>
          <GSAPProvider>
            <main>{children}</main>
          </GSAPProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
