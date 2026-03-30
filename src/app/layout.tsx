import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AppChrome from "@/components/shared/AppChrome";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "Mythium - Premium Fashion E-Commerce",
    template: "%s | Mythium",
  },
  description:
    "Discover the latest fashion trends at Mythium. Shop premium quality clothing, accessories, and more with free shipping on orders over ৳5,000.",
  keywords: [
    "fashion",
    "clothing",
    "e-commerce",
    "online shopping",
    "Bangladesh",
    "men fashion",
    "women fashion",
    "trendy clothes",
    "Mythium",
  ],
  authors: [{ name: "Mythium" }],
  creator: "Mythium",
  publisher: "Mythium",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Mythium",
    title: "Mythium - Premium Fashion E-Commerce",
    description:
      "Discover the latest fashion trends at Mythium. Shop premium quality clothing, accessories, and more.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mythium - Premium Fashion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mythium - Premium Fashion E-Commerce",
    description:
      "Discover the latest fashion trends at Mythium. Shop premium quality clothing, accessories, and more.",
    images: ["/og-image.jpg"],
    creator: "@mythium",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans">
        <Providers>
          <AppChrome>{children}</AppChrome>
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1a1a1a",
                color: "#fff",
                borderRadius: "12px",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
