import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tejapriyan.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Teja Priyan AI — Official Intelligence Platform by Teja Priyan",
    template: "%s | Teja Priyan AI",
  },
  description:
    "Official multimodal AI workspace created by Teja Priyan. Features real-time streaming, image reasoning, four adaptive depth tiers, and structured analysis with zero friction.",
  keywords: [
    "Teja Priyan",
    "Teja Priyan AI",
    "TejaPriyan",
    "Teja Priyan Official",
    "Teja Priyan Website",
    "Teja Priyan Assistant",
    "Teja Priyan Artificial Intelligence",
    "Teja Priyan Portfolio",
    "Multimodal AI",
    "AI Workspace",
    "Streaming AI",
  ],
  authors: [{ name: "Teja Priyan", url: SITE_URL }],
  creator: "Teja Priyan",
  publisher: "Teja Priyan",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Teja Priyan AI — Official Intelligence Platform by Teja Priyan",
    description:
      "Experience next-generation multimodal intelligence created by Teja Priyan. Real-time streaming, vision analysis, and deep analytical reasoning.",
    url: SITE_URL,
    siteName: "Teja Priyan AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teja Priyan AI — Official Intelligence Platform",
    description:
      "Official multimodal AI workspace created by Teja Priyan. Built for rapid streaming, visual reasoning, and deep analytical problem-solving.",
    creator: "@TejaPriyan",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
    { media: "(prefers-color-scheme: dark)",  color: "#0c0c12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Structured Data (JSON-LD) for Google Rich Snippets and Knowledge Graph
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Teja Priyan AI",
        alternateName: ["Teja Priyan", "TejaPriyan", "Teja Priyan Official AI"],
        description: "The official multimodal artificial intelligence workspace by Teja Priyan.",
        publisher: {
          "@type": "Person",
          name: "Teja Priyan",
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Teja Priyan",
        url: SITE_URL,
        jobTitle: "Creator of Teja Priyan AI",
        description: "Developer and creator of Teja Priyan AI multimodal workspace.",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Teja Priyan AI",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Teja Priyan",
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrument.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* Structured Data for Google Indexing */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Apply stored theme before paint — avoids flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tp_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
