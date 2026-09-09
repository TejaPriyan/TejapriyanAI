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
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Teja Priyan AI — Official Intelligence Platform by Teja Priyan",
    description:
      "Experience next-generation multimodal intelligence created by Teja Priyan. Real-time streaming, interactive code & game preview sandbox, vision analysis, and deep analytical reasoning.",
    url: SITE_URL,
    siteName: "Teja Priyan AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/tp-badge-blue.png",
        width: 1024,
        height: 1024,
        alt: "Teja Priyan AI Official Emblem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Teja Priyan AI — Official Intelligence Platform",
    description:
      "Official multimodal AI workspace created by Teja Priyan. Built for rapid streaming, live code sandbox, visual reasoning, and deep analytical problem-solving.",
    creator: "@TejaPriyan",
    images: ["/images/tp-badge-blue.png"],
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
  // Structured Data (JSON-LD) for Google Rich Snippets, Knowledge Graph & Answer Engine Optimization (AEO)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Teja Priyan AI",
        alternateName: ["Teja Priyan", "TejaPriyan", "Teja Priyan Official AI", "Tejapriyan AI"],
        description: "The official multimodal artificial intelligence workspace by Teja Priyan.",
        publisher: {
          "@type": "Person",
          name: "Teja Priyan",
          url: SITE_URL,
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Teja Priyan",
        url: SITE_URL,
        jobTitle: "Creator of Teja Priyan AI",
        description: "Developer, engineer, and creator of Teja Priyan AI multimodal workspace.",
        sameAs: [
          SITE_URL,
          "https://github.com/TejaPriyan",
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Teja Priyan AI",
        applicationCategory: "MultimediaApplication, DeveloperApplication",
        operatingSystem: "All, Web, Windows, macOS, Linux, iOS, Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: "Teja Priyan",
        },
        featureList: [
          "Real-time token streaming with sub-second latency",
          "Interactive Live Code & Game Preview Sandbox",
          "One-Click Code File Download",
          "Native Multimodal Vision & Image Reasoning",
          "Four Adaptive Depth Tiers: Fast, Think, Max, Ultra",
          "Private Local Database Conversation History",
          "LaTeX Math Equations with KaTeX Rendering",
          "Autonomous Cognitive Failover Routing",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Who is Teja Priyan?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Teja Priyan is the creator and developer of Teja Priyan AI, an advanced multimodal artificial intelligence workspace designed for high-speed reasoning, coding, and private knowledge synthesis.",
            },
          },
          {
            "@type": "Question",
            name: "What is Teja Priyan AI?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Teja Priyan AI is the official multimodal AI workspace built by Teja Priyan. It features instant real-time streaming, interactive code preview sandbox for games and webpages, visual image understanding, and four adaptive cognitive depth tiers.",
            },
          },
          {
            "@type": "Question",
            name: "Can I preview and run code directly in Teja Priyan AI?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Teja Priyan AI includes an interactive Live Code Preview Sandbox. Users can click Preview on HTML, JavaScript, Canvas, SVG, or Game code to run interactive games and web apps with restart, fullscreen, and direct file download options.",
            },
          },
          {
            "@type": "Question",
            name: "Is Teja Priyan AI free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, Teja Priyan AI is completely free to use with zero subscriptions, no credit card requirements, and private local database session storage.",
            },
          },
        ],
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
        {/* Generative Engine Optimization (GEO) & Geographic Tags */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="Global" />
        <meta name="geo.position" content="13.0827;80.2707" />
        <meta name="ICBM" content="13.0827, 80.2707" />
        <meta name="target" content="all" />
        <meta name="audience" content="all" />
        <meta name="coverage" content="Worldwide" />
        <meta name="rating" content="General" />
        <meta name="author" content="Teja Priyan" />

        {/* Dublin Core Metadata */}
        <meta name="DC.title" content="Teja Priyan AI" />
        <meta name="DC.creator" content="Teja Priyan" />
        <meta name="DC.description" content="Official Multimodal Artificial Intelligence Platform by Teja Priyan" />
        <meta name="DC.subject" content="Teja Priyan, Teja Priyan AI, Artificial Intelligence, Autonomous Neural Architecture, Live Code Preview, Multimodal AI" />

        {/* Structured Data for Google Indexing & Answer Engines (AEO) */}
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
