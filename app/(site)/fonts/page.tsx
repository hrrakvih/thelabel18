export default function FontsPreviewPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F0] text-[#1A1A1A] pt-32 pb-24 px-6">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Cinzel:wght@400;600&family=Montserrat:wght@300;400&family=Lato:wght@300;400&family=Inter:wght@300;400&family=Outfit:wght@300;400;600&display=swap');
      `}} />
      
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-outfit tracking-widest uppercase mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Font Showcase</h1>
          <p className="text-sm text-[#1A1A1A]/60" style={{ fontFamily: 'Outfit, sans-serif' }}>Review the 4 luxury font pairings below to choose the perfect vibe for your brand.</p>
        </div>

        {/* Option 1 */}
        <div className="border border-[#1A1A1A]/10 p-10 rounded-2xl bg-white shadow-sm hover:border-[#9c7d23] transition-colors">
          <div className="mb-6 border-b border-[#1A1A1A]/10 pb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#9c7d23] font-outfit" style={{ fontFamily: 'Inter, sans-serif' }}>Option 1: The Modern Editorial</span>
            <p className="text-sm text-[#1A1A1A]/50 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Playfair Display (Headings) + Inter (Body)</p>
          </div>
          <h2 className="text-5xl mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Shop the edit.</h2>
          <h3 className="text-xl mb-4 uppercase tracking-widest" style={{ fontFamily: '"Playfair Display", serif' }}>Luxury Handbags</h3>
          <p className="text-sm leading-relaxed text-[#1A1A1A]/70 max-w-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
            Discover our curated collection of timeless pieces. Each item is meticulously crafted to bring an element of modern sophistication to your everyday wardrobe.
          </p>
          <button className="mt-6 px-8 py-3 bg-[#1A1A1A] text-white text-[11px] tracking-[0.2em] uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            Explore Collection
          </button>
        </div>

        {/* Option 2 */}
        <div className="border border-[#1A1A1A]/10 p-10 rounded-2xl bg-white shadow-sm hover:border-[#9c7d23] transition-colors">
          <div className="mb-6 border-b border-[#1A1A1A]/10 pb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#9c7d23] font-outfit" style={{ fontFamily: 'Montserrat, sans-serif' }}>Option 2: The Heritage Luxury</span>
            <p className="text-sm text-[#1A1A1A]/50 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>Cormorant Garamond (Headings) + Montserrat (Body)</p>
          </div>
          <h2 className="text-5xl mb-4" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Shop the edit.</h2>
          <h3 className="text-xl mb-4 uppercase tracking-widest" style={{ fontFamily: '"Cormorant Garamond", serif' }}>Luxury Handbags</h3>
          <p className="text-sm leading-relaxed text-[#1A1A1A]/70 max-w-lg tracking-wide" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 300 }}>
            Discover our curated collection of timeless pieces. Each item is meticulously crafted to bring an element of modern sophistication to your everyday wardrobe.
          </p>
          <button className="mt-6 px-8 py-3 bg-[#1A1A1A] text-white text-[11px] tracking-[0.2em] uppercase" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Explore Collection
          </button>
        </div>

        {/* Option 3 */}
        <div className="border border-[#1A1A1A]/10 p-10 rounded-2xl bg-white shadow-sm hover:border-[#9c7d23] transition-colors">
          <div className="mb-6 border-b border-[#1A1A1A]/10 pb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#9c7d23] font-outfit" style={{ fontFamily: 'Lato, sans-serif' }}>Option 3: The Bold Contemporary</span>
            <p className="text-sm text-[#1A1A1A]/50 mt-1" style={{ fontFamily: 'Lato, sans-serif' }}>Cinzel (Headings) + Lato (Body)</p>
          </div>
          <h2 className="text-5xl mb-4 uppercase" style={{ fontFamily: '"Cinzel", serif' }}>Shop the edit.</h2>
          <h3 className="text-xl mb-4 uppercase tracking-widest" style={{ fontFamily: '"Cinzel", serif' }}>Luxury Handbags</h3>
          <p className="text-[15px] leading-relaxed text-[#1A1A1A]/70 max-w-lg" style={{ fontFamily: 'Lato, sans-serif', fontWeight: 300 }}>
            Discover our curated collection of timeless pieces. Each item is meticulously crafted to bring an element of modern sophistication to your everyday wardrobe.
          </p>
          <button className="mt-6 px-8 py-3 bg-[#1A1A1A] text-white text-[11px] tracking-[0.2em] uppercase font-outfit" style={{ fontFamily: 'Lato, sans-serif' }}>
            Explore Collection
          </button>
        </div>

        {/* Option 4 */}
        <div className="border border-[#1A1A1A]/10 p-10 rounded-2xl bg-white shadow-sm hover:border-[#9c7d23] transition-colors">
          <div className="mb-6 border-b border-[#1A1A1A]/10 pb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#9c7d23] font-outfit" style={{ fontFamily: 'Outfit, sans-serif' }}>Option 4: The Clean Minimalist</span>
            <p className="text-sm text-[#1A1A1A]/50 mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Outfit (Headings) + Outfit (Body)</p>
          </div>
          <h2 className="text-5xl mb-4 tracking-tight" style={{ fontFamily: '"Outfit", sans-serif' }}>Shop the edit.</h2>
          <h3 className="text-xl mb-4 uppercase tracking-widest font-outfit" style={{ fontFamily: '"Outfit", sans-serif' }}>Luxury Handbags</h3>
          <p className="text-sm leading-relaxed text-[#1A1A1A]/70 max-w-lg font-outfit" style={{ fontFamily: '"Outfit", sans-serif' }}>
            Discover our curated collection of timeless pieces. Each item is meticulously crafted to bring an element of modern sophistication to your everyday wardrobe.
          </p>
          <button className="mt-6 px-8 py-3 bg-[#1A1A1A] text-white text-[11px] tracking-[0.2em] uppercase font-outfit" style={{ fontFamily: '"Outfit", sans-serif' }}>
            Explore Collection
          </button>
        </div>

      </div>
    </main>
  );
}
