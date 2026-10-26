import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { renderTemplate } from '@rsvp/shared';
import { MessageSquareCode, Save, Sparkles, Check } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const queryClient = useQueryClient();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [invitation, setInvitation] = useState('');
  const [gentleReminder, setGentleReminder] = useState('');
  const [finalReminder, setFinalReminder] = useState('');
  const [activeTab, setActiveTab] = useState<'invitation' | 'gentle' | 'final'>('invitation');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: weddingData } = useQuery<{ wedding: any }>({
    queryKey: ['wedding', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}`),
  });

  const { data: templateData, isLoading } = useQuery<{
    templates: { invitation: string; gentleReminder: string; finalReminder: string };
  }>({
    queryKey: ['templates', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/templates`),
  });

  useEffect(() => {
    if (templateData?.templates) {
      setInvitation(templateData.templates.invitation);
      setGentleReminder(templateData.templates.gentleReminder);
      setFinalReminder(templateData.templates.finalReminder);
    }
  }, [templateData]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch(`/api/weddings/${weddingId}/templates`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', weddingId] });
      setSaveSuccess(true);
      setError(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const sampleVars = {
    guest_name: 'Dr. Rajesh Sharma',
    couple_names: weddingData?.wedding
      ? `${weddingData.wedding.partnerOneName} & ${weddingData.wedding.partnerTwoName || 'Partner'}`
      : 'Aarav & Ishita',
    event_name: 'Wedding & Reception',
    date: 'Sat, 14 Feb 2027, 7:00 PM',
    venue: 'The Palace Gardens, Jaipur',
    deadline: '1 Feb 2027',
    rsvp_link: 'https://wedding.app/r/sample-token',
  };

  const activeTemplateText =
    activeTab === 'invitation'
      ? invitation
      : activeTab === 'gentle'
      ? gentleReminder
      : finalReminder;

  const setActiveTemplateText = (text: string) => {
    if (activeTab === 'invitation') setInvitation(text);
    else if (activeTab === 'gentle') setGentleReminder(text);
    else setFinalReminder(text);
  };

  const preview = renderTemplate(activeTemplateText, sampleVars);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      invitation,
      gentleReminder,
      finalReminder,
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
                WhatsApp Message Templates
              </h1>
              <p className="text-sm text-stone-500 mt-1">
                Customize respectful message copy sent through WhatsApp click-to-chat.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {saveSuccess ? <Check size={16} /> : <Save size={16} />}
              <span>{updateMutation.isPending ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Templates'}</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-stone-400 text-xs">Loading templates...</div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-cream-200 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('invitation')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'invitation'
                      ? 'bg-maroon-700 text-white shadow-sm'
                      : 'bg-white border border-cream-300 text-stone-700 hover:bg-cream-50'
                  }`}
                >
                  Invitation Template
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('gentle')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'gentle'
                      ? 'bg-saffron-600 text-white shadow-sm'
                      : 'bg-white border border-cream-300 text-stone-700 hover:bg-cream-50'
                  }`}
                >
                  Gentle Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('final')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activeTab === 'final'
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-white border border-cream-300 text-stone-700 hover:bg-cream-50'
                  }`}
                >
                  Final Reminder
                </button>
              </div>

              {/* Editor & Live Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor Box */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span className="font-semibold text-stone-700 uppercase tracking-wider">
                      Template Text
                    </span>
                    <span>{activeTemplateText.length} characters</span>
                  </div>

                  <textarea
                    rows={10}
                    value={activeTemplateText}
                    onChange={(e) => setActiveTemplateText(e.target.value)}
                    className="w-full p-3.5 border border-cream-300 rounded-xl text-stone-900 font-sans text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-maroon-700 leading-relaxed"
                  />

                  {/* Placeholders helper */}
                  <div className="pt-2 border-t border-cream-100 text-xs">
                    <p className="font-semibold text-stone-700 mb-2">Available Placeholders:</p>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                      {[
                        '{guest_name}',
                        '{couple_names}',
                        '{event_name}',
                        '{date}',
                        '{venue}',
                        '{deadline}',
                        '{rsvp_link}',
                      ].map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() => setActiveTemplateText(`${activeTemplateText} ${placeholder}`)}
                          className="px-2 py-1 rounded bg-cream-100 hover:bg-cream-200 text-stone-800 transition-colors"
                        >
                          {placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-saffron-600" />
                        <span>Live Preview (Sample Guest)</span>
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                          preview.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {preview.isValid ? 'Valid Template' : 'Missing Variables'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200 text-stone-900 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                      {preview.text}
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Each placeholder is substituted dynamically per guest when generating WhatsApp links.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
