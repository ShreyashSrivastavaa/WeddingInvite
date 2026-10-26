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
    <div className="min-h-screen bg-[#faf5eb] flex flex-col selection:bg-[#cacab0] selection:text-[#484036]">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-10 pb-6 border-b border-[#666e72]/20">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal text-[#33302c] tracking-[-0.04em] leading-[1.03]">
              Wedding Projects
            </h1>
            <p className="text-sm text-[#484036] mt-2 leading-[1.35] tracking-[0.01em]">
              Select a wedding atelier to curate invitations, guest lists, and live attendance metrics.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-[4px] border border-[#484036] text-[#484036] hover:bg-[#484036] hover:text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] transition-all shadow-none"
          >
            <Plus size={16} />
            <span>New Wedding</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 rounded-[4px] bg-[#ecece4] border border-[#666e72]/20 animate-pulse p-7"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-7 rounded-[4px] bg-[#ecece4] border border-rose-300 text-rose-900 text-center text-sm">
            Failed to load weddings. Please refresh.
          </div>
        ) : data?.weddings.length === 0 ? (
          <div className="bg-[#ecece4] rounded-[4px] border border-[#666e72]/30 p-12 text-center max-w-lg mx-auto shadow-none">
            <div className="w-14 h-14 rounded-[4px] bg-[#f2e9cf] text-[#484036] border border-[#cacab0] flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="font-normal text-xl text-[#33302c] tracking-[-0.03em]">No weddings yet</h3>
            <p className="text-sm text-[#484036] mt-2 mb-6 leading-relaxed">
              Create your first wedding workspace to start curating guest lists and tracking responses.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-[4px] border border-[#484036] text-[#484036] hover:bg-[#484036] hover:text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] transition-all"
            >
              <Plus size={16} />
              <span>Create First Wedding</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {data?.weddings.map((w) => (
              <div
                key={w.id}
                className="bg-[#ecece4] rounded-[4px] border border-[#666e72]/30 hover:border-[#484036] transition-all flex flex-col justify-between overflow-hidden group shadow-none"
              >
                <div className="p-7">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <span className="text-xs font-normal px-3 py-1 rounded-[4px] bg-[#f2e9cf] text-[#484036] border border-[#cacab0] tracking-[0.02em]">
                      {w._count?.events || 0} Event{w._count?.events === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setWeddingToDelete(w);
                      }}
                      className="p-1.5 text-[#666e72] hover:text-red-700 rounded-[4px] hover:bg-[#faf5eb] transition-colors"
                      title="Delete wedding"
                      aria-label="Delete wedding"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <Link to={`/weddings/${w.id}`} className="block">
                    <h3 className="text-2xl font-normal text-[#33302c] tracking-[-0.03em] leading-tight group-hover:text-[#484036] transition-colors">
                      {w.title}
                    </h3>
                    <p className="text-sm text-[#484036]/75 mt-1.5 font-serif italic">
                      {w.partnerOneName} {w.partnerTwoName ? `& ${w.partnerTwoName}` : ''}
                    </p>
                  </Link>

                  <div className="mt-6 pt-4 border-t border-[#666e72]/20 flex items-center justify-between text-xs text-[#666e72]">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#484036]" />
                      <span>
                        Deadline: {new Date(w.rsvpDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={13} className="text-[#484036]" />
                      <span>{w._count?.households || 0} Households</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/weddings/${w.id}`}
                  className="bg-[#ecece4] px-7 py-3.5 border-t border-[#666e72]/20 flex items-center justify-between text-xs uppercase tracking-[0.05em] font-normal text-[#484036] group-hover:bg-[#cacab0]/25 transition-colors"
                >
                  <span>Open Wedding Workspace</span>
                  <ChevronRight size={15} />
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

        <form onSubmit={handleCreateSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
              Wedding Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Aarav & Ishita Wedding"
              className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-[#484036] sm:text-sm font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
                Partner 1 Name *
              </label>
              <input
                id="partnerOneName"
                type="text"
                required
                value={partnerOneName}
                onChange={(e) => setPartnerOneName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-[#484036] sm:text-sm font-normal"
              />
            </div>
            <div>
              <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
                Partner 2 Name (Optional)
              </label>
              <input
                id="partnerTwoName"
                type="text"
                value={partnerTwoName}
                onChange={(e) => setPartnerTwoName(e.target.value)}
                placeholder="e.g. Ishita Kapoor"
                className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-[#484036] sm:text-sm font-normal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
                RSVP Deadline *
              </label>
              <input
                id="rsvpDeadline"
                type="date"
                required
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-[#484036] sm:text-sm font-normal"
              />
            </div>
            <div>
              <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
                Catering Target (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={cateringTarget}
                onChange={(e) => setCateringTarget(e.target.value ? parseInt(e.target.value, 10) : '')}
                placeholder="e.g. 250"
                className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-[#484036] sm:text-sm font-normal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
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
                    className={`px-3 py-1.5 rounded-[4px] text-xs font-normal border transition-colors ${
                      isSelected
                        ? 'bg-[#484036] border-[#484036] text-[#faf5eb]'
                        : 'bg-[#faf5eb] border-[#666e72]/30 text-[#484036] hover:bg-[#ecece4]'
                    }`}
                  >
                    {DIETARY_LABELS[diet]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-normal uppercase tracking-[0.05em] text-[#484036] mb-1.5">
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
                    className={`flex items-center gap-3 p-3 rounded-[4px] border text-left transition-all ${
                      isSelected
                        ? 'border-[#484036] bg-[#cacab0]/30 ring-1 ring-[#484036]'
                        : 'border-[#666e72]/30 bg-[#ecece4] hover:border-[#666e72]'
                    }`}
                  >
                    <div className="flex -space-x-1 shrink-0">
                      <span
                        className="w-4 h-4 rounded-full border border-[#faf5eb]"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-[#faf5eb]"
                        style={{ backgroundColor: t.secondary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-[#faf5eb]"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-normal text-[#33302c] truncate">{t.name}</p>
                      <p className="text-[10px] text-[#666e72] truncate">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#666e72]/20">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="px-5 py-2.5 border border-[#666e72]/40 rounded-[4px] text-xs uppercase tracking-[0.05em] font-normal text-[#484036] hover:bg-[#ecece4]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2.5 rounded-[4px] bg-[#484036] hover:bg-[#33302c] text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] transition-colors disabled:opacity-50"
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
            <div className="flex items-center gap-3 p-3 rounded-[4px] bg-[#f2e9cf] border border-[#cacab0] text-[#484036] text-xs mb-4">
              <AlertTriangle size={18} className="shrink-0 text-red-700" />
              <span>
                Warning: This will permanently delete all events, guests, invitations, RSVPs, and logs for{' '}
                <strong>{weddingToDelete.title}</strong>.
              </span>
            </div>

            {deleteError && (
              <p className="text-xs text-red-700 font-normal mb-3">{deleteError}</p>
            )}

            <p className="text-xs text-[#484036] mb-2 uppercase tracking-[0.04em]">
              To confirm deletion, please type the exact title below:
            </p>
            <p className="text-xs font-mono bg-[#ecece4] p-2.5 rounded-[4px] border border-[#666e72]/30 select-all mb-3 text-[#33302c]">
              {weddingToDelete.title}
            </p>

            <input
              type="text"
              value={typedTitleConfirm}
              onChange={(e) => setTypedTitleConfirm(e.target.value)}
              placeholder="Type title here"
              className="w-full px-3.5 py-2.5 border border-[#666e72]/40 rounded-[4px] bg-[#faf5eb] text-[#33302c] focus:outline-none focus:border-red-700 sm:text-sm mb-5 font-normal"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setWeddingToDelete(null);
                  setTypedTitleConfirm('');
                }}
                className="px-5 py-2.5 border border-[#666e72]/40 rounded-[4px] text-xs uppercase tracking-[0.05em] font-normal text-[#484036] hover:bg-[#ecece4]"
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
                className="px-6 py-2.5 rounded-[4px] bg-red-800 hover:bg-red-900 text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] transition-colors disabled:opacity-50"
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
