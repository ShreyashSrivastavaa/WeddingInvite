import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PRODUCT_NAME } from '@rsvp/shared';
import { User, LogOut, Settings, Menu, X, HeartHandshake } from 'lucide-react';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-cream-100"
              aria-label="Toggle navigation"
            >
              {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}

          <Link to="/weddings" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-maroon-700 flex items-center justify-center text-saffron-300 shadow-sm">
              <HeartHandshake size={22} />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight block leading-tight">
                {PRODUCT_NAME}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-saffron-600 font-semibold block">
                Indian Wedding RSVP SaaS
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-cream-100 transition-colors focus:ring-2 focus:ring-maroon-700 focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-cream-200 text-maroon-800 flex items-center justify-center font-medium text-sm border border-cream-300">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-stone-700 pr-1">
                {user.name}
              </span>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-cream-200 py-1.5 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-cream-100">
                    <p className="text-xs font-semibold text-stone-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    {user.businessName && (
                      <p className="text-[11px] text-maroon-700 font-medium truncate mt-0.5">
                        {user.businessName}
                      </p>
                    )}
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-cream-50"
                  >
                    <Settings size={16} className="text-stone-400" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
