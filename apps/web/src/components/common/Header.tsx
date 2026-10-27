import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PRODUCT_NAME } from '@rsvp/shared';
import {
  User,
  LogOut,
  Settings,
  Menu,
  X,
  HeartHandshake,
  Search,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { FindCoupleModal } from './FindCoupleModal';

interface HeaderProps {
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileNav,
  isMobileNavOpen,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFindCoupleOpen, setIsFindCoupleOpen] = useState(false);
  const [isPublicMobileMenuOpen, setIsPublicMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Wedding Websites', to: '/wedding-websites' },
    { label: 'Checklist', to: '/checklist' },
    { label: 'Vendors & Inspo', to: '/vendors' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#faf5eb]/95 backdrop-blur-md border-b border-[#cacab0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            {/* If inside organizer dashboard with sidebar */}
            {onToggleMobileNav ? (
              <button
                onClick={onToggleMobileNav}
                className="md:hidden p-2 text-[#484036] hover:text-[#33302c] rounded-lg hover:bg-[#ecece4]"
                aria-label="Toggle navigation"
              >
                {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            ) : (
              /* Public mobile menu toggle */
              <button
                onClick={() => setIsPublicMobileMenuOpen(!isPublicMobileMenuOpen)}
                className="lg:hidden p-2 text-[#484036] hover:text-[#33302c] rounded-lg hover:bg-[#ecece4]"
                aria-label="Toggle navigation menu"
              >
                {isPublicMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-maroon-700 flex items-center justify-center text-saffron-300 shadow-sm transition-transform group-hover:scale-95">
                <HeartHandshake size={18} strokeWidth={1.75} />
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-[#33302c] tracking-tight block leading-tight">
                  The Wedding Knot
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#666e72] font-semibold block">
                  All-In-One RSVP Atelier
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (The Knot Inspired) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-wider font-semibold text-[#484036]">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`hover:text-maroon-700 transition-colors py-1 border-b-2 ${
                    isActive
                      ? 'border-maroon-700 text-maroon-800'
                      : 'border-transparent text-[#484036]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {user && (
              <Link
                to="/weddings"
                className={`hover:text-maroon-700 transition-colors py-1 border-b-2 ${
                  location.pathname.startsWith('/weddings')
                    ? 'border-maroon-700 text-maroon-800 font-bold'
                    : 'border-transparent text-[#484036]'
                }`}
              >
                My Weddings
              </Link>
            )}
          </nav>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Find a Couple button */}
            <button
              onClick={() => setIsFindCoupleOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-300 shadow-sm transition-all"
            >
              <Search size={13} className="text-maroon-700" />
              <span>Find a Couple</span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ecece4] border border-[#cacab0] hover:border-maroon-700 text-[#484036] transition-all text-xs font-medium shadow-sm"
                  aria-expanded={isDropdownOpen}
                  aria-label="User menu"
                >
                  <div className="w-6 h-6 rounded-lg bg-maroon-700 text-white flex items-center justify-center font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline-block truncate max-w-[120px]">
                    {user.name}
                  </span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl py-2 z-50 animate-fade-in text-stone-800">
                      <div className="px-4 py-2.5 border-b border-stone-100">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                        {user.businessName && (
                          <p className="text-[11px] text-maroon-700 font-semibold truncate mt-0.5">
                            {user.businessName}
                          </p>
                        )}
                      </div>

                      <Link
                        to="/weddings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-[#faf5eb] transition-colors"
                      >
                        <HeartHandshake size={14} className="text-maroon-700" />
                        <span>All My Weddings</span>
                      </Link>

                      <Link
                        to="/checklist"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-[#faf5eb] transition-colors"
                      >
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Wedding Checklist</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-stone-700 hover:bg-[#faf5eb] transition-colors"
                      >
                        <Settings size={14} className="text-stone-400" />
                        <span>Account Settings</span>
                      </Link>

                      <div className="border-t border-stone-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-stone-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-maroon-700 hover:bg-maroon-800 text-white shadow-sm transition-all flex items-center gap-1"
                >
                  <span>Start Free</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Public Mobile Menu Drawer */}
        {isPublicMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#cacab0] bg-[#faf5eb] p-4 space-y-3 shadow-lg">
            <div className="flex flex-col space-y-2 text-xs font-semibold uppercase tracking-wider text-[#484036]">
              {navLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsPublicMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#ecece4] transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {user && (
                <Link
                  to="/weddings"
                  onClick={() => setIsPublicMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[#ecece4] text-maroon-800 font-bold transition-colors"
                >
                  My Weddings Dashboard
                </Link>
              )}

              <button
                onClick={() => {
                  setIsPublicMobileMenuOpen(false);
                  setIsFindCoupleOpen(true);
                }}
                className="p-2 rounded-lg text-left hover:bg-[#ecece4] flex items-center gap-2 text-maroon-700 font-bold"
              >
                <Search size={14} />
                <span>Find a Couple's RSVP</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Find a Couple Global Modal */}
      <FindCoupleModal
        isOpen={isFindCoupleOpen}
        onClose={() => setIsFindCoupleOpen(false)}
      />
    </>
  );
};
