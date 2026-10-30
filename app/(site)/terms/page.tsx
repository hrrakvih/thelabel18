
export default function TermsAndConditions() {
  return (
    <main className="w-full min-h-screen bg-[#F8F6F0] text-[#1A1A1A] selection:bg-[#D4AF37]/30 selection:text-[#1A1A1A] pt-20 sm:pt-24">
      {/* 1. DUAL COMPOSITION: Luxury Dark Hero Section */}
      <section className="relative w-full overflow-hidden border-b border-[#222] bg-[#0A0A0A] py-14 sm:py-20 text-white">
        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[650px] max-h-[650px] rounded-full blur-[150px] bg-[#D4AF37]/12" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative z-10 text-center flex flex-col items-center px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/40 text-[#F5E6C8] text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-medium mb-3 shadow-md">
            
            <span>Legal &amp; Transparency</span>
          </div>

          <h1 className="font-outfit text-3xl sm:text-5xl md:text-6xl font-light tracking-wide uppercase text-white leading-tight">
            Terms &amp;{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_20px_rgba(212,175,55,0.4)]">
              Conditions
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-3.5" />

          <p className="font-outfit font-light text-xs sm:text-sm tracking-[0.15em] uppercase text-white/75 max-w-lg mx-auto">
            Clear Guidelines For An Impeccable Experience
          </p>
        </div>
      </section>

      {/* 2. DUAL COMPOSITION: Warm Cream Reading Body */}
      <section className="w-full flex justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-4xl font-outfit font-light text-[#1A1A1A]/80 leading-[2.1] tracking-wide text-sm md:text-base space-y-12 sm:space-y-16">

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <p className="text-lg sm:text-xl md:text-2xl italic text-[#1A1A1A]/90 leading-relaxed text-center font-light">
              &ldquo;By accessing, browsing, or purchasing from The Label 18 website, you agree to these Terms &amp; Conditions. We strive to provide an impeccable experience.&rdquo;
            </p>
          </div>

          {[
            {
              title: "General",
              content: "By accessing, browsing, or purchasing from The Label 18 website, you agree to these Terms & Conditions. The Label 18 reserves the right to modify or update these terms when required. Any revised terms will be applicable once published on the website."
            },
            {
              title: "Products",
              content: "All products are subject to availability. We make every effort to accurately display product colours, designs and descriptions. However, colours may vary slightly depending on screen settings, lighting and photography. Certain jewellery, accessories, fabrics or handcrafted products may have minor variations or natural imperfections. These variations are part of the nature of the product and may not be considered defects."
            },
            {
              title: "Orders & Payments",
              content: "Orders will be confirmed only after successful payment. Payments must be made through the payment methods available on our website. Once an order has been processed or dispatched, it cannot normally be modified or cancelled."
            },
            {
              title: "Shipping & Delivery",
              content: "Orders will be processed according to the shipping timeline mentioned on our website. Delivery time may vary depending on the customer’s location and courier partner. The Label 18 will make reasonable efforts to ensure timely delivery but cannot be held responsible for delays caused by circumstances beyond our control, including courier delays, weather conditions, strikes, natural events or other unforeseen circumstances."
            },
            {
              title: "Returns & Exchanges",
              content: "Returns or exchanges will be accepted only according to the return/exchange policy displayed on our website. Eligible products must be unused, unworn, unwashed and returned in their original condition with tags and packaging intact. For hygiene reasons, certain jewellery and accessories may be non-returnable unless they are received damaged, defective or incorrect. Sale, discounted, customised or made-to-order products may be non-returnable or non-exchangeable where this is clearly mentioned at the time of purchase. If you receive a damaged, defective or incorrect product, please contact The Label 18 within the return period mentioned on our website, along with photographs or an unboxing video where required."
            },
            {
              title: "Refunds",
              content: "Once a return is inspected and approved, the applicable refund will be initiated to the original payment method. The time required for the amount to reflect in your account may depend on your bank or payment provider."
            },
            {
              title: "Intellectual Property",
              content: "All content appearing on The Label 18 website—including the brand name, logo, photographs, product images, videos, graphics, designs and written content—is the property of The Label 18 or its respective licensors. Unauthorised copying, reproduction, commercial use or distribution is prohibited."
            },
            {
              title: "Limitation of Liability",
              content: "To the extent permitted by applicable law, The Label 18 shall not be responsible for indirect, incidental or consequential losses resulting from misuse of our website or products. Nothing in these Terms & Conditions limits any statutory consumer rights available under applicable law."
            },
            {
              title: "Governing Law",
              content: "These Terms & Conditions shall be governed by the laws of India. Subject to applicable consumer laws, disputes shall fall under the jurisdiction of the competent courts in Bengaluru, Karnataka."
            }
          ].map((section, idx) => (
            <div key={idx} className="relative pl-6 sm:pl-10 border-l-2 border-[#D4AF37]/30 hover:border-[#D4AF37] transition-colors duration-300">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#F8F6F0] border-2 border-[#D4AF37] shadow-sm" />
              <h2 className="text-lg sm:text-xl md:text-2xl text-[#1A1A1A] tracking-wide mb-2 font-normal font-outfit">
                <span className="text-[#9c7d23] mr-3 font-mono text-sm font-semibold">{String(idx + 1).padStart(2, '0')}.</span>
                {section.title}
              </h2>
              <p className="text-[#1A1A1A]/75">{section.content}</p>
            </div>
          ))}

        </div>
      </section>
    </main>
  );
}