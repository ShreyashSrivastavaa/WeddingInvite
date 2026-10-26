import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Send,
  MessageSquareCode,
  ArrowLeft,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  weddingTitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  weddingTitle,
}) => {
  const { weddingId } = useParams<{ weddingId: string }>();

  if (!weddingId) return null;

  const navItems = [
    {
      to: `/weddings/${weddingId}`,
      label: 'Live Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: `/weddings/${weddingId}/guests`,
      label: 'Guest Management',
      icon: Users,
    },
    {
      to: `/weddings/${weddingId}/events`,
      label: 'Events & Functions',
      icon: CalendarDays,
    },
    {
      to: `/weddings/${weddingId}/messages`,
      label: 'WhatsApp Sender',
      icon: Send,
    },
    {
      to: `/weddings/${weddingId}/templates`,
      label: 'Message Templates',
      icon: MessageSquareCode,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-cream-200 flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      {weddingTitle && (
        <div className="px-5 py-4 border-b border-cream-100 bg-cream-50/50">
          <NavLink
            to="/weddings"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-700 font-medium mb-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>All Weddings</span>
          </NavLink>
          <h2 className="font-serif font-bold text-stone-900 text-base leading-tight truncate">
            {weddingTitle}
          </h2>
        </div>
      )}

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-maroon-50 text-maroon-800 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-cream-100'
              }`
            }
          >
            <item.icon size={18} className="shrink-0 text-maroon-700" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
