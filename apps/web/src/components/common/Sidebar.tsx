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
    <aside className="w-64 bg-[#faf5eb] border-r border-[#666e72]/25 flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16">
      {weddingTitle && (
        <div className="px-6 py-5 border-b border-[#666e72]/20 bg-[#ecece4]">
          <NavLink
            to="/weddings"
            className="inline-flex items-center gap-1.5 text-xs text-[#666e72] hover:text-[#484036] font-normal mb-2 transition-colors uppercase tracking-[0.05em]"
          >
            <ArrowLeft size={13} />
            <span>All Weddings</span>
          </NavLink>
          <h2 className="font-normal text-[#33302c] text-lg leading-tight tracking-[-0.03em] truncate">
            {weddingTitle}
          </h2>
        </div>
      )}

      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-[4px] text-xs uppercase tracking-[0.05em] font-normal transition-all ${
                isActive
                  ? 'bg-[#ecece4] text-[#33302c] border border-[#666e72]/40 font-medium'
                  : 'text-[#484036] hover:text-[#33302c] hover:bg-[#ecece4]/60'
              }`
            }
          >
            <item.icon size={16} className="shrink-0 text-[#484036]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
