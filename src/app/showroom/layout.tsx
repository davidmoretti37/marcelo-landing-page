import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./showroom.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Spark Jets | Digital Showroom",
  description: "Interactive aircraft discovery experience by Spark Jets",
};

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`showroom ${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      {children}
    </div>
  );
}
