import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../../lib/api';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  RotateCw,
  Ban,
  Copy,
  Check,
  Flag,
  UserCheck,
  History,
  MessageSquare,
  Utensils,
  Eye,
  Send,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Dietary,
  DIETARY_LABELS,
  RsvpStatus,
  ArrivalWindow,
  ARRIVAL_WINDOW_LABELS,
} from '@rsvp/shared';

interface GuestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string | null;
  weddingId: string;
}

export const GuestDrawer: React.FC<GuestDrawerProps> = ({
  isOpen,
  onClose,
  householdId,
  weddingId,
}) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isRecordingRsvp, setIsRecordingRsvp] = useState(false);
  const [recordStatus, setRecordStatus] = useState<RsvpStatus>(RsvpStatus.ATTENDING);
  const [recordEventId, setRecordEventId] = useState<string>('');
  const [attendeeForms, setAttendeeForms] = useState<Array<{ name: string; dietary: Dietary }>>([]);
  const [arrivalWindow, setArrivalWindow] = useState<ArrivalWindow>(ArrivalWindow.ON_TIME);
  const [recordError, setRecordError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ household: any }>({
    queryKey: ['household', weddingId, householdId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}/households/${householdId}`),
    enabled: isOpen && !!householdId,
  });

  const household = data?.household;

  const toggleFlagMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}/follow-up`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', weddingId, householdId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
    },
  });

  const toggleOptOutMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}/opt-out`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', weddingId, householdId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
    },
  });

  const rotateMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}/invitation/rotate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', weddingId, householdId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}/invitation/revoke`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', weddingId, householdId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
    },
  });

  const recordRsvpMutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch(`/api/weddings/${weddingId}/households/${householdId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', weddingId, householdId] });
      queryClient.invalidateQueries({ queryKey: ['households', weddingId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', weddingId] });
      setIsRecordingRsvp(false);
      setRecordError(null);
    },
    onError: (err: ApiError) => {
      setRecordError(err.message);
    },
  });

  if (!isOpen) return null;

  const invitationUrl = household?.invitation
    ? `${window.location.origin}/r/${household.invitation.token}`
    : '';

  const copyLink = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startRecordRsvp = (defaultEventId: string) => {
    setRecordEventId(defaultEventId);
    setRecordStatus(RsvpStatus.ATTENDING);
    setArrivalWindow(ArrivalWindow.ON_TIME);
    const count = household?.invitedCount || 1;
    setAttendeeForms(
      Array.from({ length: count }, (_, i) => ({
        name: i === 0 ? household.displayName.split(' ')[0] : `Guest ${i + 1}`,
        dietary: Dietary.VEGETARIAN,
      }))
    );
    setIsRecordingRsvp(true);
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError(null);

    recordRsvpMutation.mutate({
      events: [
        {
          eventId: recordEventId,
          status: recordStatus,
          arrivalWindow: recordStatus === RsvpStatus.ATTENDING ? arrivalWindow : null,
          attendees: recordStatus === RsvpStatus.ATTENDING ? attendeeForms : [],
        },
      ],
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-cream-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-cream-200 bg-cream-50/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-saffron-600">
                Household Details
              </span>
              <h2 className="text-lg font-serif font-bold text-stone-900 truncate mt-0.5">
                {isLoading ? 'Loading...' : household?.displayName}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-cream-100 rounded-lg"
              aria-label="Close drawer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-cream-100 rounded-xl animate-pulse" />
                <div className="h-40 bg-cream-100 rounded-xl animate-pulse" />
              </div>
            ) : !household ? (
              <p className="text-stone-500 text-sm">Household not found.</p>
            ) : (
              <>
                {/* Contact & Category Summary */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Phone size={14} className="text-stone-400" />
                    <span className="font-mono font-medium">{household.phoneE164}</span>
                  </div>
                  {household.email && (
                    <div className="flex items-center gap-2 text-stone-700">
                      <Mail size={14} className="text-stone-400" />
                      <span>{household.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-cream-100 text-stone-700 font-medium">
                      {household.category}
                    </span>
                    {household.side && (
                      <span className="px-2.5 py-0.5 rounded-full bg-maroon-50 text-maroon-800 font-medium">
                        {household.side} Side
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-cream-100 text-stone-700 font-medium">
                      {household.invitedCount} Invited Seats
                    </span>
                  </div>
                  {household.notes && (
                    <p className="p-2.5 bg-cream-50 rounded-lg text-stone-600 text-xs italic">
                      "{household.notes}"
                    </p>
                  )}
                </div>

                {/* Invitation Link Section */}
                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      <Eye size={14} className="text-maroon-700" />
                      <span>Invitation Link</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        household.invitation?.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {household.invitation?.status || 'NO LINK'}
                    </span>
                  </div>

                  {household.invitation && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={invitationUrl}
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-cream-300 rounded-lg font-mono text-stone-600 truncate focus:outline-none"
                        />
                        <button
                          onClick={copyLink}
                          className="px-3 py-1.5 bg-maroon-700 hover:bg-maroon-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                        <span>Views: {household.invitation.viewCount}</span>
                        {household.invitation.lastViewedAt && (
                          <span>
                            Last opened:{' '}
                            {new Date(household.invitation.lastViewedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-cream-200">
                        <button
                          type="button"
                          onClick={() => rotateMutation.mutate()}
                          disabled={rotateMutation.isPending}
                          className="flex-1 py-1.5 text-xs font-semibold text-stone-700 hover:bg-cream-100 rounded-lg border border-cream-300 flex items-center justify-center gap-1"
                        >
                          <RotateCw size={12} />
                          <span>Rotate Link</span>
                        </button>
                        {household.invitation.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => revokeMutation.mutate()}
                            disabled={revokeMutation.isPending}
                            className="flex-1 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center justify-center gap-1"
                          >
                            <Ban size={12} />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>

                      {household.invitation.status === 'ACTIVE' && (
                        <a
                          href={`https://wa.me/${household.phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Namaste ${household.displayName} ji, warmly inviting you to our wedding celebrations. Please confirm your RSVP here: ${invitationUrl}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Send size={13} />
                          <span>Send WhatsApp Invitation</span>
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* Organizer Actions: Follow Up & Opt Out */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleFlagMutation.mutate()}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      household.followUpFlag
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                        : 'bg-white border-cream-300 text-stone-700 hover:bg-cream-50'
                    }`}
                  >
                    <Flag size={13} className={household.followUpFlag ? 'fill-amber-600' : ''} />
                    <span>{household.followUpFlag ? 'Flagged for Follow-up' : 'Flag Follow-up'}</span>
                  </button>

                  <button
                    onClick={() => toggleOptOutMutation.mutate()}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      household.doNotContact
                        ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                        : 'bg-white border-cream-300 text-stone-700 hover:bg-cream-50'
                    }`}
                  >
                    <Ban size={13} />
                    <span>{household.doNotContact ? 'Opted Out' : 'Do Not Contact'}</span>
                  </button>
                </div>

                {/* Per-Event RSVPs */}
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-stone-900 text-sm">
                    Event RSVPs & Attendance
                  </h3>

                  {household.events.map((he: any) => {
                    const resp = he.rsvpResponse;
                    return (
                      <div
                        key={he.eventId}
                        className="p-3.5 rounded-xl border border-cream-200 bg-white shadow-sm space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-stone-900 text-sm">{he.event.name}</p>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full ${
                              resp?.status === 'ATTENDING'
                                ? 'bg-emerald-100 text-emerald-800'
                                : resp?.status === 'NOT_ATTENDING'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {resp
                              ? resp.status === 'ATTENDING'
                                ? `Attending (${resp.attendees.length}/${he.invitedCount})`
                                : 'Declined'
                              : 'Awaiting Response'}
                          </span>
                        </div>

                        {resp && (
                          <div className="pt-2 border-t border-cream-100 space-y-1.5 text-stone-600">
                            {resp.status === 'ATTENDING' && (
                              <>
                                <p className="font-medium text-stone-800">
                                  Arrival: {ARRIVAL_WINDOW_LABELS[resp.arrivalWindow as ArrivalWindow] || 'Not specified'}
                                </p>
                                <div className="space-y-1 pt-1">
                                  {resp.attendees.map((att: any, idx: number) => (
                                    <div
                                      key={att.id}
                                      className="flex items-center justify-between bg-cream-50 p-1.5 rounded-lg text-[11px]"
                                    >
                                      <span className="font-medium text-stone-800">
                                        {att.name || `Guest ${idx + 1}`}
                                      </span>
                                      <span className="text-stone-500">
                                        {DIETARY_LABELS[att.dietary as Dietary] || att.dietary}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {resp.message && (
                              <p className="italic text-[11px] text-stone-500 pt-1">
                                Message: "{resp.message}"
                              </p>
                            )}
                            <p className="text-[10px] text-stone-400">
                              Source: {resp.source === 'ORGANIZER_ENTRY' ? 'Recorded by Organizer' : 'Guest Web Link'} | Version: {resp.version}
                            </p>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => startRecordRsvp(he.eventId)}
                          className="w-full mt-2 py-1.5 rounded-lg border border-maroon-300 text-maroon-800 font-semibold hover:bg-maroon-50 transition-colors text-xs flex items-center justify-center gap-1"
                        >
                          <UserCheck size={13} />
                          <span>Record Response (Organizer Entry)</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Organizer Record Response Drawer Form */}
                {isRecordingRsvp && (
                  <div className="p-4 rounded-xl border border-maroon-300 bg-maroon-50/50 space-y-3 animate-fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-maroon-900 text-sm">
                        Record Response on Behalf of Guest
                      </h4>
                      <button
                        onClick={() => setIsRecordingRsvp(false)}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {recordError && (
                      <p className="text-rose-700 font-medium">{recordError}</p>
                    )}

                    <form onSubmit={handleRecordSubmit} className="space-y-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Status</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRecordStatus(RsvpStatus.ATTENDING)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                              recordStatus === RsvpStatus.ATTENDING
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white border-cream-300 text-stone-700'
                            }`}
                          >
                            Attending
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordStatus(RsvpStatus.NOT_ATTENDING)}
                            className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                              recordStatus === RsvpStatus.NOT_ATTENDING
                                ? 'bg-rose-700 text-white border-rose-700'
                                : 'bg-white border-cream-300 text-stone-700'
                            }`}
                          >
                            Not Attending
                          </button>
                        </div>
                      </div>

                      {recordStatus === RsvpStatus.ATTENDING && (
                        <>
                          <div>
                            <label className="block text-stone-700 font-medium mb-1">
                              Confirmed Attendees ({attendeeForms.length})
                            </label>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-stone-500">Seats:</span>
                              {[1, 2, 3, 4].filter((n) => n <= (household.invitedCount || 4)).map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    setAttendeeForms(
                                      Array.from({ length: n }, (_, i) => ({
                                        name: attendeeForms[i]?.name || `Guest ${i + 1}`,
                                        dietary: attendeeForms[i]?.dietary || Dietary.VEGETARIAN,
                                      }))
                                    );
                                  }}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold border ${
                                    attendeeForms.length === n
                                      ? 'bg-maroon-700 text-white border-maroon-700'
                                      : 'bg-white border-cream-300 text-stone-700'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>

                            <div className="space-y-2">
                              {attendeeForms.map((att, idx) => (
                                <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-cream-200">
                                  <input
                                    type="text"
                                    value={att.name}
                                    onChange={(e) => {
                                      const next = [...attendeeForms];
                                      next[idx].name = e.target.value;
                                      setAttendeeForms(next);
                                    }}
                                    placeholder={`Guest ${idx + 1}`}
                                    className="flex-1 px-2 py-1 border border-cream-300 rounded text-xs"
                                  />
                                  <select
                                    value={att.dietary}
                                    onChange={(e) => {
                                      const next = [...attendeeForms];
                                      next[idx].dietary = e.target.value as Dietary;
                                      setAttendeeForms(next);
                                    }}
                                    className="px-2 py-1 border border-cream-300 rounded text-xs"
                                  >
                                    {Object.values(Dietary).map((d) => (
                                      <option key={d} value={d}>
                                        {DIETARY_LABELS[d]}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-stone-700 font-medium mb-1">Arrival Window</label>
                            <select
                              value={arrivalWindow}
                              onChange={(e) => setArrivalWindow(e.target.value as ArrivalWindow)}
                              className="w-full px-2.5 py-1.5 border border-cream-300 rounded-lg text-xs"
                            >
                              {Object.values(ArrivalWindow).map((w) => (
                                <option key={w} value={w}>
                                  {ARRIVAL_WINDOW_LABELS[w]}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRecordingRsvp(false)}
                          className="px-3 py-1.5 text-xs text-stone-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={recordRsvpMutation.isPending}
                          className="px-4 py-1.5 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold"
                        >
                          {recordRsvpMutation.isPending ? 'Saving...' : 'Save Response'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Revision History */}
                <div className="space-y-2 pt-2">
                  <h3 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <History size={15} className="text-stone-400" />
                    <span>RSVP Revision History</span>
                  </h3>
                  {household.rsvpRevisions?.length === 0 ? (
                    <p className="text-xs text-stone-400">No revisions logged yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {household.rsvpRevisions.map((rev: any) => (
                        <div
                          key={rev.id}
                          className="p-2 bg-cream-50 rounded-lg border border-cream-100 text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-stone-800">
                              {rev.status === 'ATTENDING'
                                ? `Confirmed ${rev.confirmedCount} guests`
                                : 'Declined'}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              Source: {rev.source}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: 'numeric',
                              minute: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
