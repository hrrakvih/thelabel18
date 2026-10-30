import { AuthProvider } from "@/contexts/AuthContext";
import { GuestCartWishlistProvider } from "@/contexts/GuestCartWishlistContext";
// app/(shop)/layout.tsx
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider><GuestCartWishlistProvider>
      <Header />
      {children}
      <Footer />
      <FloatingWhatsApp />
    </GuestCartWishlistProvider></AuthProvider>
  );
}