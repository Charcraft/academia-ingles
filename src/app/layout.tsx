import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "English for Healthcare Professionals | De Cero a C1",
  description:
    "Medical English training for healthcare professionals. Prepare for IELTS Academic, TOEFL iBT, and PTE Academic with specialized vocabulary and clinical communication skills. Tu meta: 120 min/día.",
  keywords: [
    "ingles medico",
    "english for nurses",
    "ielts academic preparation",
    "medical english",
    "ingles para enfermeras",
    "healthcare english",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-[#121212] font-sans text-slate-100 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
