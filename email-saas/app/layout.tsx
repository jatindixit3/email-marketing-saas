import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "[YOUR_NAME] - Email Marketing for $9/month",
  description:
    "Professional email marketing platform that's 10x cheaper than Mailchimp. Send unlimited emails, build your audience, and grow your business.",
  keywords: [
    "email marketing",
    "mailchimp alternative",
    "cheap email marketing",
    "email automation",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
