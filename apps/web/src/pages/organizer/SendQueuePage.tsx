import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { MessageKind, MessageStatus } from '@rsvp/shared';
import {
  Send,
  ExternalLink,
  CheckCircle2,
  SkipForward,
  AlertTriangle,
  History,
  ShieldCheck,
  Check,
  Ban,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SendQueuePage: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [kind, setKind] = useState<MessageKind>(
    (searchParams.get('kind') as MessageKind) || MessageKind.INVITATION
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentHouseholdIds, setSentHouseholdIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const { data: weddingData } = useQuery<{ wedding: any }>({
    queryKey: ['wedding', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}`),
  });

  const { data: queueData, isLoading: isQueueLoading } = useQuery<{
    kind: MessageKind;
    totalEligible: number;
    items: any[];
    excluded: any[];
  }>({
    queryKey: ['message-queue', weddingId, kind],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/messages/queue?kind=${kind}`),
  });

  const { data: historyData, isLoading: isHistoryLoading } = useQuery<{
    logs: any[];
  }>({
    queryKey: ['message-history', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/messages/history`),
    enabled: activeTab === 'history',
  });

  const markSentMutation = useMutation({
    mutationFn: async (item: any) => {
      // 1. Prepare message to create MessageLog
      const prepRes = await apiFetch<{ messageLogId: string }>(
        `/api/weddings/${weddingId}/messages/prepare`,
        {
          method: 'POST',
          body: JSON.stringify({
            householdId: item.householdId,
            kind,
            templateKey: kind,
            body: item.renderedText,
          }),
        }
      );

      // 2. Mark sent (organizer asserted)
      return apiFetch(`/api/weddings/${weddingId}/messages/mark-sent`, {
        method: 'POST',
        body: JSON.stringify({
          messageLogId: prepRes.messageLogId,
        }),
      });
    },
    onSuccess: (_, item) => {
      setSentHouseholdIds((prev) => new Set(prev).add(item.householdId));
      queryClient.invalidateQueries({ queryKey: ['message-queue', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
      // Move to next
      if (currentIndex < (queueData?.items.length || 1) - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    },
  });

  const currentItem = queueData?.items?.[currentIndex];
  const totalItems = queueData?.items?.length || 0;
  const isCurrentSent = currentItem && sentHouseholdIds.has(currentItem.householdId);

  const handleOpenWhatsApp = () => {
    if (currentItem?.whatsAppUrl) {
      window.open(currentItem.whatsAppUrl, '_blank', 'noopener,noreferrer');
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Zero Credentials Needed
                </span>
                <span className="text-xs font-semibold text-stone-500 bg-cream-100 px-2 py-0.5 rounded-full">
                  WhatsApp Click-to-Chat (wa.me)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                WhatsApp Message Dispatcher
              </h1>
            </div>

            {/* Toggle Queue vs History */}
            <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'queue'
                    ? 'bg-white text-stone-900 shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Send Queue
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-stone-900 shadow-sm font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Reminder History
              </button>
            </div>
          </div>

          {activeTab === 'history' ? (
            /* History Tab */
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
              <h3 className="font-serif font-bold text-stone-900 text-lg mb-4 flex items-center gap-2">
                <History size={18} className="text-stone-500" />
                <span>Message & Reminder Log (Honest Statuses)</span>
              </h3>

              {isHistoryLoading ? (
                <div className="p-8 text-center text-stone-400 text-xs">Loading logs...</div>
              ) : historyData?.logs.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  No messages marked sent yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-cream-200 text-xs">
                    <thead className="bg-cream-50 font-semibold text-stone-600 text-left">
                      <tr>
                        <th className="py-3 px-4">Guest</th>
                        <th className="py-3 px-4">Kind</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-100">
                      {historyData?.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-cream-50/50">
                          <td className="py-2.5 px-4 font-semibold text-stone-900">
                            {log.household?.displayName}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-stone-700">
                            {log.kind}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                log.status === 'MARKED_SENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {log.status === 'MARKED_SENT' ? 'Marked as sent by you' : log.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-stone-500">
                            {log.channel === 'WHATSAPP_CLICK_TO_CHAT'
                              ? 'WhatsApp Click-to-Chat'
                              : log.channel}
                          </td>
                          <td className="py-2.5 px-4 text-stone-500">
                            {new Date(log.markedSentAt || log.preparedAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Queue Tab */
            <div className="space-y-6">
              {/* Kind Toggle: Invitations vs Reminders */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setKind(MessageKind.INVITATION);
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    kind === MessageKind.INVITATION
                      ? 'bg-maroon-700 text-white border-maroon-700 shadow-sm'
                      : 'bg-white border-cream-300 text-stone-700 hover:bg-cream-50'
                  }`}
                >
                  Invitations Queue
                </button>
                <button
                  onClick={() => {
                    setKind(MessageKind.REMINDER);
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    kind === MessageKind.REMINDER
                      ? 'bg-saffron-600 text-white border-saffron-600 shadow-sm'
                      : 'bg-white border-cream-300 text-stone-700 hover:bg-cream-50'
                  }`}
                >
                  Pending Reminders Queue
                </button>
              </div>

              {/* Guard Rail Acknowledgment Checkbox (Section 7.6) */}
              {!hasAcknowledged && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-amber-950">
                    <ShieldCheck size={18} className="text-amber-700" />
                    <span>Organizer Consent & Respectful Communication</span>
                  </div>
                  <p>
                    WhatsApp click-to-chat opens your local WhatsApp to message your guests directly.
                    Please confirm that all invited guests expect to hear from you or the couple regarding this wedding.
                  </p>
                  <label className="flex items-center gap-2 pt-1 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAcknowledged}
                      onChange={(e) => setHasAcknowledged(e.target.checked)}
                      className="rounded text-maroon-700 focus:ring-maroon-700"
                    />
                    <span>I confirm these guests expect to hear from me about this wedding.</span>
                  </label>
                </div>
              )}

              {isQueueLoading ? (
                <div className="bg-white p-8 rounded-2xl border border-cream-200 text-center text-stone-400 text-xs">
                  Loading message queue...
                </div>
              ) : totalItems === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-cream-200 text-center max-w-md mx-auto">
                  <CheckCircle2 size={36} className="text-emerald-700 mx-auto mb-3" />
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    All caught up!
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    No pending {kind.toLowerCase()} messages in the queue right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Queue Progress Bar */}
                  <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-sm flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        Household {currentIndex + 1} of {totalItems}
                      </span>
                      <span className="text-stone-400">|</span>
                      <span className="text-emerald-800 font-semibold">
                        {sentHouseholdIds.size} marked sent in this session
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                        className="px-3 py-1 rounded-lg border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40 text-xs font-medium"
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentIndex >= totalItems - 1}
                        onClick={() => setCurrentIndex((prev) => Math.min(totalItems - 1, prev + 1))}
                        className="px-3 py-1 rounded-lg border border-cream-300 bg-white hover:bg-cream-100 disabled:opacity-40 text-xs font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Active Queue Card */}
                  {currentItem && (
                    <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-semibold text-saffron-600 uppercase tracking-wider">
                            Recipient
                          </span>
                          <h2 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                            {currentItem.displayName}
                          </h2>
                          <p className="text-xs font-mono text-stone-500 mt-0.5">
                            {currentItem.phoneE164} ({currentItem.invitedCount} invited seats)
                          </p>
                        </div>

                        {currentItem.warnRecentContact && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 max-w-xs">
                            <AlertTriangle size={16} className="shrink-0 text-amber-700" />
                            <span>{currentItem.recentContactNotice}</span>
                          </div>
                        )}
                      </div>

                      {/* Message Preview Box */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
                          <span className="font-medium text-stone-700">Message Preview:</span>
                          <span>{currentItem.renderedText.length} characters</span>
                        </div>
                        <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200 text-stone-900 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                          {currentItem.renderedText}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleOpenWhatsApp}
                          className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <ExternalLink size={18} />
                          <span>Open WhatsApp Web / App</span>
                        </button>

                        <button
                          type="button"
                          disabled={markSentMutation.isPending || isCurrentSent}
                          onClick={() => markSentMutation.mutate(currentItem)}
                          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                            isCurrentSent
                              ? 'bg-cream-100 text-stone-400 border border-cream-200'
                              : 'bg-maroon-700 hover:bg-maroon-800 text-white'
                          }`}
                        >
                          <Check size={18} />
                          <span>{isCurrentSent ? 'Already Marked Sent' : 'Mark as Sent by You'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (currentIndex < totalItems - 1) {
                              setCurrentIndex((prev) => prev + 1);
                            }
                          }}
                          className="py-3 px-4 rounded-xl border border-cream-300 text-stone-700 hover:bg-cream-100 text-sm font-semibold flex items-center justify-center gap-1.5"
                        >
                          <SkipForward size={16} />
                          <span>Skip</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-stone-400 text-center pt-1">
                        Note: "Mark as Sent by You" accurately records that you confirmed sending this message via your WhatsApp account.
                      </p>
                    </div>
                  )}

                  {/* Excluded Households Notice */}
                  {queueData && queueData.excluded && queueData.excluded.length > 0 && (
                    <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 text-xs space-y-2">
                      <p className="font-semibold text-stone-700 flex items-center gap-1.5">
                        <Ban size={14} className="text-stone-400" />
                        <span>Excluded from Queue ({queueData.excluded.length}):</span>
                      </p>
                      <ul className="space-y-1 text-stone-500 pl-5 list-disc">
                        {queueData.excluded.map((exc: any) => (
                          <li key={exc.householdId}>
                            <strong>{exc.displayName}</strong>: {exc.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
