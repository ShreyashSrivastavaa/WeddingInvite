import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import {
  Sparkles,
  Smartphone,
  Laptop,
  Check,
  Heart,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Palette,
  ShieldCheck,
  Users,
  Send,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface WebsiteTheme {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  bg: string;
  cardBg: string;
  text: string;
  font: string;
  previewImage: string;
}

const THEMES: WebsiteTheme[] = [
  {
    id: 'ROYAL_IVORY_MAROON',
    name: 'Royal Ivory & Maroon',
    tagline: 'Regal Indian palace aesthetic with gold foil borders and rich crimson touches.',
    primary: '#7a192c',
    secondary: '#d4af37',
    bg: '#fdfbf7',
    cardBg: '#ffffff',
    text: '#1f2937',
    font: 'font-serif',
    previewImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'GOLDEN_SAFFRON',
    name: 'Golden Saffron & Marigold',
    tagline: 'Warm, auspicious, and joyfully festive with turmeric and brass tones.',
    primary: '#b45309',
    secondary: '#eab308',
    bg: '#fffdfa',
    cardBg: '#ffffff',
    text: '#1f2937',
    font: 'font-serif',
    previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'PEACOCK_TEAL',
    name: 'Peacock Teal & Gold',
    tagline: 'Luxurious jewel tones with champagne accents for an imperial celebration.',
    primary: '#0f766e',
    secondary: '#d4af37',
    bg: '#f4fbf9',
    cardBg: '#ffffff',
    text: '#134e4a',
    font: 'font-serif',
    previewImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ROSE_PALACE',
    name: 'Rose Palace & Ruby',
    tagline: 'Modern romance with blush petals, vintage serif titles, and pearl textures.',
    primary: '#9f1239',
    secondary: '#f43f5e',
    bg: '#fff5f7',
    cardBg: '#ffffff',
    text: '#4c0519',
    font: 'font-serif',
    previewImage: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'FORNER_EARTHEN',
    name: 'Warm Earthen Atelier',
    tagline: 'Ceramic atelier minimalism: roasted coffee ink, bone canvas, and sandstone.',
    primary: '#484036',
    secondary: '#cacab0',
    bg: '#faf5eb',
    cardBg: '#ecece4',
    text: '#484036',
    font: 'font-sans',
    previewImage: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=600&q=80',
  },
];

export const WeddingWebsitesPage: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<WebsiteTheme>(THEMES[0]);
  const [viewDevice, setViewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const faqs = [
    {
      q: 'Is creating a wedding website really 100% free?',
      a: 'Yes! You can create, edit, customize, and share your wedding website with all guests completely free of charge. There are no surprise fees or paywalls for RSVP collecting.',
    },
    {
      q: 'Can guests RSVP directly on our wedding website?',
      a: 'Absolutely. Guests receive personalized links or can look up their invitation to respond for each celebration event (Mehendi, Sangeet, Wedding, Reception), choose their meal preferences (Vegetarian, Jain, Vegan, etc.), and specify expected arrival times.',
    },
    {
      q: 'How does WhatsApp RSVP synchronization work?',
      a: 'Every guest is automatically provisioned a unique one-click RSVP link. You can send polite automated WhatsApp reminders directly from your dashboard with single-click delivery.',
    },
    {
      q: 'Can we password-protect our wedding website or keep it private?',
      a: 'Yes, your wedding website and RSVP forms can be strictly invitation-only with secure guest tokens, ensuring uninvited guests cannot access private venue details.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf5eb] text-[#484036] flex flex-col font-sans">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#ecece4] border-b border-[#cacab0] py-14 sm:py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-maroon-700/10 text-maroon-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-maroon-700" />
            <span>The Knot-Inspired Website Studio</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-6xl font-bold text-[#33302c] tracking-tight max-w-3xl mx-auto leading-[1.15]">
            Customize your free wedding website
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#666e72] max-w-2xl mx-auto leading-relaxed">
            Stunning, mobile-responsive wedding websites that match your celebration aesthetic, manage RSVPs seamlessly, and tell your unique love story.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Start Your Free Website</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#designs"
              className="px-6 py-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              Explore All Designs ↓
            </a>
          </div>

          {/* Social Proof Badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-emerald-600" /> 100% Free Forever
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-emerald-600" /> WhatsApp & Web RSVP Sync
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-emerald-600" /> Multi-Event Support
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-emerald-600" /> Bilingual English / Hindi
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Live Mockup & Design Studio */}
      <section id="designs" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
            Pick Your Aesthetic
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#33302c] mt-2">
            Designs crafted for unforgettable unions
          </h2>
          <p className="text-sm text-[#666e72] mt-2">
            Switch between curated palettes to see how your wedding website looks on mobile and desktop devices.
          </p>

          {/* Device Toggle */}
          <div className="mt-6 inline-flex p-1 bg-[#ecece4] rounded-xl border border-stone-300 shadow-inner">
            <button
              onClick={() => setViewDevice('mobile')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewDevice === 'mobile'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Smartphone size={14} />
              <span>Mobile Phone</span>
            </button>
            <button
              onClick={() => setViewDevice('desktop')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewDevice === 'desktop'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Laptop size={14} />
              <span>Desktop Tablet</span>
            </button>
          </div>
        </div>

        {/* Layout: Themes Column + Interactive Device Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Theme Selector list (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
              Curated Style Presets
            </span>
            {THEMES.map((theme) => {
              const isSelected = selectedTheme.id === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-white border-maroon-700 shadow-md ring-2 ring-maroon-700/20'
                      : 'bg-white/70 hover:bg-white border-[#cacab0] hover:border-stone-400'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <h4 className="font-serif font-bold text-base text-stone-900">
                        {theme.name}
                      </h4>
                    </div>
                    <p className="text-xs text-stone-500 line-clamp-2">
                      {theme.tagline}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="p-4 rounded-xl bg-saffron-50 border border-saffron-200 mt-4 text-xs text-saffron-900">
              <span className="font-bold block mb-1">Customizable inside planner:</span>
              You can easily customize background colors, add couple photos, upload venue map pins, and tailor RSVP questions anytime!
            </div>
          </div>

          {/* Device Mockup Preview (7 cols) */}
          <div className="lg:col-span-7 flex justify-center">
            {viewDevice === 'mobile' ? (
              /* Mobile Shell */
              <div className="w-[340px] sm:w-[380px] rounded-[40px] p-4 bg-stone-900 shadow-2xl border-4 border-stone-800 relative">
                {/* Speaker pill notch */}
                <div className="w-24 h-4 bg-stone-950 rounded-full mx-auto mb-3" />

                {/* Inner Screen */}
                <div
                  className="rounded-[28px] overflow-hidden border border-stone-200 text-center transition-colors duration-500 shadow-inner flex flex-col min-h-[620px]"
                  style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.text }}
                >
                  {/* Top wedding header banner */}
                  <div
                    className="p-6 relative text-white"
                    style={{
                      background: `linear-gradient(135deg, ${selectedTheme.primary}, #111827)`,
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-saffron-300 font-semibold">
                      Welcome to the celebration of
                    </span>
                    <h3 className="font-serif text-2xl font-bold mt-1 text-white">
                      Aarav & Ishita
                    </h3>
                    <p className="text-[11px] opacity-90 mt-1">
                      February 14, 2027 • Udaipur, Rajasthan
                    </p>
                  </div>

                  {/* Countdown Timer */}
                  <div className="py-4 px-6 border-b border-stone-200/50 bg-white/60 backdrop-blur-sm">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-2">
                      Wedding Day Countdown
                    </span>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-stone-200">
                        <span className="font-serif font-bold text-base block text-maroon-800">110</span>
                        <span className="text-[9px] uppercase text-stone-500">Days</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-stone-200">
                        <span className="font-serif font-bold text-base block text-maroon-800">14</span>
                        <span className="text-[9px] uppercase text-stone-500">Hours</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-stone-200">
                        <span className="font-serif font-bold text-base block text-maroon-800">32</span>
                        <span className="text-[9px] uppercase text-stone-500">Mins</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white shadow-sm border border-stone-200">
                        <span className="font-serif font-bold text-base block text-maroon-800">45</span>
                        <span className="text-[9px] uppercase text-stone-500">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Couple Story card */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 shadow-md" style={{ borderColor: selectedTheme.secondary }}>
                        <img
                          src={selectedTheme.previewImage}
                          alt="Couple"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-serif font-bold text-lg text-stone-900">
                        Our Story
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed italic px-2">
                        "Two souls, seven sacred steps, and a lifetime of shared laughter. We can't wait to celebrate our union surrounded by the family and friends we cherish most."
                      </p>

                      <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-left text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800">
                          <Calendar size={13} className="text-maroon-700" />
                          <span>3 Joyful Days of Traditions</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Mehendi • Sangeet Gala • Royal Pheras • Reception
                        </p>
                      </div>
                    </div>

                    {/* Guest RSVP CTA */}
                    <div className="mt-6 pt-4 border-t border-stone-200/60">
                      <button
                        type="button"
                        className="w-full py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: selectedTheme.primary }}
                      >
                        <Heart size={14} fill="currentColor" />
                        <span>RSVP for Aarav & Ishita</span>
                      </button>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        Accepts dietary notes, +1 headcount & arrival window
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Shell */
              <div className="w-full max-w-xl rounded-2xl p-3 bg-stone-800 shadow-2xl border-4 border-stone-700">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 rounded-t-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-stone-400 font-mono ml-2">
                    aaravandishita.weddingatelier.com
                  </span>
                </div>

                <div
                  className="rounded-b-lg p-8 min-h-[460px] text-center transition-colors duration-500 flex flex-col justify-between"
                  style={{ backgroundColor: selectedTheme.bg, color: selectedTheme.text }}
                >
                  <div className="max-w-md mx-auto space-y-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
                      Kindly Join Us To Celebrate
                    </span>
                    <h3 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                      Aarav & Ishita
                    </h3>
                    <p className="text-sm text-stone-600">
                      The Oberoi Udaivilas • Udaipur, Rajasthan • February 14–16, 2027
                    </p>

                    <div className="flex justify-center gap-4 py-2">
                      <div className="px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm text-center">
                        <span className="font-serif text-xl font-bold text-maroon-700 block">3</span>
                        <span className="text-[10px] uppercase text-stone-500">Celebration Events</span>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm text-center">
                        <span className="font-serif text-xl font-bold text-maroon-700 block">Jain / Veg</span>
                        <span className="text-[10px] uppercase text-stone-500">Dietary Menu</span>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-white border border-stone-200 shadow-sm text-center">
                        <span className="font-serif text-xl font-bold text-maroon-700 block">Instant</span>
                        <span className="text-[10px] uppercase text-stone-500">WhatsApp RSVP</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button
                      className="px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-md flex items-center gap-2"
                      style={{ backgroundColor: selectedTheme.primary }}
                    >
                      <Heart size={16} fill="currentColor" />
                      <span>Respond to RSVP Invitation</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Highlights (The Knot 3 Key Pillars) */}
      <section className="bg-white py-16 sm:py-24 border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#33302c]">
              Everything you need in one wedding hub
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Designed to make wedding planning feel joyful, organized, and effortlessly elegant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#faf5eb] border border-[#cacab0] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-maroon-700 text-white flex items-center justify-center shadow-sm">
                <Users size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Keep RSVPs Simple & Smart
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Collect confirmed guest numbers, +1 names, dietary restrictions (Vegetarian, Jain, Vegan), and hotel arrival windows in real time with zero manual spreadsheet chaos.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#faf5eb] border border-[#cacab0] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-saffron-500 text-white flex items-center justify-center shadow-sm">
                <Send size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Send Quick Reminders
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Reach guests where they actually check messages: WhatsApp. Automatic polite follow-ups for guests who haven’t responded before your catering deadlines.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#faf5eb] border border-[#cacab0] space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Private & Guest-Specific
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Each guest only sees the events they are specifically invited to (e.g. Sangeet vs. intimate family ceremony), preserving discretion and hospitality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (Knot style) */}
      <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
            Got Questions?
          </span>
          <h2 className="font-serif text-3xl font-bold text-[#33302c] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-stone-200 bg-white overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-serif font-bold text-base text-stone-900 hover:text-maroon-700 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 text-stone-400 ${
                      isOpen ? 'rotate-180 text-maroon-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-105"
          >
            Create Your Free Wedding Website Now →
          </button>
        </div>
      </section>
    </div>
  );
};
