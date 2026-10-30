import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

/**
 * Hand-drawn style dotted "spring" arrow
 */
function SpringArrow({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M150 12 C 85 20, 48 75, 60 125 C 68 158, 112 168, 132 148 C 146 134, 138 112, 116 116 C 98 119, 95 140, 116 153 C 140 170, 165 155, 190 150 C 205 147, 215 165, 222 178"
        strokeDasharray="0.1 8"
      />
      <path d="M222 178 L221 158 M222 178 L206 166" />
    </svg>
  );
}

export default function AboutUs() {
  return (
    <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] flex flex-col items-center selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Luxury Dark Hero Section */}
      <section className="relative w-full overflow-hidden border-b border-[#222] bg-[#0A0A0A] text-white min-h-[60vh] flex items-center justify-center">
        {/* Background Images Split */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
          <div className="relative w-full h-full opacity-60">
            <Image src="/aboutus1.jpg" alt="About Us" fill className="object-cover object-center" priority sizes="100vw" />
          </div>
          <div className="relative w-full h-full opacity-60 hidden md:block">
            <Image src="/aboutus2.jpg" alt="About Us" fill className="object-cover object-[center_20%]" priority sizes="100vw" />
          </div>
        </div>

        {/* Gradient Overlays for Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-[#0A0A0A]/20 z-10" />
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Subtle Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[650px] max-h-[650px] rounded-full blur-[150px] bg-[#D4AF37]/25" />
        </div>

        <div className="relative z-30 text-center flex flex-col items-center px-4 max-w-3xl mx-auto py-24 sm:py-32">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium mb-4 shadow-lg">
            <span>The Heritage • The Story</span>
          </div>

          <h1 className="font-outfit text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-[0.08em] uppercase text-white leading-none mb-2">
            The Story Of <br className="sm:hidden" />
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_20px_rgba(212,175,55,0.4)]">
              The Label 18
            </span>
          </h1>

          <div className="w-16 h-[1.5px] bg-[#D4AF37]/60 my-5" />

          <p className="font-outfit font-light text-xs sm:text-sm tracking-[0.18em] uppercase text-white/90 max-w-lg mx-auto">
            Growth • Positivity • Abundance • Timeless Craftsmanship
          </p>
        </div>
      </section>

      {/* 2. DUAL COMPOSITION: Warm Ivory & Gold Storytelling Body */}
      <div className="w-full max-w-[1400px] px-4 sm:px-6 lg:px-16 py-12 sm:py-20">

        {/* SECTION 1: Philosophy (Editorial Split with /aboutus.jpg) */}
        <section className="mb-20 sm:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

            {/* Left: Scattered Polaroid Collage (4 photos) */}
            <div className="lg:col-span-5 relative w-full max-w-sm mx-auto lg:max-w-none h-[540px] sm:h-[600px] lg:h-[660px] pt-16 pb-20">

              {/* Caption + dotted spring arrow */}
              <div className="absolute -top-2 left-0 z-40 max-w-[160px]">
                <p className="font-outfit font-light text-[11px] leading-snug text-[#1A1A1A]/70 mb-1">
                  The story behind every <span className="text-[#9c7d23] font-medium">stitch</span>.
                </p>
                <SpringArrow className="w-24 h-20 text-[#1A1A1A]/80 -ml-2" />
              </div>

              {/* Second caption + dotted spring arrow */}
              <div className="absolute bottom-0 inset-x-0 flex flex-col items-center z-40 text-center max-w-[190px] mx-auto">
                <SpringArrow
                  className="w-20 h-16 text-[#1A1A1A]/80"
                  style={{ transform: "scaleY(-1)" }}
                />
                <p className="mt-1 font-outfit font-light text-[11px] leading-snug text-[#1A1A1A]/70">
                  What started small soon grew into <span className="text-[#9c7d23] font-medium">a vision</span>.
                </p>
              </div>

              {/* Polaroid 1 - top right */}
              <div className="absolute top-6 right-0 w-[52%] aspect-[3/4] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] rotate-6 z-10 border border-neutral-200">
                <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                  <Image
                    src="/aboutus5.jpg"
                    alt="The Label 18 Philosophy"
                    fill
                    sizes="(max-width: 1024px) 52vw, 26vw"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Polaroid 2 - mid left */}
              <div className="absolute top-[30%] left-0 w-[56%] aspect-[4/3] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] -rotate-6 z-20 border border-neutral-200">
                <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                  <Image
                    src="/aboutus4.jpg"
                    alt="The Label 18 Philosophy"
                    fill
                    sizes="(max-width: 1024px) 56vw, 28vw"
                    className="object-cover"
                    style={{ objectPosition: "center 15%" }}
                  />
                </div>
              </div>

              {/* Polaroid 3 - bottom left */}
              <div className="absolute bottom-20 left-2 w-[40%] aspect-[3/4] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] -rotate-3 z-30 border border-neutral-200">
                <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                  <Image
                    src="/aboutus2.jpg"
                    alt="The Label 18 Philosophy"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                    style={{ objectPosition: "center 30%" }}
                  />
                </div>
              </div>

              {/* Polaroid 4 - bottom right */}
              <div className="absolute bottom-24 right-4 w-[40%] aspect-[3/4] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] rotate-4 z-40 border border-neutral-200">
                <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                  <Image
                    src="/aboutus3.jpg"
                    alt="The Label 18 Philosophy"
                    fill
                    sizes="(max-width: 1024px) 40vw, 20vw"
                    className="object-cover"
                    style={{ objectPosition: "center 75%" }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Typography */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#9c7d23] leading-snug mb-6 font-outfit font-light">
                &ldquo;Growth, positivity, abundance, confidence, and new beginnings.&rdquo;
              </h2>

              <div className="space-y-4 font-outfit font-light text-sm md:text-base text-[#1A1A1A]/80 leading-[1.9] tracking-wide max-w-2xl">
                <p>
                  <span className="text-[#1A1A1A] text-2xl font-serif font-bold mr-2">T</span>he name 18 holds a special place at the heart of our brand. Our philosophy is rooted in the continuous journey of becoming the best version of yourself, expressed entirely through what you wear.
                </p>
                <p>
                  Our brand identity draws deep inspiration from the seven chakras, symbolising absolute balance and radiant positive energy.
                </p>
                <p>
                  The lotus represents breathtaking growth and transformation, while our signature golden aesthetic mirrors prosperity, elegance, and timeless luxury that commands the room.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 2: Collections (Ivory & Gold Grid) */}
        <section className="mb-20 sm:mb-28">
          <div className="border border-[#D4AF37]/35 py-12 sm:py-16 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl px-4 sm:px-8 md:px-12">

            <div className="flex flex-col items-center text-center mb-10">
              <span className="font-outfit font-medium text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-[#9c7d23] mb-2">
                What We Offer
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-widest font-outfit uppercase">
                OUR <span className="font-semibold text-[#9c7d23]">COLLECTIONS</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x divide-[#D4AF37]/25">
              {[
                { num: "01", title: "Clothing", desc: "A curated collection ranging from timeless traditional pit-loom sarees to stylish contemporary silhouettes, selected for uncompromising quality and elegance." },
                { num: "02", title: "Jewellery", desc: "Crafted with intricate detailing, each piece adds a touch of luxury and sophistication.Adorn yourself with the timeless elegance of gold-tone imitation jewellery." },
                { num: "03", title: "Accessories", desc: "The definitive finishing touches. Carefully handcrafted elements that add profound personality, sophistication, and individuality to your signature style." }
              ].map((item, i) => (
                <div key={i} className="px-4 sm:px-6 md:px-8 py-4 text-center group">
                  <span className="block font-outfit font-bold text-xs tracking-[0.3em] text-[#9c7d23] mb-2.5 transition-transform group-hover:scale-110 duration-300">
                    {item.num}
                  </span>
                  <h3 className="font-normal text-lg sm:text-xl text-[#1A1A1A] mb-2.5 tracking-widest font-outfit uppercase">
                    {item.title}
                  </h3>
                  <p className="font-outfit font-light text-xs sm:text-sm text-[#1A1A1A]/70 leading-relaxed tracking-wide group-hover:text-[#1A1A1A] transition-colors duration-300">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <span className="inline-block border border-[#D4AF37]/40 bg-[#F8F6F0] px-6 py-2.5 rounded-full font-outfit font-medium text-[10px] tracking-[0.3em] uppercase text-[#1A1A1A]/80 shadow-sm">
                ✦ One Destination • A Complete Look ✦
              </span>
            </div>

          </div>
        </section>

        {/* SECTION 3: Founders (Magazine Split Layout with /aboutusphoto.jpg) */}
        <section>
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

            {/* Left Column: Title & Founders Photo */}
            <div className="w-full lg:w-1/3 lg:sticky lg:top-28 h-fit space-y-6">
              <div className="text-center lg:text-left">
                <span className="font-outfit font-medium text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-[#9c7d23] mb-2 block">
                  The People Behind
                </span>
                <h2 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-widest leading-tight mb-3 font-outfit uppercase">
                  MEET THE <br />
                  <span className="font-semibold text-[#9c7d23]">FOUNDERS</span>
                </h2>
                <div className="w-10 h-[1.5px] bg-[#9c7d23]/60 mb-3 mx-auto lg:mx-0" />
                <p className="font-outfit font-medium text-xs tracking-[0.25em] uppercase text-[#1A1A1A]/75">
                  Priyanka &amp; Harish
                </p>
              </div>

              {/* Founders Photo Collage (2 crossing polaroids) */}
              <div className="relative w-full max-w-xs mx-auto lg:mx-0 h-[320px] sm:h-[360px] pt-14">

                {/* Label + spring-style hand-drawn arrow */}
                <div className="absolute -top-3 right-0 z-40 text-right">
                  <span className="font-outfit font-medium text-[10px] tracking-[0.3em] uppercase text-[#9c7d23]">
                    Founders
                  </span>
                  <SpringArrow
                    className="w-20 h-16 text-[#1A1A1A]/80 ml-auto"
                    style={{ transform: "scaleX(-1)" }}
                  />
                </div>

                {/* Polaroid 1 - back */}
                <div className="absolute top-10 left-0 w-[62%] aspect-[4/5] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] -rotate-4 z-10 border border-neutral-200">
                  <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                    <Image
                      src="/founder-photo-2.jpg"
                      alt="The Founders"
                      fill
                      sizes="(max-width: 1024px) 62vw, 20vw"
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                {/* Polaroid 2 - crosses over polaroid 1 */}
                <div className="absolute bottom-0 right-0 w-[56%] aspect-[4/5] bg-white p-2 pb-6 shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] rotate-5 z-20 border border-neutral-200">
                  <div className="relative w-full h-full overflow-hidden bg-[#1A1A1A]">
                    <Image
                      src="/DSC06680.jpg"
                      alt="Priyanka & Harish - Founders of The Label 18"
                      fill
                      sizes="(max-width: 1024px) 56vw, 18vw"
                      className="object-cover object-center sm:object-[center_20%]"
                    />
                  </div>

                  {/* Instagram icon badge */}
                  <Link
                    href="https://www.instagram.com/thelabel_18?igsi=c3E5YW8weXNrajJo&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="The Label 18 on Instagram"
                    className="absolute -bottom-3 -right-3 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#9c7d23]/40 text-[#1A1A1A] hover:text-[#9c7d23] hover:border-[#9c7d23] shadow-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative */}
            <div className="lg:w-2/3">
              <div className="space-y-6 font-outfit font-light text-sm md:text-base text-[#1A1A1A]/80 leading-[1.9] tracking-wide">
                <p>
                  The Label 18 was founded by Priyanka and Harish, born from a shared vision of building a brand that goes far beyond simply selling fashion. It was designed to be an experience of elevation.
                </p>
                <p>
                  Priyanka brings her years of formidable experience in the beauty, bridal, and fashion industry. As a professional makeup artist, educator, and entrepreneur, she possesses a profound understanding of styling, colour theory, and what truly makes a woman radiate confidence. She has spent years working intimately with women, witnessing firsthand how the right styling completely transforms not just an appearance, but an aura.
                </p>

                {/* Pull Quote */}
                <blockquote className="my-8 pl-6 md:pl-8 border-l-2 border-[#9c7d23] py-3 bg-white/60 rounded-r-xl shadow-sm">
                  <p className="text-lg sm:text-xl md:text-2xl text-[#1A1A1A] leading-snug font-outfit font-light italic">
                    &ldquo;When you feel good, you carry yourself differently. When you wear confidence, you shine differently.&rdquo;
                  </p>
                </blockquote>

                <p>
                  Her ultimate vision for The Label 18 is to curate a singular sanctuary where women don&apos;t have to endlessly search multiple boutiques to piece together the perfect look. Here, clothing, exquisite jewellery, and refined accessories are thoughtfully harmonized.
                </p>
                <p>
                  Harish anchors the foundation, bringing invaluable support and strategic involvement to building the brand&apos;s day-to-day journey and long-term trajectory. Together, Priyanka and Harish have sculpted The Label 18 into a destination built purely around style, relentless positivity, and grand aspiration.
                </p>
              </div>

              <div className="mt-12 text-center lg:text-left flex items-center gap-4 justify-center lg:justify-start">
                <span className="w-8 h-[1px] bg-[#9c7d23]" />
                <span className="font-outfit font-medium text-[10.5px] tracking-[0.4em] uppercase text-[#9c7d23]">
                  The Essence of 18
                </span>
                <span className="w-8 h-[1px] bg-[#9c7d23]" />
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}