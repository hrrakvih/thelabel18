import { Truck, Shield, BadgeCheck, Globe } from "lucide-react";

const highlights = [
  {
    icon: Truck,
    title: "Express Shipping",
    desc: "Secure & expedited delivery worldwide",
  },
  {
    icon: Globe,
    title: "Free Shipping",
    desc: "Free delivery on all orders across India",
  },
  {
    icon: Shield,
    title: "Safe & Insured",
    desc: "All orders fully insured in transit",
  },
  {
    icon: BadgeCheck,
    title: "Authentic & Certified",
    desc: "100% genuine products guaranteed",
  },
];

export default function BrandPhilosophy() {
  return (
    <section className="relative bg-[#0A0A0A] text-white overflow-hidden border-y border-[#D4AF37]/20">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full blur-[120px] bg-[#D4AF37]/8" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10">

        {/* Top label */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-medium mb-3">
            The Label 18 • Delivery Promise
          </div>
          <h2 className="font-outfit text-xl sm:text-2xl md:text-3xl font-light tracking-wide text-white">
            Luxury Delivered{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#F5E6C8] via-[#E6C35C] to-[#C59B27]">
              To Your Door
            </span>
          </h2>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/60" />
            <span className="text-[#D4AF37]/60 text-[10px] tracking-[0.3em] uppercase font-serif">✦ 18 ✦</span>
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/60" />
          </div>
        </div>

        {/* 4-column highlight strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex flex-col items-center text-center gap-3 p-4 sm:p-5 rounded-xl border border-[#D4AF37]/15 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4AF37]/40 transition-all duration-400"
              >
                {/* Icon ring */}
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#F5E6C8] via-[#E6C35C] to-[#C59B27] p-[1.5px] shadow-[0_0_12px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.35)] transition-shadow duration-400">
                  <div className="w-full h-full rounded-full bg-[#0A0A0A] flex items-center justify-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="font-outfit text-xs sm:text-sm font-semibold text-white tracking-wide mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-[10px] sm:text-[11px] text-white/35 uppercase tracking-[0.2em] font-light mt-6 sm:mt-8">
          All orders are carefully packaged and fully insured for safe delivery
        </p>

      </div>
    </section>
  );
}
