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
    <header className="sticky top-0 z-40 w-full bg-[#faf5eb] border-b border-[#666e72]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileNav && (
            <button
              onClick={onToggleMobileNav}
              className="md:hidden p-2 text-[#484036] hover:text-[#33302c] rounded-[4px] hover:bg-[#ecece4]"
              aria-label="Toggle navigation"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link to="/weddings" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-[4px] bg-[#484036] flex items-center justify-center text-[#faf5eb] transition-transform group-hover:scale-95">
              <HeartHandshake size={18} strokeWidth={1.5} />
            </div>
            <div>
              <span className="font-sans font-normal text-lg text-[#33302c] tracking-[-0.03em] block leading-tight">
                {PRODUCT_NAME}
              </span>
              <span className="text-[10px] uppercase tracking-[0.05em] text-[#666e72] font-normal block">
                Warm Earthen Atelier • Wedding RSVP
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-[4px] bg-[#ecece4] border border-[#666e72]/30 hover:border-[#484036] text-[#484036] transition-all text-sm font-normal"
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
            >
              <div className="w-6 h-6 rounded-[2px] bg-[#cacab0] text-[#484036] flex items-center justify-center font-normal text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline-block text-xs font-normal text-[#484036]">
                {user.name}
              </span>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-[#ecece4] rounded-[4px] border border-[#666e72] py-2 z-50 animate-fade-in shadow-none">
                  <div className="px-4 py-2.5 border-b border-[#666e72]/20">
                    <p className="text-xs font-medium text-[#33302c] truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[#666e72] truncate">{user.email}</p>
                    {user.businessName && (
                      <p className="text-[11px] text-[#484036] font-normal truncate mt-0.5 italic">
                        {user.businessName}
                      </p>
                    )}
                  </div>

                  <Link
                    to="/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#484036] hover:bg-[#faf5eb] transition-colors"
                  >
                    <Settings size={14} className="text-[#666e72]" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#484036] hover:bg-[#faf5eb] hover:text-red-700 transition-colors text-left"
                  >
                    <LogOut size={14} className="text-[#666e72]" />
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
