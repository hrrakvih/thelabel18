
export default function PrivacyPolicy() {
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
            Privacy{" "}
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FBF5E8] via-[#E6C35C] to-[#C59B27] drop-shadow-[0_2px_20px_rgba(212,175,55,0.4)]">
              Policy
            </span>
          </h1>

          <div className="w-10 h-[1.5px] bg-[#D4AF37]/60 my-3.5" />

          <p className="font-outfit font-light text-xs sm:text-sm tracking-[0.15em] uppercase text-white/75 max-w-lg mx-auto">
            Your Trust Is Our Foremost Commitment
          </p>
        </div>
      </section>

      {/* 2. DUAL COMPOSITION: Warm Cream Reading Body */}
      <section className="w-full flex justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-16">
        <div className="w-full max-w-4xl font-outfit font-light text-[#1A1A1A]/80 leading-[2.1] tracking-wide text-sm md:text-base space-y-12 sm:space-y-16">

          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#D4AF37]/35 shadow-sm">
            <p className="text-lg sm:text-xl md:text-2xl italic text-[#1A1A1A]/90 leading-relaxed text-center font-light">
              &ldquo;At The Label 18, we value and respect your privacy. This Privacy Policy explains how we collect, use, store and protect your personal information when you browse our website, make a purchase or communicate with us.&rdquo;
            </p>
          </div>

          {[
            {
              title: "Introduction",
              content: "At The Label 18, we value and respect your privacy. This Privacy Policy explains how we collect, use, store and protect your personal information when you browse our website, make a purchase or communicate with us."
            },
            {
              title: "Information We Collect",
              content: "We may collect information such as your name and contact number, email address, billing and shipping address, order and purchase history, payment-related information processed securely through authorised third-party payment providers, website browsing and device information, as well as communications, enquiries and customer-support information."
            },
            {
              title: "How We Use Your Information",
              content: "Your personal information may be used to process and deliver orders, provide order updates, respond to customer-support requests, process returns/refunds, improve our products and website experience, prevent fraudulent transactions and comply with legal requirements. With your consent, where required, we may also send you promotional offers, collection launches and marketing communications."
            },
            {
              title: "Sharing of Information",
              content: "We do not sell your personal information. Where necessary to fulfil your order or operate our website, information may be shared with trusted service providers such as courier companies, payment gateways, website/hosting providers and other service partners. Information may also be disclosed where required by applicable law."
            },
            {
              title: "Data Security",
              content: "We use reasonable security measures and trusted payment gateways to protect customer information. However, no method of internet transmission or electronic storage can be guaranteed to be completely secure."
            },
            {
              title: "Cookies",
              content: "Our website may use cookies and similar technologies to improve website functionality, remember preferences, analyse website performance and enhance your shopping experience. Depending on your browser and the technologies used on our website, you may be able to manage or disable certain cookies through your browser or cookie-preference settings."
            },
            {
              title: "Your Privacy Rights",
              content: "Subject to applicable law, you may request access to or correction of your personal information and exercise other privacy rights available to you. You may also unsubscribe from promotional emails or marketing communications."
            },
            {
              title: "Third-Party Services",
              content: "Our website may use third-party services such as payment gateways, courier providers, analytics tools or social-media platforms. These third parties may have their own privacy policies governing their processing of information."
            },
            {
              title: "Changes to This Privacy Policy",
              content: "The Label 18 may update this Privacy Policy periodically. Any revised version will be published on our website along with the updated effective date."
            },
            {
              title: "Contact Us",
              content: "For questions regarding orders, returns, privacy or personal information, customers may contact us using the details provided on our website or footer."
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