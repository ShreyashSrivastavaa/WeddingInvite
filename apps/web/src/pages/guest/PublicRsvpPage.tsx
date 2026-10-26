import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  ChevronRight,
  ExternalLink,
  BellOff,
  Sparkles,
  Edit3,
} from 'lucide-react';
import {
  ArrivalWindow,
  Dietary,
  PublicInvitationDetails,
  RsvpStatus,
  formatDateInTimezone,
  getArrivalWindowLabels,
  THEME_PRESETS,
  ThemeKey,
} from '@rsvp/shared';
import { fetchPublicInvitation, submitPublicRsvp, optOutGuestReminders } from '../../lib/api';

// Translations dictionary for bilingual English / Hindi experience
const translations = {
  en: {
    welcome: 'Warmly invite you to celebrate with them',
    invitedTo: 'You are invited to the following celebrations',
    rsvpDeadline: 'Kindly RSVP by',
    deadlinePassedBanner:
      'The RSVP deadline has passed. Your change will be shared with the family, but please also call them to be sure.',
    eventConcluded: 'This event has concluded. Thank you for being a part of our celebration!',
    rsvpClosed: 'RSVPs are now closed for this wedding. Please contact the family directly.',
    attending: 'Attending',
    notAttending: 'Cannot Attend',
    attendingCount: 'How many people will be attending?',
    guest: 'Guest',
    guestNamePlaceholder: 'Full Name (optional)',
    dietaryPreference: 'Dietary Preference',
    dietaryNotePlaceholder: 'Notes (e.g. Jain / No onion / Allergies)',
    arrivalWindow: 'Expected Arrival Time',
    selectArrival: 'Select arrival window',
    messageToCouple: 'Personal message or wishes (optional)',
    messagePlaceholder: 'Warm congratulations to the lovely couple!',
    extraSeats: 'Need additional seats? (optional request)',
    extraSeatsHelp: 'Requests are reviewed by the hosts and subject to venue capacity.',
    submitRsvp: 'Confirm & Submit RSVP',
    submitting: 'Saving your RSVP...',
    rsvpConfirmedTitle: 'Thank You for Confirming!',
    rsvpConfirmedDesc: 'Your RSVP has been saved. We look forward to celebrating together.',
    rsvpDeclinedTitle: 'We Will Miss You!',
    rsvpDeclinedDesc: 'Thank you for letting us know. You will be warmly remembered in our celebrations.',
    changeRsvp: 'Change My Response',
    summaryHeading: 'Your Response Summary',
    noRemindersLink: "Please don't send me reminders",
    noRemindersConfirm:
      'Are you sure? You will no longer receive WhatsApp reminders for this celebration.',
    noRemindersSuccess: 'You have been unsubscribed from reminder messages.',
    viewMap: 'View on Google Maps',
    languageToggle: 'हिन्दी में देखें',
    copiedFromFirst: 'Prefilled from earlier events',
  },
  hi: {
    welcome: 'आपको सपरिवार सादर आमंत्रित करते हैं',
    invitedTo: 'आप निम्नलिखित शुभ अवसरों पर सादर आमंत्रित हैं',
    rsvpDeadline: 'कृपया अपनी उपस्थिति की पुष्टि इस तिथि तक करें:',
    deadlinePassedBanner:
      'उत्तर देने की अंतिम तिथि बीत चुकी है। आपका उत्तर परिवार के साथ साझा किया जाएगा, कृपया उनसे फोन पर भी पुष्टि कर लें।',
    eventConcluded: 'यह समारोह संपन्न हो चुका है। हमारे साथ खुशियाँ बाँटने के लिए धन्यवाद!',
    rsvpClosed: 'इस विवाह के लिए अब पुष्टि बंद हो चुकी है। कृपया सीधे परिवार से संपर्क करें।',
    attending: 'उपस्थित होंगे',
    notAttending: 'उपस्थित नहीं हो सकेंगे',
    attendingCount: 'कुल कितने सदस्य उपस्थित होंगे?',
    guest: 'अतिथि',
    guestNamePlaceholder: 'पूरा नाम (वैकल्पिक)',
    dietaryPreference: 'भोजन प्राथमिकता',
    dietaryNotePlaceholder: 'विशेष विवरण (उदा. जैन / बिना प्याज-लहसुन)',
    arrivalWindow: 'आगमन का अनुमानित समय',
    selectArrival: 'समय चुनें',
    messageToCouple: 'वर-वधू को शुभ संदेश (वैकल्पिक)',
    messagePlaceholder: 'वर-वधू को हमारी हार्दिक शुभकामनाएं!',
    extraSeats: 'क्या अतिरिक्त स्थान की आवश्यकता है? (वैकल्पिक)',
    extraSeatsHelp: 'यह केवल एक अनुरोध है, व्यवस्था आयोजकों द्वारा की जाएगी।',
    submitRsvp: 'RSVP पुष्टि करें',
    submitting: 'सहेजा जा रहा है...',
    rsvpConfirmedTitle: 'आपकी पुष्टि के लिए धन्यवाद!',
    rsvpConfirmedDesc: 'आपकी उपस्थिति दर्ज कर ली गई है। हम आपके आगमन की प्रतीक्षा कर रहे हैं।',
    rsvpDeclinedTitle: 'आपकी कमी खलेगी!',
    rsvpDeclinedDesc: 'हमे सूचित करने के लिए धन्यवाद। हमारी खुशियों में आपका आशीर्वाद सदा साथ रहेगा।',
    changeRsvp: 'अपना उत्तर बदलें',
    summaryHeading: 'आपके उत्तर का विवरण',
    noRemindersLink: 'कृपया मुझे अब कोई अनुस्मारक संदेश न भेजें',
    noRemindersConfirm:
      'क्या आप सुनिश्चित हैं? आपको अब इस विवाह के लिए कोई WhatsApp संदेश नहीं भेजा जाएगा।',
    noRemindersSuccess: 'आपको संदेश सूची से हटा दिया गया है।',
    viewMap: 'गूगल मैप्स पर देखें',
    languageToggle: 'View in English',
    copiedFromFirst: 'पहले समारोह से विवरण लिया गया',
  },
};

interface FormAttendee {
  name: string;
  dietary: Dietary;
  dietaryNote?: string;
}

interface FormEventState {
  eventId: string;
  status: RsvpStatus;
  attendingCount: number;
  attendees: FormAttendee[];
  arrivalWindow?: ArrivalWindow;
  message?: string;
  extraSeatsRequested?: number;
}

export const PublicRsvpPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isEditing, setIsEditing] = useState(false);
  const [formEvents, setFormEvents] = useState<Record<string, FormEventState>>({});
  const [optOutSuccess, setOptOutSuccess] = useState(false);
  const [staleError, setStaleError] = useState<string | null>(null);

  const t = translations[lang];

  // Fetch invitation
  const {
    data: invite,
    isLoading,
    isError,
    refetch,
  } = useQuery<PublicInvitationDetails>({
    queryKey: ['public-invitation', token],
    queryFn: () => fetchPublicInvitation(token!),
    enabled: !!token,
    retry: 1,
  });

  // Initialize form state when invite loads
  useEffect(() => {
    if (!invite) return;

    const initial: Record<string, FormEventState> = {};
    const defaultDietary =
      invite.wedding.dietaryOptions.length > 0
        ? invite.wedding.dietaryOptions[0]
        : Dietary.VEGETARIAN;

    invite.events.forEach((ev, idx) => {
      const resp = ev.currentResponse;
      if (resp) {
        initial[ev.id] = {
          eventId: ev.id,
          status: resp.status,
          attendingCount: resp.attendees.length || 1,
          attendees: resp.attendees.map((a) => ({
            name: a.name || '',
            dietary: a.dietary,
            dietaryNote: a.dietaryNote || '',
          })),
          arrivalWindow: resp.arrivalWindow || undefined,
          message: resp.message || '',
          extraSeatsRequested: resp.extraSeatsRequested || 0,
        };
      } else {
        // No response yet: default to Attending with 1 person
        initial[ev.id] = {
          eventId: ev.id,
          status: RsvpStatus.ATTENDING,
          attendingCount: Math.min(ev.invitedCount, 1),
          attendees: [
            {
              name: '',
              dietary: defaultDietary,
              dietaryNote: '',
            },
          ],
          arrivalWindow: undefined,
          message: '',
          extraSeatsRequested: 0,
        };
      }
    });

    setFormEvents(initial);

    // If all events already have a response, default to confirmation view unless editing
    const hasAnyResponse = invite.events.some((e) => e.currentResponse !== null);
    if (hasAnyResponse && !isEditing) {
      // Show confirmation screen
    } else {
      setIsEditing(true);
    }
  }, [invite]);

  // Submit RSVP mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!invite || !token) return;

      const submissionEvents = invite.events.map((ev) => {
        const state = formEvents[ev.id];
        if (!state || state.status === RsvpStatus.NOT_ATTENDING) {
          return {
            eventId: ev.id,
            status: RsvpStatus.NOT_ATTENDING,
            attendees: [],
            message: state?.message || undefined,
            extraSeatsRequested: 0,
          };
        }

        return {
          eventId: ev.id,
          status: RsvpStatus.ATTENDING,
          attendees: state.attendees.slice(0, state.attendingCount).map((a) => ({
            name: a.name.trim() || undefined,
            dietary: a.dietary,
            dietaryNote: a.dietaryNote?.trim() || undefined,
          })),
          arrivalWindow: state.arrivalWindow || undefined,
          message: state.message?.trim() || undefined,
          extraSeatsRequested: state.extraSeatsRequested ? Number(state.extraSeatsRequested) : 0,
        };
      });

      // Calculate max existing version for optimistic locking
      const currentVersions = invite.events
        .map((e) => e.currentResponse?.version)
        .filter((v): v is number => typeof v === 'number');
      const maxVersion = currentVersions.length > 0 ? Math.max(...currentVersions) : undefined;

      return submitPublicRsvp(token, {
        events: submissionEvents,
        expectedVersion: maxVersion,
      });
    },
    onSuccess: () => {
      setStaleError(null);
      setIsEditing(false);
      refetch();
    },
    onError: (err: any) => {
      if (err.message && err.message.includes('another device')) {
        setStaleError(
          'This RSVP was updated from another device. We have loaded the latest details. Please review and re-submit.'
        );
        refetch();
      } else {
        alert(err.message || 'Failed to submit RSVP. Please try again.');
      }
    },
  });

  // Opt-out mutation
  const optOutMutation = useMutation({
    mutationFn: () => optOutGuestReminders(token!),
    onSuccess: () => {
      setOptOutSuccess(true);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to unsubscribe. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-cream-800 font-serif text-lg">Opening your wedding invitation...</p>
        </div>
      </div>
    );
  }

  // Invalid, revoked or expired token: safe friendly page
  if (isError || !invite) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-cream-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto text-maroon-700">
            <Heart className="w-8 h-8 opacity-40" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-cream-950">
            Invitation Not Active
          </h2>
          <p className="text-cream-700">
            This invitation link isn't active or has expired. Please contact the family or hosts directly for event details.
          </p>
        </div>
      </div>
    );
  }

  const { wedding, household, events } = invite;
  const themeConfig = THEME_PRESETS[(wedding.theme as ThemeKey)] || THEME_PRESETS.ROYAL_IVORY_MAROON;
  const isDeadlinePassed = new Date(wedding.rsvpDeadline) < new Date();
  const allowChanges = wedding.allowChangesAfterDeadline;
  const hasResponded = events.some((e) => e.currentResponse !== null);

  // Check if last event concluded (> 24 hours after last event end/start)
  const lastEventDate = events.reduce((latest, ev) => {
    const end = ev.endsAt ? new Date(ev.endsAt) : new Date(ev.startsAt);
    return end > latest ? end : latest;
  }, new Date(0));
  const isConcluded = Date.now() > lastEventDate.getTime() + 24 * 60 * 60 * 1000;

  // Handlers for updating event form state
  const handleStatusChange = (eventId: string, status: RsvpStatus) => {
    setFormEvents((prev) => {
      const current = prev[eventId];
      if (!current) return prev;
      return {
        ...prev,
        [eventId]: {
          ...current,
          status,
        },
      };
    });
  };

  const handleAttendingCountChange = (eventId: string, delta: number, maxCount: number) => {
    setFormEvents((prev) => {
      const current = prev[eventId];
      if (!current) return prev;
      const nextCount = Math.max(1, Math.min(maxCount, current.attendingCount + delta));
      const nextAttendees = [...current.attendees];

      while (nextAttendees.length < nextCount) {
        // Prefill name from first event if available
        const firstEventAttendee = Object.values(prev)[0]?.attendees[nextAttendees.length];
        nextAttendees.push({
          name: firstEventAttendee?.name || '',
          dietary: wedding.dietaryOptions[0] || Dietary.VEGETARIAN,
          dietaryNote: '',
        });
      }

      return {
        ...prev,
        [eventId]: {
          ...current,
          attendingCount: nextCount,
          attendees: nextAttendees,
        },
      };
    });
  };

  const handleAttendeeChange = (
    eventId: string,
    idx: number,
    field: keyof FormAttendee,
    value: any
  ) => {
    setFormEvents((prev) => {
      const current = prev[eventId];
      if (!current) return prev;
      const nextAttendees = [...current.attendees];
      nextAttendees[idx] = {
        ...nextAttendees[idx],
        [field]: value,
      };
      return {
        ...prev,
        [eventId]: {
          ...current,
          attendees: nextAttendees,
        },
      };
    });
  };

  const handleOptOut = () => {
    if (window.confirm(t.noRemindersConfirm)) {
      optOutMutation.mutate();
    }
  };

  return (
    <div
      className="min-h-screen font-sans pb-16 transition-colors"
      style={{ backgroundColor: themeConfig.background }}
    >
      {/* Language Toggle floating bar */}
      <div className="max-w-xl mx-auto px-4 pt-3 flex justify-end">
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="text-xs bg-white/80 backdrop-blur-sm border border-cream-300 text-cream-800 px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-all font-medium"
        >
          {t.languageToggle}
        </button>
      </div>

      <main className="max-w-xl mx-auto px-4 mt-2 space-y-6">
        {/* Hero Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-cream-200 overflow-hidden text-center">
          {/* Cover Image if present */}
          {wedding.coverImageUrl && (
            <div className="w-full h-48 sm:h-56 overflow-hidden relative">
              <img
                src={wedding.coverImageUrl}
                alt={wedding.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          )}

          {/* Decorative Header Banner */}
          <div
            className="py-10 px-6 text-cream-50 relative transition-all"
            style={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.accent} 100%)`,
            }}
          >
            <div className="absolute top-2 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
              <Sparkles className="w-24 h-24" />
            </div>
            <p className="text-saffron-300 uppercase tracking-widest text-xs font-semibold mb-2">
              Wedding Celebration
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-cream-100 tracking-tight">
              {wedding.partnerOneName}
              {wedding.partnerTwoName && (
                <>
                  <span className="text-saffron-400 font-normal mx-2">&amp;</span>
                  {wedding.partnerTwoName}
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-cream-200 mt-3 max-w-sm mx-auto font-serif italic">
              {t.welcome}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div
              className="inline-block rounded-2xl px-5 py-3 border transition-colors"
              style={{
                backgroundColor: themeConfig.badgeBg,
                borderColor: `${themeConfig.primary}30`,
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: themeConfig.badgeText }}
              >
                Special Invitation For
              </p>
              <p
                className="text-lg font-serif font-bold mt-0.5"
                style={{ color: themeConfig.primary }}
              >
                {household.displayName}
              </p>
            </div>

            {wedding.invitationMessage && (
              <p className="text-cream-800 text-sm italic font-serif leading-relaxed max-w-md mx-auto">
                "{wedding.invitationMessage}"
              </p>
            )}

            {/* RSVP Deadline indicator */}
            {!isConcluded && (
              <div className="flex items-center justify-center gap-2 text-xs text-cream-700 bg-cream-50 py-2 px-4 rounded-xl border border-cream-200">
                <Clock className="w-4 h-4 text-maroon-700" />
                <span>
                  {t.rsvpDeadline}{' '}
                  <strong>
                    {formatDateInTimezone(wedding.rsvpDeadline, wedding.timezone, 'd MMMM yyyy')}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Concluded or Deadline Warnings */}
        {isConcluded ? (
          <div className="bg-cream-200/70 border border-cream-300 rounded-2xl p-5 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-cream-600 mx-auto" />
            <p className="text-cream-900 font-serif font-semibold">{t.eventConcluded}</p>
          </div>
        ) : isDeadlinePassed ? (
          <div className="bg-saffron-50 border border-saffron-300 rounded-2xl p-4 flex items-start gap-3 text-saffron-950 text-sm">
            <AlertCircle className="w-5 h-5 text-saffron-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t.deadlinePassedBanner}</p>
              {!allowChanges && <p className="mt-1 text-xs">{t.rsvpClosed}</p>}
            </div>
          </div>
        ) : null}

        {/* Stale concurrency warning */}
        {staleError && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 text-sm">
            <p className="font-semibold">{staleError}</p>
          </div>
        )}

        {/* View mode: Confirmation Summary */}
        {!isEditing && hasResponded && (
          <div className="bg-white rounded-3xl shadow-md border border-cream-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-cream-200 pb-4">
              <div>
                <h2 className="text-xl font-serif font-bold text-cream-950">
                  {t.summaryHeading}
                </h2>
                <p className="text-xs text-cream-600 mt-0.5">
                  Thank you for keeping us informed!
                </p>
              </div>
              {(!isDeadlinePassed || allowChanges) && !isConcluded && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-maroon-800 bg-cream-50 hover:bg-cream-100 border border-cream-300 px-3.5 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t.changeRsvp}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {events.map((ev) => {
                const resp = ev.currentResponse;
                const isAttending = resp?.status === RsvpStatus.ATTENDING;

                return (
                  <div
                    key={ev.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isAttending
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-cream-50 border-cream-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-cream-950 text-base">
                          {ev.name}
                        </h3>
                        <p className="text-xs text-cream-700 mt-0.5">
                          {formatDateInTimezone(ev.startsAt, wedding.timezone, 'EEEE, d MMMM yyyy, h:mm a')}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          isAttending
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-cream-200 text-cream-700'
                        }`}
                      >
                        {isAttending ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t.attending} ({resp?.attendees.length || 0})
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            {t.notAttending}
                          </>
                        )}
                      </span>
                    </div>

                    {isAttending && resp && resp.attendees.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-100/80 space-y-2 text-xs">
                        <p className="font-semibold text-emerald-950">Attending Guests:</p>
                        <div className="space-y-1">
                          {resp.attendees.map((att, i) => (
                            <div key={i} className="flex items-center justify-between text-cream-800">
                              <span>
                                {i + 1}. {att.name || `Guest ${i + 1}`}
                              </span>
                              <span className="text-cream-600 bg-white/80 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
                                {att.dietary}
                                {att.dietaryNote ? ` (${att.dietaryNote})` : ''}
                              </span>
                            </div>
                          ))}
                        </div>

                        {resp.arrivalWindow && (
                          <p className="text-xs text-emerald-900 mt-2">
                            Arrival time:{' '}
                            <span className="font-medium">
                              {getArrivalWindowLabels(ev.startsAt, wedding.timezone)[resp.arrivalWindow]}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit mode: Interactive RSVP Form */}
        {isEditing && (!isDeadlinePassed || allowChanges) && !isConcluded && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate();
            }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-serif font-bold text-cream-950">{t.invitedTo}</h2>
              <p className="text-xs text-cream-700 mt-1">
                Please confirm attendance for each celebration below
              </p>
            </div>

            {/* Events List */}
            {events.map((ev, eventIdx) => {
              const state = formEvents[ev.id];
              const isAttending = state?.status === RsvpStatus.ATTENDING;
              const arrivalLabels = getArrivalWindowLabels(ev.startsAt, wedding.timezone);

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-3xl shadow-md border border-cream-200 overflow-hidden"
                >
                  {/* Event Header Banner */}
                  <div className="bg-cream-50 border-b border-cream-200 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700 bg-saffron-100/60 px-2 py-0.5 rounded-full">
                          Celebration {eventIdx + 1}
                        </span>
                        <h3 className="text-lg font-serif font-bold text-cream-950 mt-1">
                          {ev.name}
                        </h3>
                      </div>
                      <span className="text-xs text-cream-600 font-medium">
                        Capacity cap: {ev.invitedCount} {ev.invitedCount === 1 ? 'person' : 'people'}
                      </span>
                    </div>

                    {/* Venue & Date Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs text-cream-800">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-maroon-700 flex-shrink-0" />
                        <span>
                          {formatDateInTimezone(ev.startsAt, wedding.timezone, 'EEE, d MMM yyyy, h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-maroon-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-cream-950">{ev.venueName}</p>
                          {ev.venueAddress && <p className="text-cream-600">{ev.venueAddress}</p>}
                          {ev.mapsUrl && (
                            <a
                              href={ev.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-maroon-700 hover:text-maroon-900 inline-flex items-center gap-1 font-semibold mt-0.5"
                            >
                              {t.viewMap} <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Attendance Controls */}
                  <div className="p-5 space-y-5">
                    {/* Attending / Not Attending Toggle Buttons (Min 44px tap target) */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(ev.id, RsvpStatus.ATTENDING)}
                        className={`min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                          isAttending
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-700/20'
                            : 'bg-white text-cream-800 border-cream-300 hover:bg-cream-50'
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 ${isAttending ? 'text-white' : 'text-emerald-600'}`} />
                        {t.attending}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(ev.id, RsvpStatus.NOT_ATTENDING)}
                        className={`min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-2 transition-all ${
                          !isAttending
                            ? 'bg-cream-700 text-white border-cream-700 shadow-md'
                            : 'bg-white text-cream-800 border-cream-300 hover:bg-cream-50'
                        }`}
                      >
                        <XCircle className={`w-4 h-4 ${!isAttending ? 'text-white' : 'text-cream-500'}`} />
                        {t.notAttending}
                      </button>
                    </div>

                    {isAttending && state && (
                      <div className="space-y-5 pt-2 animate-fadeIn">
                        {/* Attendee Count Stepper */}
                        <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-cream-950">
                                {t.attendingCount}
                              </p>
                              <p className="text-[11px] text-cream-600">
                                Max {ev.invitedCount} {ev.invitedCount === 1 ? 'seat' : 'seats'} reserved for your household
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={state.attendingCount <= 1}
                                onClick={() => handleAttendingCountChange(ev.id, -1, ev.invitedCount)}
                                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-cream-300 flex items-center justify-center font-bold text-lg text-cream-800 hover:bg-cream-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                              >
                                &minus;
                              </button>
                              <span className="font-serif font-bold text-xl text-maroon-900 w-6 text-center">
                                {state.attendingCount}
                              </span>
                              <button
                                type="button"
                                disabled={state.attendingCount >= ev.invitedCount}
                                onClick={() => handleAttendingCountChange(ev.id, 1, ev.invitedCount)}
                                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-xl bg-white border border-cream-300 flex items-center justify-center font-bold text-lg text-cream-800 hover:bg-cream-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Individual Attendee Details (Names & Dietary) */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-cream-700">
                            Guest Details &amp; Dietary Preferences
                          </p>

                          {Array.from({ length: state.attendingCount }).map((_, attIdx) => {
                            const att = state.attendees[attIdx] || {
                              name: '',
                              dietary: wedding.dietaryOptions[0] || Dietary.VEGETARIAN,
                              dietaryNote: '',
                            };

                            return (
                              <div
                                key={attIdx}
                                className="bg-cream-50/70 p-3.5 rounded-2xl border border-cream-200 space-y-2.5"
                              >
                                <div className="flex items-center justify-between text-xs font-semibold text-maroon-900">
                                  <span>
                                    {t.guest} {attIdx + 1}
                                  </span>
                                  {eventIdx > 0 && att.name && (
                                    <span className="text-[10px] text-cream-600 font-normal italic">
                                      {t.copiedFromFirst}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder={t.guestNamePlaceholder}
                                    value={att.name}
                                    onChange={(e) =>
                                      handleAttendeeChange(ev.id, attIdx, 'name', e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:ring-1 focus:ring-maroon-700"
                                  />

                                  <select
                                    value={att.dietary}
                                    onChange={(e) =>
                                      handleAttendeeChange(ev.id, attIdx, 'dietary', e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:ring-1 focus:ring-maroon-700"
                                  >
                                    {wedding.dietaryOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt.replace(/_/g, ' ')}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <input
                                  type="text"
                                  placeholder={t.dietaryNotePlaceholder}
                                  value={att.dietaryNote || ''}
                                  onChange={(e) =>
                                    handleAttendeeChange(ev.id, attIdx, 'dietaryNote', e.target.value)
                                  }
                                  className="w-full px-3 py-1.5 text-[11px] bg-white rounded-lg border border-cream-200 focus:outline-none focus:ring-1 focus:ring-maroon-700 text-cream-700"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Expected Arrival Window */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-cream-950">
                            {t.arrivalWindow}
                          </label>
                          <select
                            value={state.arrivalWindow || ''}
                            onChange={(e) =>
                              setFormEvents((prev) => ({
                                ...prev,
                                [ev.id]: {
                                  ...prev[ev.id],
                                  arrivalWindow: (e.target.value as ArrivalWindow) || undefined,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:ring-1 focus:ring-maroon-700"
                          >
                            <option value="">{t.selectArrival}</option>
                            {Object.entries(arrivalLabels).map(([windowKey, label]) => (
                              <option key={windowKey} value={windowKey}>
                                {String(label)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Optional Message */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-cream-950">
                            {t.messageToCouple}
                          </label>
                          <textarea
                            rows={2}
                            value={state.message || ''}
                            placeholder={t.messagePlaceholder}
                            onChange={(e) =>
                              setFormEvents((prev) => ({
                                ...prev,
                                [ev.id]: {
                                  ...prev[ev.id],
                                  message: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:ring-1 focus:ring-maroon-700"
                          />
                        </div>

                        {/* Need More Seats */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-cream-950">
                            {t.extraSeats}
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={state.extraSeatsRequested || 0}
                              onChange={(e) =>
                                setFormEvents((prev) => ({
                                  ...prev,
                                  [ev.id]: {
                                    ...prev[ev.id],
                                    extraSeatsRequested: Math.max(0, parseInt(e.target.value) || 0),
                                  },
                                }))
                              }
                              className="w-24 px-3 py-1.5 text-xs bg-white rounded-xl border border-cream-300 focus:outline-none focus:ring-1 focus:ring-maroon-700"
                            />
                            <span className="text-[11px] text-cream-600">{t.extraSeatsHelp}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Submit Button (Minimum 44px tap target, disabled during loading) */}
            <div className="sticky bottom-4 z-10 pt-2">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                style={{ backgroundColor: themeConfig.primary }}
                className="w-full min-h-[50px] hover:opacity-95 active:scale-[0.99] text-white font-serif font-bold text-base py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 border border-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-current text-saffron-400" />
                    <span>{t.submitRsvp}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Guest Opt-Out Link */}
        <div className="text-center pt-4">
          {optOutSuccess ? (
            <p className="text-xs text-emerald-800 bg-emerald-50 py-2 px-4 rounded-xl inline-block border border-emerald-200">
              {t.noRemindersSuccess}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleOptOut}
              disabled={optOutMutation.isPending}
              className="text-xs text-cream-600 hover:text-cream-900 underline inline-flex items-center gap-1.5 transition-colors"
            >
              <BellOff className="w-3.5 h-3.5" />
              {t.noRemindersLink}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicRsvpPage;
