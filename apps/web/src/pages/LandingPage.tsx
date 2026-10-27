import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { FindCoupleModal } from '../components/common/FindCoupleModal';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Heart,
  Calendar,
  CheckCircle2,
  Users,
  Send,
  ArrowRight,
  Search,
  Star,
  Check,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Gift,
  Palette,
  MapPin,
  Clock,
  Layers,
  Box,
  MessageSquare,
  Award,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search widget state
  const [activeSearchTab, setActiveSearchTab] = useState<'planning' | 'guest'>('planning');
  const [partnerOne, setPartnerOne] = useState('');
  const [partnerTwo, setPartnerTwo] = useState('');
  const [guestCode, setGuestCode] = useState('');

  // Interactive Live Theme Switcher for hero
  const [activeTheme, setActiveTheme] = useState<'ROYAL' | 'SAFFRON' | 'PEACOCK' | 'ROSE' | 'EARTHEN'>('ROYAL');
  const [isFindCoupleOpen, setIsFindCoupleOpen] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  // Checklist preview items for interactive demo
  const [checklistDemo, setChecklistDemo] = useState([
    { id: 1, text: 'Book reception palace & ceremony mandap', done: true, time: '10-12 Mo' },
    { id: 2, text: 'Create free custom wedding website & RSVP page', done: true, time: '6-8 Mo' },
    { id: 3, text: 'Choose 3D digital invitations & save-the-dates', done: false, time: '6-8 Mo' },
    { id: 4, text: 'Finalize catering menu with Jain & Vegan options', done: false, time: '3-5 Mo' },
    { id: 5, text: 'Send polite WhatsApp reminders before RSVP deadline', done: false, time: '1-2 Mo' },
  ]);

  const toggleChecklistDemo = (id: number) => {
    setChecklistDemo((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handlePlanningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      navigate('/weddings');
    } else {
      navigate('/login');
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestCode.trim()) {
      setIsFindCoupleOpen(true);
      return;
    }
    const clean = guestCode.trim().replace(/^.*\/r\//, '');
    navigate(`/r/${clean}`);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSuccess(true);
  };

  // Color mappings for interactive mockup
  const themeStyles = {
    ROYAL: {
      primary: '#7a192c',
      secondary: '#d4af37',
      bg: '#fdfbf7',
      name: 'Royal Ivory & Maroon',
      img: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    },
    SAFFRON: {
      primary: '#b45309',
      secondary: '#eab308',
      bg: '#fffdfa',
      name: 'Golden Saffron & Brass',
      img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    },
    PEACOCK: {
      primary: '#0f766e',
      secondary: '#d4af37',
      bg: '#f4fbf9',
      name: 'Peacock Teal & Gold',
      img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    },
    ROSE: {
      primary: '#9f1239',
      secondary: '#f43f5e',
      bg: '#fff5f7',
      name: 'Rose Palace & Ruby',
      img: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80',
    },
    EARTHEN: {
      primary: '#484036',
      secondary: '#cacab0',
      bg: '#faf5eb',
      name: 'Warm Earthen Atelier',
      img: 'https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=600&q=80',
    },
  }[activeTheme];

  return (
    <div className="min-h-screen bg-[#faf5eb] text-[#484036] flex flex-col font-sans selection:bg-maroon-100 selection:text-maroon-900">
      {/* Top The Knot-Style Announcement Banner */}
      <div className="bg-[#484036] text-[#faf5eb] py-2 px-4 text-xs font-medium text-center border-b border-stone-700/40 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 font-normal">
          <Sparkles size={13} className="text-saffron-300" />
          <span>Meet your wedding planner BFF — Free custom websites & WhatsApp-first RSVP tracking</span>
        </span>
        <button
          onClick={() => setIsFindCoupleOpen(true)}
          className="text-saffron-300 hover:text-white underline underline-offset-2 hidden sm:inline-block font-semibold"
        >
          Find a Couple's RSVP →
        </button>
      </div>

      <Header />

      {/* 1. HERO SECTION (Magazine & Editorial Elegance) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#ecece4] via-[#faf5eb] to-[#faf5eb] border-b border-[#cacab0] pt-12 pb-20 sm:pt-16 sm:pb-28">
        {/* Subtle decorative motif background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#484036_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Rating Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-stone-300 shadow-sm text-xs font-medium text-stone-700">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
              <span className="font-bold text-stone-900">4.9/5 Rating</span>
              <span className="text-stone-300">•</span>
              <span>Over 35,000 Happy Celebrations</span>
            </div>

            {/* Editorial Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold text-[#33302c] tracking-tight leading-[1.1]">
              Your wedding journey, <span className="italic font-normal text-maroon-700">effortlessly</span> planned.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#666e72] leading-relaxed max-w-2xl mx-auto pt-2">
              All-in-one wedding platform: create your free custom website, gather RSVPs with meal choices in seconds via WhatsApp, and check off every detail month by month.
            </p>

            {/* Dual Quick Action Widget (Knot Style) */}
            <div className="mt-8 max-w-xl mx-auto bg-white p-2 rounded-2xl border border-[#cacab0] shadow-xl">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-[#ecece4] rounded-xl text-xs font-semibold mb-3">
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('planning')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeSearchTab === 'planning'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Heart size={14} className="text-maroon-700" />
                  <span>I'm Planning a Wedding</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSearchTab('guest')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeSearchTab === 'guest'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users size={14} className="text-maroon-700" />
                  <span>I'm a Wedding Guest</span>
                </button>
              </div>

              {activeSearchTab === 'planning' ? (
                <form onSubmit={handlePlanningSubmit} className="p-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Partner One (e.g. Aarav)"
                      value={partnerOne}
                      onChange={(e) => setPartnerOne(e.target.value)}
                      className="px-3.5 py-2.5 text-xs sm:text-sm bg-[#faf5eb] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-700"
                    />
                    <input
                      type="text"
                      placeholder="Partner Two (e.g. Ishita)"
                      value={partnerTwo}
                      onChange={(e) => setPartnerTwo(e.target.value)}
                      className="px-3.5 py-2.5 text-xs sm:text-sm bg-[#faf5eb] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    <span>Start Your Free Wedding Website</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleGuestSubmit} className="p-2 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter invite code or couple name (e.g. aarav-ishita-demo)"
                      value={guestCode}
                      onChange={(e) => setGuestCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#faf5eb] border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-700"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <span>Find RSVP</span>
                      <Search size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                    <span>Lost your link?</span>
                    <button
                      type="button"
                      onClick={() => setIsFindCoupleOpen(true)}
                      className="text-maroon-700 hover:underline font-semibold"
                    >
                      Browse live demo RSVPs →
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick stats badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-600" /> Free Forever
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-600" /> Instant WhatsApp RSVP
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-600" /> Meal & Dietary Headcount
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-600" /> 3D Digital Stationery
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE KNOT 4 CORE PLANNING PILLARS */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
            Meet Your All-In-One Toolkit
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#33302c] mt-2">
            Everything your celebration needs to run smoothly
          </h2>
          <p className="text-sm text-stone-600 mt-2">
            No messy spreadsheets, no unanswered WhatsApp messages, no forgotten dietary requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Free Website */}
          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-maroon-50 text-maroon-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Smartphone size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Free Wedding Websites
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Customizable mobile-friendly pages with love story, countdown, hotel blocks, photo gallery, and event itineraries.
              </p>
            </div>
            <Link
              to="/wedding-websites"
              className="mt-6 text-xs font-bold text-maroon-700 hover:text-maroon-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore Designs</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Card 2: Guest List & WhatsApp */}
          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-saffron-50 text-saffron-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Smart Guest List & WhatsApp
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Send personal invites with 1-click WhatsApp links. Track meal preferences (Jain, Veg, Vegan) and auto-calculate catering counts.
              </p>
            </div>
            <button
              onClick={() => setIsFindCoupleOpen(true)}
              className="mt-6 text-xs font-bold text-maroon-700 hover:text-maroon-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform text-left"
            >
              <span>Try Live RSVP Demo</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Card 3: Interactive Checklist */}
          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Month-by-Month Checklist
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Stay on top of 120+ wedding tasks organized by timeline milestones. Add custom family items and print or export to PDF.
              </p>
            </div>
            <Link
              to="/checklist"
              className="mt-6 text-xs font-bold text-maroon-700 hover:text-maroon-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
            >
              <span>View Wedding Checklist</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SPOTLIGHT: THE WEDDING WEBSITE BUILDER (The Knot Showcase) */}
      <section className="bg-white py-16 sm:py-24 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-100 text-saffron-900 text-xs font-bold uppercase tracking-wider">
                <Palette size={14} className="text-saffron-700" />
                <span>Custom Website In Under 3 Minutes</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 leading-tight">
                A gorgeous wedding website guests will actually love
              </h2>

              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Pick a matching colorway, upload your engagement photos, share hotel booking codes, and let guests RSVP on any phone without downloading an app.
              </p>

              {/* Theme Selector Pills */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Select Theme to Preview Live:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['ROYAL', 'SAFFRON', 'PEACOCK', 'ROSE', 'EARTHEN'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTheme(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        activeTheme === t
                          ? 'bg-maroon-700 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {t === 'ROYAL' && 'Royal Ivory'}
                      {t === 'SAFFRON' && 'Golden Saffron'}
                      {t === 'PEACOCK' && 'Peacock Teal'}
                      {t === 'ROSE' && 'Rose Palace'}
                      {t === 'EARTHEN' && 'Warm Earthen'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  to="/wedding-websites"
                  className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
                >
                  View All Website Designs →
                </Link>
                <button
                  onClick={() => setIsFindCoupleOpen(true)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-2"
                >
                  Test RSVP Flow
                </button>
              </div>
            </div>

            {/* Right Mockup Phone */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-[340px] sm:w-[380px] rounded-[36px] p-3.5 bg-stone-900 shadow-2xl border-4 border-stone-800">
                <div className="w-20 h-3.5 bg-stone-950 rounded-full mx-auto mb-2" />

                <div
                  className="rounded-[24px] overflow-hidden border border-stone-200 text-center transition-colors duration-500 shadow-inner flex flex-col min-h-[580px]"
                  style={{ backgroundColor: themeStyles.bg }}
                >
                  {/* Hero banner */}
                  <div
                    className="p-6 text-white text-center"
                    style={{
                      background: `linear-gradient(135deg, ${themeStyles.primary}, #18181b)`,
                    }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-saffron-300 font-semibold">
                      Together With Families
                    </span>
                    <h3 className="font-serif text-2xl font-bold mt-1 text-white">
                      Aarav & Ishita
                    </h3>
                    <p className="text-[11px] opacity-90 mt-1">
                      February 14, 2027 • The Leela Palace, Udaipur
                    </p>
                  </div>

                  {/* Countdown strip */}
                  <div className="py-3 px-4 bg-white/70 border-b border-stone-200 flex justify-around text-center text-xs">
                    <div>
                      <span className="font-serif font-bold text-base block text-maroon-800">110</span>
                      <span className="text-[9px] uppercase text-stone-500">Days</span>
                    </div>
                    <div>
                      <span className="font-serif font-bold text-base block text-maroon-800">14</span>
                      <span className="text-[9px] uppercase text-stone-500">Hours</span>
                    </div>
                    <div>
                      <span className="font-serif font-bold text-base block text-maroon-800">32</span>
                      <span className="text-[9px] uppercase text-stone-500">Mins</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full mx-auto overflow-hidden border-2 shadow-sm" style={{ borderColor: themeStyles.secondary }}>
                        <img
                          src={themeStyles.img}
                          alt="Couple"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-900">
                        Join Us In Celebration
                      </h4>
                      <p className="text-xs text-stone-600 italic px-2">
                        "Your presence will add immense happiness to our sacred ceremonies."
                      </p>

                      <div className="p-3 bg-white rounded-xl border border-stone-200 text-left text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-stone-800">
                          <MapPin size={12} className="text-maroon-700" />
                          <span>Mewar Courtyard & Lakeside Gardens</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Pre-wedding Mehendi • Sangeet Gala • Royal Pheras
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsFindCoupleOpen(true)}
                      className="w-full py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: themeStyles.primary }}
                    >
                      <Heart size={14} fill="currentColor" />
                      <span>RSVP for Aarav & Ishita</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE CHECKLIST TOOL PREVIEW (The Knot's #1 Most Famous Tool) */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-[#ecece4] rounded-3xl border border-[#cacab0] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
                Interactive Planning Demo
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                The Knot-Style Wedding Checklist
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
                Try checking off tasks below to see how our built-in checklist keeps you calm, synchronized, and on schedule.
              </p>
            </div>

            <Link
              to="/checklist"
              className="px-5 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <span>Open Full Checklist (120+ Tasks)</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Interactive To-Do List */}
          <div className="space-y-2.5 bg-white p-4 sm:p-6 rounded-2xl border border-stone-300">
            {checklistDemo.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleChecklistDemo(item.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  item.done
                    ? 'bg-stone-50 border-stone-200 text-stone-400'
                    : 'bg-white hover:bg-[#faf5eb] border-stone-200 hover:border-maroon-700 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      item.done
                        ? 'bg-emerald-600 text-white'
                        : 'border border-stone-300 hover:border-maroon-700'
                    }`}
                  >
                    {item.done && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      item.done ? 'line-through text-stone-400' : 'text-stone-800'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-stone-500">
              ✓ Checklist is fully synced with your wedding date and can be printed or customized anytime.
            </span>
          </div>
        </div>
      </section>

      {/* 5. WHATSAPP & RSVP EXPERIENCE SHOWCASE */}
      <section className="bg-white py-16 sm:py-24 border-y border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* WhatsApp message bubble mockup */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-md bg-[#efeae2] p-5 rounded-3xl border border-stone-300 shadow-xl space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-stone-300/60">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    A&I
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-stone-900">Aarav & Ishita's Wedding RSVP</h4>
                    <p className="text-[10px] text-stone-500">Official WhatsApp Service • Verified</p>
                  </div>
                </div>

                {/* Received Bubble */}
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2 text-xs text-stone-800 max-w-[90%]">
                  <p>
                    Namaste <strong>Karthik & Sneha</strong>! 🙏
                  </p>
                  <p>
                    With the blessings of our families, we warmly invite you to celebrate our union on <strong>February 14, 2027</strong> in Udaipur.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Kindly confirm your attendance and meal preference (Vegetarian / Jain) using your personal link below:
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={() => setIsFindCoupleOpen(true)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs text-center flex items-center justify-center gap-1 shadow-sm transition-all"
                    >
                      <span>Confirm RSVP for 3 Guests</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                  <span className="text-[9px] text-stone-400 block text-right pt-0.5">10:45 AM • Delivered</span>
                </div>

                {/* Reply Feature Pill */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <span>Real-Time Headcount Sync</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    When guests confirm, your live organizer dashboard instantly updates confirmed numbers, kids headcount, Jain diets, and flight arrival windows!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="order-1 lg:order-2 space-y-5">
              <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
                Effortless Communication
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 leading-tight">
                98% open rates with WhatsApp-first RSVP invitations
              </h2>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                Traditional paper RSVP cards get lost in the mail. With our platform, guests receive personalized WhatsApp invitations and confirm in three taps.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Custom Meal & Dietary Preferences</h4>
                    <p className="text-xs text-stone-500">Track Vegetarian, Jain, Vegan, and allergy notes per guest household.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Polite Automated Reminders</h4>
                    <p className="text-xs text-stone-500">Single-click reminder queue for guests who haven't responded yet.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Bilingual English & Hindi</h4>
                    <p className="text-xs text-stone-500">Guests can toggle between English and authentic Devanagari Hindi seamlessly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REAL COUPLE STORIES & TESTIMONIALS (The Knot Style) */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase font-bold tracking-widest text-maroon-700">
            Real Weddings & Love Stories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#33302c] mt-2">
            Loved by couples & wedding planners across the globe
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm space-y-4">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
              "Having all our wedding details in one spot made planning feel surprisingly fun. Collecting RSVPs and dietary requirements via WhatsApp saved us hours of stressful phone calls!"
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-maroon-100 text-maroon-800 font-serif font-bold flex items-center justify-center text-sm">
                A&I
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Aarav & Ishita</h4>
                <p className="text-[11px] text-stone-500">Udaipur Destination Wedding • 350 Guests</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm space-y-4">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
              "The 3D interactive invitation cards were a huge hit with our guests. They felt like royal stationery with gold foil wax seals on their phones. Truly a luxury experience!"
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-saffron-100 text-saffron-800 font-serif font-bold flex items-center justify-center text-sm">
                R&P
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Rohan & Priya</h4>
                <p className="text-[11px] text-stone-500">Goa Beachfront Celebration • 220 Guests</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#cacab0] shadow-sm space-y-4">
            <div className="flex items-center text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
              "As a professional wedding planner, this tool has completely replaced spreadsheets for our team. The live catering headcount breakdown alone paid for itself ten times over."
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-serif font-bold flex items-center justify-center text-sm">
                VR
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">Vows & Veils Luxury Planners</h4>
                <p className="text-[11px] text-stone-500">Lead Planner • 40+ Weddings Curated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM HIGH-CONVERTING CTA BANNER */}
      <section className="bg-gradient-to-r from-maroon-900 via-maroon-800 to-maroon-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <span className="text-xs uppercase font-bold tracking-widest text-saffron-300">
            Start Today — It's Free
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            Ready to plan your dream celebration?
          </h2>
          <p className="text-sm sm:text-base text-stone-200 max-w-xl mx-auto leading-relaxed">
            Create your custom wedding website in minutes and give your guests a memorable, stress-free RSVP experience.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-saffron-400 hover:bg-saffron-300 text-stone-900 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <span>Create Your Free Wedding Website</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setIsFindCoupleOpen(true)}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm font-semibold transition-all backdrop-blur-sm"
            >
              Find a Couple's RSVP
            </button>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE THE KNOT-STYLE FOOTER */}
      <footer className="bg-[#33302c] text-[#faf5eb] pt-16 pb-12 border-t border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
            {/* Column 1: Planning Tools */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-saffron-300 uppercase tracking-wider">
                Planning Tools
              </h4>
              <ul className="space-y-2 text-xs text-stone-300">
                <li><Link to="/checklist" className="hover:text-white transition-colors">Wedding Checklist</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Guest List Manager</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Catering Calculator</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">WhatsApp Sender</Link></li>
                <li><Link to="/checklist" className="hover:text-white transition-colors">Printable Timeline</Link></li>
              </ul>
            </div>

            {/* Column 2: Wedding Websites */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-saffron-300 uppercase tracking-wider">
                Wedding Websites
              </h4>
              <ul className="space-y-2 text-xs text-stone-300">
                <li><Link to="/wedding-websites" className="hover:text-white transition-colors">Website Designs</Link></li>
                <li><Link to="/wedding-websites" className="hover:text-white transition-colors">Online RSVP Builder</Link></li>
                <li><Link to="/wedding-websites" className="hover:text-white transition-colors">Mobile Preview Studio</Link></li>
                <li><Link to="/wedding-websites" className="hover:text-white transition-colors">Bilingual Hindi Setup</Link></li>
                <li><Link to="/wedding-websites" className="hover:text-white transition-colors">Love Story Pages</Link></li>
              </ul>
            </div>

            {/* Column 3: Invitations & Paper */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-saffron-300 uppercase tracking-wider">
                Paper & Stationery
              </h4>
              <ul className="space-y-2 text-xs text-stone-300">
                <li><Link to="/weddings" className="hover:text-white transition-colors">3D Royal Atelier Cards</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Digital Save The Dates</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Wax Seal Animations</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Gold Foil Accents</Link></li>
                <li><Link to="/weddings" className="hover:text-white transition-colors">Custom Message Templates</Link></li>
              </ul>
            </div>

            {/* Column 5: Guest Hub */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-saffron-300 uppercase tracking-wider">
                Guest Experience
              </h4>
              <ul className="space-y-2 text-xs text-stone-300">
                <li><button onClick={() => setIsFindCoupleOpen(true)} className="hover:text-white transition-colors text-left">Find a Couple's Wedding</button></li>
                <li><button onClick={() => setIsFindCoupleOpen(true)} className="hover:text-white transition-colors text-left">Confirm Guest Attendance</button></li>
                <li><button onClick={() => setIsFindCoupleOpen(true)} className="hover:text-white transition-colors text-left">Dietary Preferences Form</button></li>
                <li><button onClick={() => setIsFindCoupleOpen(true)} className="hover:text-white transition-colors text-left">Hotel & Travel Directions</button></li>
              </ul>
            </div>

            {/* Column 6: Newsletter & Inspo */}
            <div className="space-y-3 col-span-2 md:col-span-1">
              <h4 className="font-serif font-bold text-sm text-saffron-300 uppercase tracking-wider">
                Stay Inspired
              </h4>
              <p className="text-xs text-stone-400">
                Get weekly planning tips, palette ideas & vendor spotlights in your inbox.
              </p>
              {newsletterSuccess ? (
                <div className="p-2.5 rounded-lg bg-emerald-900/60 border border-emerald-600 text-[11px] text-emerald-200">
                  ✓ Thank you! You are subscribed.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-xs bg-stone-800 border border-stone-600 rounded-lg text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-saffron-400"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-saffron-500 hover:bg-saffron-400 text-stone-950 font-bold text-xs rounded-lg transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom copyright & attribution */}
          <div className="pt-8 border-t border-stone-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <p>
              © {new Date().getFullYear()} RSVP Wedding Atelier Inc. Inspired by The Knot editorial craftsmanship.
            </p>
            <div className="flex items-center gap-6">
              <span className="hover:text-stone-200 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-stone-200 cursor-pointer">Terms of Service</span>
              <span className="hover:text-stone-200 cursor-pointer">Help & FAQs</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Find A Couple Modal */}
      <FindCoupleModal
        isOpen={isFindCoupleOpen}
        onClose={() => setIsFindCoupleOpen(false)}
      />
    </div>
  );
};
