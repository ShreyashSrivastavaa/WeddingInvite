import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { GuestDrawer } from './GuestDrawer';
import { CsvImportModal } from './CsvImportModal';
import { Modal } from '../../components/common/Modal';
import {
  Category,
  Side,
  OrganizerStatus,
  ORGANIZER_STATUS_CONFIG,
  HOUSEHOLD_MIN_INVITED,
  HOUSEHOLD_MAX_INVITED,
} from '@rsvp/shared';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Download,
  Share2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
  MoreVertical,
  AlertTriangle,
  Sparkles,
  Phone,
  Eye,
  Users,
} from 'lucide-react';

export const GuestsPage: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Filter states from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const eventId = searchParams.get('eventId') || '';

  // Add Guest Form States
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [invitedCount, setInvitedCount] = useState(2);
  const [guestCategory, setGuestCategory] = useState<Category>(Category.FAMILY);
  const [guestSide, setGuestSide] = useState<Side | ''>('');
  const [notes, setNotes] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Fetch wedding events
  const { data: weddingData } = useQuery<{ wedding: any }>({
    queryKey: ['wedding', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}`),
  });

  const wedding = weddingData?.wedding;
  const events = wedding?.events || [];

  // Query households
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '25');
  if (search) queryParams.set('search', search);
  if (category) queryParams.set('category', category);
  if (status) queryParams.set('status', status);
  if (eventId) queryParams.set('eventId', eventId);

  const { data, isLoading, error } = useQuery<{
    households: any[];
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }>({
    queryKey: ['households', weddingId, queryParams.toString()],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/households?${queryParams.toString()}`),
  });

  const addGuestMutation = useMutation({
    mutationFn: (newGuest: any) =>
      apiFetch<{ household: any; duplicateWarning: any }>(
        `/api/weddings/${weddingId}/households`,
        {
          method: 'POST',
          body: JSON.stringify(newGuest),
        }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
      if (res.duplicateWarning) {
        setDuplicateWarning(res.duplicateWarning.message);
      } else {
        setIsAddGuestOpen(false);
        resetAddForm();
      }
    },
    onError: (err: ApiError) => {
      setAddError(err.message);
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (householdId: string) =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
    },
  });

  const generateAllLinksMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; generatedCount: number }>(
        `/api/weddings/${weddingId}/households/invitations/generate-all`,
        { method: 'POST' }
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      alert(`Generated active links for ${res.generatedCount} households.`);
    },
  });

  const resetAddForm = () => {
    setDisplayName('');
    setPhone('');
    setEmail('');
    setInvitedCount(2);
    setGuestCategory(Category.FAMILY);
    setGuestSide('');
    setNotes('');
    setAddError(null);
    setDuplicateWarning(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setDuplicateWarning(null);

    addGuestMutation.mutate({
      displayName,
      phone,
      email: email || undefined,
      category: guestCategory,
      side: guestSide || undefined,
      invitedCount,
      notes: notes || undefined,
    });
  };

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  // CSV Export Handlers
  const handleExport = async (type: 'guest-list' | 'catering-summary' | 'attendees') => {
    setIsExportMenuOpen(false);
    const targetEventId = eventId || events[0]?.id;
    if (!targetEventId) {
      alert('Please create at least one event first to export event data.');
      return;
    }

    try {
      const blob = await apiFetch<Blob>(
        `/api/weddings/${weddingId}/households/export/${type}?eventId=${targetEventId}`
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${targetEventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Header
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="hidden md:block">
          <Sidebar weddingTitle={wedding?.title} />
        </div>
        {isMobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-stone-900/60" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative z-50 w-64 bg-white h-full">
              <Sidebar weddingTitle={wedding?.title} onCloseMobile={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Guest Management
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                {data?.pagination.totalCount || 0} households on list
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsAddGuestOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <UserPlus size={16} />
                <span>Add Guest</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 text-stone-700 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <FileSpreadsheet size={16} className="text-emerald-700" />
                <span>Import CSV</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-cream-100 border border-cream-300 text-stone-700 text-xs sm:text-sm font-semibold shadow-sm transition-colors"
                >
                  <Download size={16} className="text-stone-500" />
                  <span>Export</span>
                </button>

                {isExportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-cream-200 py-1.5 z-50 animate-fade-in text-xs">
                      <button
                        onClick={() => handleExport('guest-list')}
                        className="w-full text-left px-4 py-2 hover:bg-cream-50 font-medium text-stone-800"
                      >
                        Guest List (.csv)
                      </button>
                      <button
                        onClick={() => handleExport('catering-summary')}
                        className="w-full text-left px-4 py-2 hover:bg-cream-50 font-medium text-stone-800"
                      >
                        Catering Summary Sheet (.csv)
                      </button>
                      <button
                        onClick={() => handleExport('attendees')}
                        className="w-full text-left px-4 py-2 hover:bg-cream-50 font-medium text-stone-800"
                      >
                        Attendee-Level Dietaries (.csv)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search name, phone, email..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-cream-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon-700"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category */}
              <select
                value={category}
                onChange={(e) => updateFilter('category', e.target.value)}
                aria-label="Filter by guest category"
                className="px-3 py-2 text-xs border border-cream-300 rounded-xl bg-white font-medium text-stone-700"
              >
                <option value="">All Categories</option>
                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={status}
                onChange={(e) => updateFilter('status', e.target.value)}
                aria-label="Filter by RSVP status"
                className="px-3 py-2 text-xs border border-cream-300 rounded-xl bg-white font-medium text-stone-700"
              >
                <option value="">All Statuses</option>
                {Object.values(OrganizerStatus).map((s) => (
                  <option key={s} value={s}>
                    {ORGANIZER_STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>

              {/* Event Filter */}
              <select
                value={eventId}
                onChange={(e) => updateFilter('eventId', e.target.value)}
                aria-label="Filter by wedding function"
                className="px-3 py-2 text-xs border border-cream-300 rounded-xl bg-white font-medium text-stone-700"
              >
                <option value="">All Events</option>
                {events.map((ev: any) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest Table (Responsive: Desktop Table / Mobile Cards) */}
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-stone-400 text-sm">Loading guests...</div>
            ) : error ? (
              <div className="p-8 text-center text-rose-800 text-sm">
                Failed to load guests. Please retry.
              </div>
            ) : data?.households.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <Users size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="font-semibold text-stone-800">No guests found</p>
                <p className="text-xs text-stone-400 mt-1">
                  Try adjusting filters or add new guests to your wedding list.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-cream-200 text-xs">
                    <thead className="bg-cream-50/70 text-stone-500 font-semibold text-left">
                      <tr>
                        <th className="py-3.5 px-4">Guest / Family</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4 text-center">Invited / Confirmed</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Last Contacted</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {data?.households.map((h) => (
                        <tr
                          key={h.id}
                          onClick={() => setSelectedHouseholdId(h.id)}
                          className="hover:bg-cream-50/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-stone-900 text-sm block">
                              {h.displayName}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-cream-100 text-stone-600">
                                {h.category}
                              </span>
                              {h.side && (
                                <span className="px-1.5 py-0.2 rounded bg-maroon-50 text-maroon-800">
                                  {h.side}
                                </span>
                              )}
                              {h.doNotContact && (
                                <span className="text-rose-600 font-bold">Opted-Out</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-stone-600">
                            {h.phoneFormatted}
                          </td>

                          <td className="py-3 px-4 text-center font-medium">
                            <span className="text-emerald-800 font-bold">
                              {h.confirmedCount}
                            </span>
                            <span className="text-stone-400"> / {h.invitedCount}</span>
                          </td>

                          <td className="py-3 px-4">
                            <StatusBadge status={h.status} customLabel={h.statusLabel} />
                            {h.statusReason && (
                              <p className="text-[10px] text-stone-500 mt-0.5 truncate max-w-xs">
                                {h.statusReason}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {h.lastContactedAt
                              ? new Date(h.lastContactedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : 'Never'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setSelectedHouseholdId(h.id)}
                                className="p-1.5 text-stone-400 hover:text-maroon-700 hover:bg-cream-100 rounded-lg transition-colors"
                                title="View details"
                                aria-label="View guest details"
                              >
                                <Eye size={16} />
                              </button>
                              <Link
                                to={`/weddings/${weddingId}/messages?householdId=${h.id}`}
                                className="p-1.5 text-stone-400 hover:text-saffron-700 hover:bg-cream-100 rounded-lg transition-colors"
                                title="Send WhatsApp"
                                aria-label="Send WhatsApp message"
                              >
                                <Send size={16} />
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove "${h.displayName}" from wedding guest list?`)) {
                                    deleteGuestMutation.mutate(h.id);
                                  }
                                }}
                                className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete"
                                aria-label="Delete guest"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (< 768px) */}
                <div className="md:hidden divide-y divide-cream-100">
                  {data?.households.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => setSelectedHouseholdId(h.id)}
                      className="p-4 hover:bg-cream-50 transition-colors space-y-2 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-serif font-bold text-stone-900 text-sm">
                            {h.displayName}
                          </p>
                          <p className="text-xs text-stone-500 font-mono mt-0.5">{h.phoneFormatted}</p>
                        </div>
                        <StatusBadge status={h.status} customLabel={h.statusLabel} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
                        <span>
                          Seats:{' '}
                          <strong className="text-stone-900">
                            {h.confirmedCount}/{h.invitedCount}
                          </strong>
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/weddings/${weddingId}/messages?householdId=${h.id}`}
                            className="p-1 text-saffron-700 bg-saffron-50 rounded"
                            aria-label="Send WhatsApp"
                          >
                            <Send size={14} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${h.displayName}"?`)) {
                                deleteGuestMutation.mutate(h.id);
                              }
                            }}
                            className="p-1 text-rose-700 bg-rose-50 rounded"
                            aria-label="Delete guest"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {data && data.pagination.totalPages > 1 && (
                  <div className="px-4 py-3 bg-cream-50/50 border-t border-cream-200 flex items-center justify-between text-xs text-stone-600">
                    <span>
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        disabled={data.pagination.page <= 1}
                        onClick={() => updateFilter('page', (data.pagination.page - 1).toString())}
                        className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        disabled={data.pagination.page >= data.pagination.totalPages}
                        onClick={() => updateFilter('page', (data.pagination.page + 1).toString())}
                        className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Guest Drawer */}
      <GuestDrawer
        isOpen={!!selectedHouseholdId}
        onClose={() => setSelectedHouseholdId(null)}
        householdId={selectedHouseholdId}
        weddingId={weddingId!}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        weddingId={weddingId!}
      />

      {/* Add Guest Modal */}
      <Modal
        isOpen={isAddGuestOpen}
        onClose={() => {
          setIsAddGuestOpen(false);
          resetAddForm();
        }}
        title="Add Guest / Household"
        maxWidth="md"
      >
        {addError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {addError}
          </div>
        )}

        {duplicateWarning && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold flex items-center gap-1">
              <AlertTriangle size={14} /> Duplicate Phone Detected
            </p>
            <p className="mt-1">{duplicateWarning}</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddGuestOpen(false);
                  resetAddForm();
                }}
                className="px-3 py-1 bg-amber-700 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {!duplicateWarning && (
          <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Guest / Family Name *</label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Verma Family or Dr. Rajesh Verma"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Mobile Number (India or International) *
              </label>
              <input
                id="phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98765 43210 or +91 98765 43210"
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Invited Seats (Cap) *</label>
                <input
                  id="invitedCount"
                  type="number"
                  min={HOUSEHOLD_MIN_INVITED}
                  max={HOUSEHOLD_MAX_INVITED}
                  required
                  value={invitedCount}
                  onChange={(e) => setInvitedCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Category</label>
                <select
                  id="category"
                  value={guestCategory}
                  onChange={(e) => setGuestCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
                >
                  {Object.values(Category).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Wedding Side (Optional)</label>
                <select
                  value={guestSide}
                  onChange={(e) => setGuestSide(e.target.value as Side | '')}
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
                >
                  <option value="">None / Both</option>
                  <option value={Side.BRIDE}>Bride</option>
                  <option value={Side.GROOM}>Groom</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Organizer Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VIP seating, airport pickup required, etc."
                className="w-full px-3 py-2 border border-cream-300 rounded-xl text-stone-900 sm:text-xs"
              />
            </div>

            <div className="pt-3 border-t border-cream-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddGuestOpen(false);
                  resetAddForm();
                }}
                className="px-4 py-2 border border-cream-300 rounded-xl text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addGuestMutation.isPending}
                className="px-5 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {addGuestMutation.isPending ? 'Saving...' : 'Add Guest'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
