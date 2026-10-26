import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, ChevronDown } from 'lucide-react';

interface EventOption {
  id: string;
  name: string;
  startsAt: string;
}

interface EventSelectorProps {
  events: EventOption[];
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentEventId = selectedEventId || searchParams.get('eventId') || (events[0]?.id ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (onSelectEvent) {
      onSelectEvent(newId);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('eventId', newId);
      setSearchParams(nextParams);
    }
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center">
      <div className="absolute left-3 pointer-events-none text-maroon-700">
        <Calendar size={16} />
      </div>
      <select
        value={currentEventId}
        onChange={handleChange}
        aria-label="Filter by wedding event"
        className="appearance-none bg-white border border-cream-300 text-stone-800 text-sm font-medium rounded-xl pl-9 pr-9 py-2 hover:border-maroon-600 focus:outline-none focus:ring-2 focus:ring-maroon-700 focus:border-maroon-700 transition-colors shadow-sm cursor-pointer"
      >
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 pointer-events-none text-stone-400">
        <ChevronDown size={14} />
      </div>
    </div>
  );
};
