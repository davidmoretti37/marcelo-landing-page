import type { Metadata } from "next";
import "./showroom.css";

export const metadata: Metadata = {
  title: "Spark Jets | Digital Showroom",
  description: "Interactive aircraft discovery experience by Spark Jets",
};

export default function ShowroomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="showroom">
      {children}
    </div>
  );
}
