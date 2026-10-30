export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      {/* Minimal luxury gold spinner */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <div
          className="absolute inset-1.5 border-2 border-[#F5E6C8]/50 border-b-transparent rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />
      </div>
    </div>
  );
}
