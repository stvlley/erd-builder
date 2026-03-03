import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERD Builder",
  description: "Interactive Entity Relationship Diagram Builder",
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
