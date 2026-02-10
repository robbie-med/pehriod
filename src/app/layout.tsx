import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pehriod - Period Pain Management",
  description: "Empowering period pain tracking and education.",
  manifest: "/manifest.json", 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}