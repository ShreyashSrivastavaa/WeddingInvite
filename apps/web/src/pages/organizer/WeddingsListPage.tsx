import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import {
  DEFAULT_DIETARY_OPTIONS,
  DEFAULT_THEME,
  DEFAULT_TIMEZONE,
  Dietary,
  DIETARY_LABELS,
  THEME_PRESETS,
  ThemeKey,
} from '@rsvp/shared';
import {
  Plus,
  Calendar,
  Users,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const WeddingsListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [weddingToDelete, setWeddingToDelete] = useState<any | null>(null);
  const [typedTitleConfirm, setTypedTitleConfirm] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [partnerOneName, setPartnerOneName] = useState('');
  const [partnerTwoName, setPartnerTwoName] = useState('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [cateringTarget, setCateringTarget] = useState<number | ''>('');
  const [selectedDietary, setSelectedDietary] = useState<Dietary[]>(DEFAULT_DIETARY_OPTIONS);
  const [selectedTheme, setSelectedTheme] = useState<string>(DEFAULT_THEME);

  const { data, isLoading, error } = useQuery<{ weddings: any[] }>({
    queryKey: ['weddings'],
    queryFn: () => apiFetch('/api/weddings'),
  });

  const createMutation = useMutation({
    mutationFn: (newWedding: any) =>
      apiFetch<{ wedding: any }>('/api/weddings', {
        method: 'POST',
        body: JSON.stringify(newWedding),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      setIsCreateOpen(false);
      resetForm();
      navigate(`/weddings/${res.wedding.id}`);
    },
    onError: (err: ApiError) => {
      setCreateError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ weddingId, confirmTitle }: { weddingId: string; confirmTitle: string }) =>
      apiFetch(`/api/weddings/${weddingId}?confirmTitle=${encodeURIComponent(confirmTitle)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
      setWeddingToDelete(null);
      setTypedTitleConfirm('');
    },
    onError: (err: ApiError) => {
      setDeleteError(err.message);
    },
  });

  const resetForm = () => {
    setTitle('');
    setPartnerOneName('');
    setPartnerTwoName('');
    setRsvpDeadline('');
    setCateringTarget('');
    setSelectedDietary(DEFAULT_DIETARY_OPTIONS);
    setSelectedTheme(DEFAULT_THEME);
    setCreateError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!rsvpDeadline) {
      setCreateError('Please select an RSVP deadline.');
      return;
    }

    createMutation.mutate({
      title,
      partnerOneName,
      partnerTwoName: partnerTwoName || undefined,
      rsvpDeadline: new Date(rsvpDeadline).toISOString(),
      timezone: DEFAULT_TIMEZONE,
      dietaryOptions: selectedDietary,
      theme: selectedTheme,
      cateringTarget: cateringTarget ? Number(cateringTarget) : undefined,
    });
  };

  const toggleDietary = (opt: Dietary) => {
    if (selectedDietary.includes(opt)) {
      if (selectedDietary.length > 1) {
        setSelectedDietary(selectedDietary.filter((d) => d !== opt));
      }
    } else {
      setSelectedDietary([...selectedDietary, opt]);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Wedding Projects
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Select a wedding to manage invitations, guest lists, and live attendance metrics.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Plus size={18} />
            <span>New Wedding</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-2xl bg-white border border-cream-200 animate-pulse p-6"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
            Failed to load weddings. Please refresh.
          </div>
        ) : data?.weddings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="font-serif font-semibold text-lg text-stone-900">No weddings yet</h3>
            <p className="text-sm text-stone-600 mt-1 mb-6">
              Create your first wedding project to start inviting guests and managing RSVPs.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Create First Wedding</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.weddings.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl border border-cream-200 hover:border-maroon-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cream-100 text-maroon-800 border border-cream-200">
                      {w._count?.events || 0} Event{w._count?.events === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWeddingToDelete(w);
                      }}
                      className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete wedding"
                      aria-label="Delete wedding"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Link to={`/weddings/${w.id}`} className="block group-hover:text-maroon-800">
                    <h3 className="text-xl font-serif font-bold text-stone-900 group-hover:text-maroon-800 transition-colors">
                      {w.title}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">
                      {w.partnerOneName} {w.partnerTwoName ? `& ${w.partnerTwoName}` : ''}
                    </p>
                  </Link>

                  <div className="mt-5 pt-4 border-t border-cream-100 flex items-center justify-between text-xs text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-saffron-600" />
                      <span>
                        Deadline: {new Date(w.rsvpDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-maroon-700" />
                      <span>{w._count?.households || 0} Households</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/weddings/${w.id}`}
                  className="bg-cream-50 px-6 py-3 border-t border-cream-200 flex items-center justify-between text-sm font-semibold text-maroon-800 group-hover:bg-maroon-50 transition-colors"
                >
                  <span>Open Wedding Workspace</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Wedding Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title="Create New Wedding Project"
        maxWidth="lg"
      >
        {createError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {createError}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Wedding Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Aarav & Ishita Wedding"
              className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Partner 1 Name *
              </label>
              <input
                id="partnerOneName"
                type="text"
                required
                value={partnerOneName}
                onChange={(e) => setPartnerOneName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Partner 2 Name (Optional)
              </label>
              <input
                id="partnerTwoName"
                type="text"
                value={partnerTwoName}
                onChange={(e) => setPartnerTwoName(e.target.value)}
                placeholder="e.g. Ishita Kapoor"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                RSVP Deadline *
              </label>
              <input
                id="rsvpDeadline"
                type="date"
                required
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Catering Target (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={cateringTarget}
                onChange={(e) => setCateringTarget(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="e.g. 250"
                className="w-full px-3.5 py-2.5 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-maroon-700 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Enabled Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Dietary).map((diet) => {
                const isSelected = selectedDietary.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => toggleDietary(diet)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-maroon-50 border-maroon-700 text-maroon-900'
                        : 'bg-white border-cream-300 text-stone-600 hover:bg-cream-50'
                    }`}
                  >
                    {DIETARY_LABELS[diet]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Invitation Color Palette / Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(THEME_PRESETS).map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTheme(t.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-maroon-700 bg-maroon-50/50 ring-2 ring-maroon-700/20 shadow-sm'
                        : 'border-cream-300 bg-white hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex -space-x-1 shrink-0">
                      <span
                        className="w-5 h-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: t.secondary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-stone-900 truncate">{t.name}</p>
                      <p className="text-[10px] text-stone-500 truncate">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-cream-200">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-cream-300 rounded-xl text-sm font-medium text-stone-700 hover:bg-cream-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Wedding'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!weddingToDelete}
        onClose={() => {
          setWeddingToDelete(null);
          setTypedTitleConfirm('');
          setDeleteError(null);
        }}
        title="Delete Wedding Confirmation"
        maxWidth="md"
      >
        {weddingToDelete && (
          <div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-4">
              <AlertTriangle size={20} className="shrink-0" />
              <span>
                Warning: This will permanently delete all events, guests, invitations, RSVPs, and logs for{' '}
                <strong>{weddingToDelete.title}</strong>.
              </span>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold mb-3">{deleteError}</p>
            )}

            <p className="text-sm text-stone-700 mb-2">
              To confirm deletion, please type the exact title below:
            </p>
            <p className="text-xs font-mono bg-cream-100 p-2 rounded-lg border border-cream-200 select-all mb-3 text-stone-900">
              {weddingToDelete.title}
            </p>

            <input
              type="text"
              value={typedTitleConfirm}
              onChange={(e) => setTypedTitleConfirm(e.target.value)}
              placeholder="Type title here"
              className="w-full px-3.5 py-2 border border-cream-300 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-600 sm:text-sm mb-5"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setWeddingToDelete(null);
                  setTypedTitleConfirm('');
                }}
                className="px-4 py-2 border border-cream-300 rounded-xl text-sm font-medium text-stone-700 hover:bg-cream-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={typedTitleConfirm !== weddingToDelete.title || deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate({
                    weddingId: weddingToDelete.id,
                    confirmTitle: typedTitleConfirm,
                  })
                }
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-medium text-sm transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
