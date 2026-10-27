import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Heart, ExternalLink, Calendar, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface FindCoupleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Demo couples and tokens that guests can test immediately
const FEATURED_COUPLES = [
  {
    couple: 'Aarav Sharma & Ishita Kapoor',
    title: 'Aarav & Ishita Wedding',
    date: 'February 14, 2027',
    location: 'The Leela Palace, Udaipur',
    token: 'aarav-ishita-demo',
    theme: 'Royal Ivory & Maroon',
    guestName: 'Karthik & Sneha Swaminathan',
  },
  {
    couple: 'Rohan Mehta & Ananya Sen',
    title: 'Rohan & Ananya Grand Celebration',
    date: 'April 22, 2027',
    location: 'Taj Falaknuma Palace, Hyderabad',
    token: 'rohan-ananya-demo',
    theme: 'Peacock Teal & Gold',
    guestName: 'Siddharth & Tanya Rao',
  },
  {
    couple: 'Kabir Varma & Meera Singhania',
    title: 'Meera & Kabir Beachside Vows',
    date: 'November 18, 2026',
    location: 'W Resort & Spa, North Goa',
    token: 'meera-kabir-demo',
    theme: 'Warm Earthen Atelier',
    guestName: 'Vikram & Radhika Malhotra',
  },
];

export const FindCoupleModal: React.FC<FindCoupleModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typedToken, setTypedToken] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const filteredCouples = FEATURED_COUPLES.filter((item) =>
    item.couple.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedToken.trim()) return;
    const cleanToken = typedToken.trim().replace(/^.*\/r\//, '');
    onClose();
    navigate(`/r/${cleanToken}`);
  };

  const handleCoupleSelect = (token: string) => {
    onClose();
    navigate(`/r/${token}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#faf5eb] rounded-2xl border border-[#cacab0] shadow-2xl overflow-hidden transition-all text-[#484036]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#ecece4] px-6 py-5 border-b border-[#cacab0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-maroon-700 text-saffron-300 flex items-center justify-center shadow-sm">
              <Heart size={16} fill="currentColor" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#33302c]">Find a Couple's Wedding</h2>
              <p className="text-xs text-[#666e72]">
                Look up a wedding website or enter your private RSVP token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Code / Token Input */}
          <div className="p-4 rounded-xl bg-white border border-[#cacab0] shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-maroon-700 block mb-1.5">
              Have an invitation link or code?
            </span>
            <form onSubmit={handleTokenSubmit} className="flex gap-2">
              <input
                type="text"
                value={typedToken}
                onChange={(e) => setTypedToken(e.target.value)}
                placeholder="Enter invite code or token (e.g. aarav-ishita-demo)"
                className="flex-1 px-3.5 py-2 text-sm bg-[#faf5eb] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700"
              />
              <button
                type="submit"
                disabled={!typedToken.trim()}
                className="px-4 py-2 bg-maroon-700 hover:bg-maroon-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
              >
                <span>Go to RSVP</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {/* Search couple by name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#666e72] mb-2">
              Search by couple name or venue
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 'Aarav', 'Ishita', 'Udaipur', 'Goa'..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-700"
              />
            </div>
          </div>

          {/* Couple Matches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#666e72]">
              <span className="font-medium uppercase tracking-wider">
                {searchQuery ? `Search Results (${filteredCouples.length})` : 'Popular Weddings & Live RSVP Demos'}
              </span>
              <span className="text-[11px] text-maroon-700 flex items-center gap-1 font-medium">
                <Sparkles size={12} /> Instant Preview
              </span>
            </div>

            {filteredCouples.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-stone-300">
                <p className="text-sm text-stone-500">
                  No weddings found matching "{searchQuery}".
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Try searching by partner first name or check your invite code above.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredCouples.map((c) => (
                  <div
                    key={c.token}
                    onClick={() => handleCoupleSelect(c.token)}
                    className="p-4 bg-white hover:bg-[#fffdfa] rounded-xl border border-[#cacab0] hover:border-maroon-700 transition-all cursor-pointer shadow-sm hover:shadow-md group flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-base text-[#33302c] group-hover:text-maroon-700 transition-colors truncate">
                          {c.couple}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-saffron-100 text-saffron-800 border border-saffron-200 shrink-0">
                          Live RSVP
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#666e72]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-maroon-700 shrink-0" />
                          {c.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-maroon-700 shrink-0" />
                          {c.location}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 italic">
                        Demo guest: {c.guestName}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 group-hover:bg-maroon-700 text-stone-700 group-hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <span>Open RSVP</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#ecece4] border-t border-[#cacab0] flex items-center justify-between text-xs text-stone-600">
          <span>Are you the couple or wedding planner?</span>
          <button
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="text-maroon-700 hover:text-maroon-900 font-semibold underline underline-offset-2"
          >
            Sign In to Planner Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};
