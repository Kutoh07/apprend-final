// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import './globals.css'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Apprend+ | L'excellence mentale ancrée de manière durable",
  description: "Transforme ta vie avec notre programme de développement personnel innovant. Découvre ton potentiel, structure ton parcours et rayonne grâce à ton travail et ta détermination.",
  keywords: "développement personnel, coaching, transformation, excellence mentale, objectifs, motivation",
  authors: [{ name: "Équipe Apprend+" }],
  creator: "Apprend+",
  openGraph: {
    title: "Apprend+ | L'excellence mentale ancrée de manière durable",
    description: "Transforme ta vie avec notre programme de développement personnel innovant.",
    url: "https://apprend-plus.com",
    siteName: "Apprend+",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apprend+ | L'excellence mentale ancrée de manière durable",
    description: "Transforme ta vie avec notre programme de développement personnel innovant.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#667eea" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-gray-50 text-gray-900 selection:bg-primary-200 selection:text-primary-900`}
        suppressHydrationWarning={true}
      >
        <div id="root" className="min-h-screen flex flex-col">
          {children}
        </div>
        
        {/* Scripts pour l'amélioration progressive */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Détection du mode sombre
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
              
              // Performance monitoring
              if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                  console.log('⚡ App loaded successfully');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}