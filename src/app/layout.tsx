import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, B612_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/providers/LenisProvider";
import GSAPProvider from "@/components/providers/GSAPProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["200", "300", "400"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const b612 = B612_Mono({
  subsets: ["latin"],
  variable: "--font-b612",
  weight: "400",
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
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${b612.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <LenisProvider>
          <GSAPProvider>
            <main>{children}</main>
          </GSAPProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
