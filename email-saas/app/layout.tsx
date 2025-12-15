import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SendBear - Email Marketing That Doesn't Bite",
  description:
    "Affordable email marketing for small businesses. Send professional campaigns for $9/month instead of $300.",
  keywords: [
    "email marketing",
    "mailchimp alternative",
    "cheap email marketing",
    "bulk email sender",
    "sendbear",
  ],
  openGraph: {
    title: "SendBear - Email Marketing That Doesn't Bite",
    description: "Send professional campaigns for $9/month instead of $300",
    url: "https://sendbear.co",
    siteName: "SendBear",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SendBear - Email Marketing That Doesn't Bite",
    description: "Send professional campaigns for $9/month instead of $300",
    images: ["/og-image.png"],
  },
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
