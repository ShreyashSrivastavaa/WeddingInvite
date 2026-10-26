import React from 'react';
import { OrganizerStatus, ORGANIZER_STATUS_CONFIG } from '@rsvp/shared';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: OrganizerStatus;
  customLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  size = 'md',
}) => {
  const config = ORGANIZER_STATUS_CONFIG[status] || {
    label: status,
    variant: 'neutral',
  };
  const label = customLabel || config.label;

  const iconSize = size === 'sm' ? 12 : 14;

  const getIcon = () => {
    switch (status) {
      case OrganizerStatus.ATTENDING:
        return <CheckCircle2 size={iconSize} className="shrink-0 text-emerald-700" />;
      case OrganizerStatus.NOT_ATTENDING:
        return <XCircle size={iconSize} className="shrink-0 text-rose-700" />;
      case OrganizerStatus.NEEDS_FOLLOW_UP:
        return <AlertCircle size={iconSize} className="shrink-0 text-amber-700" />;
      case OrganizerStatus.PENDING:
        return <Clock size={iconSize} className="shrink-0 text-sky-700" />;
      case OrganizerStatus.INVITED:
        return <Send size={iconSize} className="shrink-0 text-indigo-700" />;
      case OrganizerStatus.NOT_CONTACTED:
      default:
        return <HelpCircle size={iconSize} className="shrink-0 text-stone-600" />;
    }
  };

  const getVariantStyles = () => {
    switch (status) {
      case OrganizerStatus.ATTENDING:
        return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      case OrganizerStatus.NOT_ATTENDING:
        return 'bg-rose-50 text-rose-900 border-rose-200';
      case OrganizerStatus.NEEDS_FOLLOW_UP:
        return 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
      case OrganizerStatus.PENDING:
        return 'bg-sky-50 text-sky-900 border-sky-200';
      case OrganizerStatus.INVITED:
        return 'bg-indigo-50 text-indigo-900 border-indigo-200';
      case OrganizerStatus.NOT_CONTACTED:
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const sizeStyles =
    size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-xs md:text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeStyles} ${getVariantStyles()}`}
    >
      {getIcon()}
      <span>{label}</span>
    </span>
  );
};
