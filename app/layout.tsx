import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agence Transfert — Grand livre",
  description: "Gestion des transferts, clients et soldes",
  appleWebApp: {
    capable: true,
    title: "LS",
    statusBarStyle: "default",
  },
};

// Rendu mobile : largeur réelle de l'appareil, pas de zoom bloqué.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e7c5a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
