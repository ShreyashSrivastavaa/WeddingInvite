import React, { useState } from 'react';
import { Header } from '../../components/common/Header';
import {
  Sparkles,
  MapPin,
  Star,
  DollarSign,
  Users,
  Search,
  Filter,
  ArrowRight,
  Heart,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  X,
} from 'lucide-react';

interface VendorItem {
  id: string;
  name: string;
  category: 'Venues' | 'Photographers' | 'Planners' | 'Decor & Florists' | 'Music & DJs' | 'Catering';
  location: string;
  rating: number;
  reviewCount: number;
  priceLevel: '$$' | '$$$' | '$$$$';
  capacity?: string;
  imageUrl: string;
  tagline: string;
  featuredBadge?: string;
}

const VENDORS: VendorItem[] = [
  {
    id: 'v-1',
    name: 'The Leela Palace & Mewar Courtyard',
    category: 'Venues',
    location: 'Lake Pichola, Udaipur',
    rating: 4.9,
    reviewCount: 142,
    priceLevel: '$$$$',
    capacity: '200 - 800 Guests',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    tagline: 'Regal lakeside palace with illuminated marble courtyards and heritage boat arrivals.',
    featuredBadge: "Best of Weddings 2026",
  },
  {
    id: 'v-2',
    name: 'Taj Fort Aguada Beach Resort & Spa',
    category: 'Venues',
    location: 'Sinquerim, North Goa',
    rating: 4.8,
    reviewCount: 98,
    priceLevel: '$$$',
    capacity: '150 - 500 Guests',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    tagline: 'Golden hour sunset vows perched on ancient ramparts overlooking the Arabian Sea.',
    featuredBadge: "Top Seaside Venue",
  },
  {
    id: 'v-3',
    name: 'Stories by Joseph Radhik Studios',
    category: 'Photographers',
    location: 'Mumbai & Global',
    rating: 5.0,
    reviewCount: 210,
    priceLevel: '$$$$',
    imageUrl: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80',
    tagline: 'Celebrity wedding photographers capturing raw human emotion and royal grandeur.',
    featuredBadge: "Couples' Choice Award",
  },
  {
    id: 'v-4',
    name: 'Devika Narain & Company Design',
    category: 'Decor & Florists',
    location: 'New Delhi & Destination',
    rating: 4.9,
    reviewCount: 76,
    priceLevel: '$$$$',
    imageUrl: 'https://images.unsplash.com/photo-1519225424982-f54f7678c439?auto=format&fit=crop&w=800&q=80',
    tagline: 'Bespoke sustainable botanicals, royal hand-carved mandaps, and atmospheric candelabras.',
    featuredBadge: "Artisan Decorator",
  },
  {
    id: 'v-5',
    name: 'Wedniksha Luxury Wedding Curators',
    category: 'Planners',
    location: 'Mumbai, Jaipur & Dubai',
    rating: 4.9,
    reviewCount: 88,
    priceLevel: '$$$$',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    tagline: 'Complete white-glove wedding management, royal logistics, and celebrity artist curation.',
    featuredBadge: "Elite Concierge",
  },
  {
    id: 'v-6',
    name: 'DJ Chetas & Live Symphony Production',
    category: 'Music & DJs',
    location: 'Mumbai & Pan-India',
    rating: 4.9,
    reviewCount: 164,
    priceLevel: '$$$',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    tagline: 'High-octane Sangeet music production, customized mashups, and percussionist ensembles.',
    featuredBadge: "Sangeet Favorite",
  },
  {
    id: 'v-7',
    name: 'Copper Chimney Royal Banqueting',
    category: 'Catering',
    location: 'Mumbai, Bengaluru & Delhi',
    rating: 4.8,
    reviewCount: 112,
    priceLevel: '$$$',
    capacity: 'Gourmet 80-Course Menus',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    tagline: 'Master chefs specializing in royal Awadhi, Gujarati Maharaj, Marwari Jain, and modern European cuisines.',
    featuredBadge: "Michelin-Standard Chefs",
  },
  {
    id: 'v-8',
    name: 'Alila Fort Bishangarh Heritage Palace',
    category: 'Venues',
    location: 'Jaipur, Rajasthan',
    rating: 4.9,
    reviewCount: 65,
    priceLevel: '$$$$',
    capacity: '100 - 350 Guests',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    tagline: 'A 230-year-old warrior fortress reborn into an intimate, dramatic royal sanctuary.',
    featuredBadge: "Heritage Icon",
  },
];

export const VendorsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [selectedVendorForQuote, setSelectedVendorForQuote] = useState<VendorItem | null>(null);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const categories = ['All', 'Venues', 'Photographers', 'Planners', 'Decor & Florists', 'Music & DJs', 'Catering'];

  const filteredVendors = VENDORS.filter((v) => {
    const matchCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchLoc =
      !searchLocation ||
      v.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
      v.name.toLowerCase().includes(searchLocation.toLowerCase());
    return matchCat && matchLoc;
  });

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
    setTimeout(() => {
      setQuoteSuccess(false);
      setSelectedVendorForQuote(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf5eb] text-[#484036] flex flex-col font-sans">
      <Header />

      {/* Top Banner inspired by The Knot Marketplace */}
      <section className="bg-[#ecece4] border-b border-[#cacab0] py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-maroon-700/10 text-maroon-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={14} className="text-maroon-700" />
            <span>The Knot-Inspired Vendor Marketplace</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#33302c] tracking-tight">
            Find Your Wedding Dream Team
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#666e72] max-w-2xl mx-auto leading-relaxed">
            Browse top-rated venues, photographers, florists, and caterers reviewed by real couples. Seamlessly link their details to your wedding itinerary.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-8 max-w-xl mx-auto bg-white p-2 rounded-2xl border border-[#cacab0] shadow-sm flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={18} className="text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Search by city (e.g. Udaipur, Goa, Jaipur) or vendor name..."
                className="w-full text-sm bg-transparent border-none focus:outline-none text-stone-800 placeholder:text-stone-400"
              />
            </div>
            {searchLocation && (
              <button
                onClick={() => setSearchLocation('')}
                className="p-1 text-stone-400 hover:text-stone-700 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Vendor Directory */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-stone-200">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-maroon-700 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-[#cacab0] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Image & Featured Badge */}
                <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                  <img
                    src={vendor.imageUrl}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {vendor.featuredBadge && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-maroon-700 shadow-sm backdrop-blur-sm">
                      {vendor.featuredBadge}
                    </span>
                  )}
                  <div className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-stone-400 hover:text-rose-600 cursor-pointer shadow-sm">
                    <Heart size={16} />
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-maroon-700 uppercase tracking-wider text-[10px]">
                      {vendor.category}
                    </span>
                    <span className="font-bold text-stone-700">
                      {vendor.priceLevel}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-maroon-700 transition-colors line-clamp-1">
                    {vendor.name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-stone-600">
                    <span className="flex items-center gap-1 font-bold text-stone-800">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {vendor.rating}
                    </span>
                    <span className="text-stone-400">({vendor.reviewCount} reviews)</span>
                    <span className="flex items-center gap-1 text-stone-500 ml-auto">
                      <MapPin size={12} className="text-maroon-700" />
                      {vendor.location}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed pt-1">
                    {vendor.tagline}
                  </p>

                  {vendor.capacity && (
                    <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-1">
                      <Users size={12} className="text-stone-400" />
                      <span>Capacity: {vendor.capacity}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => setSelectedVendorForQuote(vendor)}
                  className="w-full py-2.5 rounded-xl border border-stone-300 group-hover:border-maroon-700 group-hover:bg-maroon-700 text-stone-700 group-hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle size={14} />
                  <span>Request Quote & Availability</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Request Quote Modal */}
      {selectedVendorForQuote && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setSelectedVendorForQuote(null)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-stone-700"
            >
              <X size={18} />
            </button>

            {quoteSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-stone-900">Inquiry Sent!</h3>
                <p className="text-xs text-stone-600 max-w-xs mx-auto">
                  {selectedVendorForQuote.name} has received your wedding details and will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-maroon-700">
                  Direct In-App Inquiry
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-900 mt-1">
                  Connect with {selectedVendorForQuote.name}
                </h3>
                <p className="text-xs text-stone-500 mb-4">
                  Send your wedding dates and guest count to get pricing packages.
                </p>

                <form onSubmit={handleQuoteSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aditi Rao"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Email or WhatsApp Phone
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Estimated Guests
                      </label>
                      <input
                        type="number"
                        defaultValue={250}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Special Notes / Requirements
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need royal lawn setup for Sangeet & Jain catering options"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all mt-2"
                  >
                    Submit Quote Request
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
