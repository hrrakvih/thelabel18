// app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "The Label 18.",
  description: "Wear your energy. Express your essence.",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased overflow-x-hidden`}
        suppressHydrationWarning
      >

          {children}
          <Toaster 
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#141414',
                color: '#fff',
                fontFamily: 'Outfit, sans-serif',
                border: '1px solid #333',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#d4af37',
                  secondary: '#141414',
                },
              },
            }}
          />
    
      </body>
    </html>
  );
}