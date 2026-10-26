import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { Modal } from '../../components/common/Modal';
import {
  CalendarDays,
  Plus,
  MapPin,
  Clock,
  Utensils,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const queryClient = useQueryClient();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [description, setDescription] = useState('');
  const [cateringTarget, setCateringTarget] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState(0);

  const { data: weddingData } = useQuery<{ wedding: any }>({
    queryKey: ['wedding', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}`),
  });

  const { data, isLoading } = useQuery<{ events: any[] }>({
    queryKey: ['events', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/events`),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingEvent) {
        return apiFetch(`/api/weddings/${weddingId}/events/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        return apiFetch(`/api/weddings/${weddingId}/events`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
      handleCloseModal();
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiFetch(`/api/weddings/${weddingId}/events/${eventId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['wedding', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
    },
  });

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setName('');
    setStartsAt('');
    setEndsAt('');
    setVenueName('');
    setVenueAddress('');
    setMapsUrl('');
    setDescription('');
    setCateringTarget('');
    setSortOrder((data?.events.length || 0) + 1);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: any) => {
    setEditingEvent(ev);
    setName(ev.name);
    setStartsAt(ev.startsAt ? new Date(ev.startsAt).toISOString().slice(0, 16) : '');
    setEndsAt(ev.endsAt ? new Date(ev.endsAt).toISOString().slice(0, 16) : '');
    setVenueName(ev.venueName);
    setVenueAddress(ev.venueAddress);
    setMapsUrl(ev.mapsUrl || '');
    setDescription(ev.description || '');
    setCateringTarget(ev.cateringTarget || '');
    setSortOrder(ev.sortOrder || 0);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (startsAt && endsAt) {
      if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        setError('End time must be strictly after event start time.');
        return;
      }
    }

    saveMutation.mutate({
      name,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      venueName,
      venueAddress,
      mapsUrl: mapsUrl || undefined,
      description: description || undefined,
      cateringTarget: cateringTarget ? Number(cateringTarget) : undefined,
      sortOrder: Number(sortOrder),
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Header
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="hidden md:block">
          <Sidebar weddingTitle={weddingData?.wedding?.title} />
        </div>
        {isMobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-stone-900/60" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative z-50 w-64 bg-white h-full">
              <Sidebar weddingTitle={weddingData?.wedding?.title} onCloseMobile={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Wedding Functions & Events
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Configure ceremonies (Mehendi, Sangeet, Wedding, Reception). Each event tracks catering targets and attendance individually.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Plus size={16} />
              <span>Add Function</span>
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white rounded-2xl border border-cream-200 animate-pulse" />
              ))}
            </div>
          ) : data?.events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center max-w-md mx-auto">
              <CalendarDays size={36} className="mx-auto text-saffron-600 mb-3" />
              <h3 className="font-serif font-bold text-stone-900 text-base">No functions added yet</h3>
              <p className="text-xs text-stone-500 mt-1 mb-5">
                Add your wedding events so guests can RSVP to each function.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-maroon-700 text-white font-semibold text-xs"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm hover:border-maroon-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cream-100 text-stone-700">
                        #{ev.sortOrder}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-stone-900">{ev.name}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-saffron-600" />
                        <span>
                          {new Date(ev.startsAt).toLocaleString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-maroon-700" />
                        <span>{ev.venueName}, {ev.venueAddress}</span>
                        {ev.mapsUrl && (
                          <a
                            href={ev.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-maroon-700 hover:underline"
                            title="Open Google Maps"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>

                      {ev.cateringTarget && (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <Utensils size={14} />
                          <span>Target: {ev.cateringTarget} heads</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-cream-100 justify-end">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-cream-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete event "${ev.name}"? This removes responses for this event.`)) {
                          deleteMutation.mutate(ev.id);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEvent ? 'Edit Function Details' : 'Add New Wedding Function'}
        maxWidth="lg"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-stone-700 font-medium mb-1">Function Name *</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sangeet & Musical Evening"
              className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Starts At *</label>
              <input
                id="startsAt"
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-medium mb-1">Ends At (Optional)</label>
              <input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Venue Name *</label>
              <input
                id="venueName"
                type="text"
                required
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Grand Ballroom, Taj Palace"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-medium mb-1">Catering Target (Optional)</label>
              <input
                id="cateringTarget"
                type="number"
                min="0"
                value={cateringTarget}
                onChange={(e) => setCateringTarget(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="e.g. 250"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Venue Address *</label>
            <input
              id="venueAddress"
              type="text"
              required
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="e.g. 2 Sardar Patel Marg, Diplomatic Enclave, New Delhi"
              className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Google Maps Link (Optional)</label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
            />
          </div>

          <div className="pt-3 border-t border-cream-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 border border-cream-300 rounded-xl text-stone-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
