import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'

// Temporarily disabled Google Fonts for build testing
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Apprend+",
  description: "L'excellence mentale ancrée de manière durable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}