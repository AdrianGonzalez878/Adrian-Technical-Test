import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Karimnot",
  description: "User Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We remove the 'inter.className' to avoid the conflict */}
      <body>{children}</body>
    </html>
  );
}