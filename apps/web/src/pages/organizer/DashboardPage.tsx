import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { EventSelector } from '../../components/common/EventSelector';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Dietary,
  DIETARY_LABELS,
  ArrivalWindow,
  ARRIVAL_WINDOW_LABELS,
  OrganizerStatus,
} from '@rsvp/shared';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  TrendingUp,
  Utensils,
  Share2,
  UserPlus,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { weddingId } = useParams<{ weddingId: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || undefined;

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'table'>('visual');
  const [assumptionPercent, setAssumptionPercent] = useState<number>(75);

  const { data: weddingData } = useQuery<{ wedding: any }>({
    queryKey: ['wedding', weddingId],
    queryFn: () => apiFetch(`/api/weddings/${weddingId}`),
  });

  const { data, isLoading, error } = useQuery<{
    events: any[];
    selectedEvent: any;
    summary: any;
    statusCounts: Record<OrganizerStatus, number>;
    trend: Array<{ date: string; confirmed: number }>;
    recentActivity: any[];
    needsFollowUpList: any[];
  }>({
    queryKey: ['dashboard', weddingId, eventId],
    queryFn: () =>
      apiFetch(
        `/api/weddings/${weddingId}/dashboard${eventId ? `?eventId=${eventId}` : ''}`
      ),
  });

  const wedding = weddingData?.wedding;
  const summary = data?.summary;
  const selectedEvent = data?.selectedEvent;
  const events = data?.events || [];

  const assumedPendingAttendees = summary
    ? Math.round(summary.awaiting * (assumptionPercent / 100))
    : 0;
  const totalWithAssumption = summary ? summary.confirmed + assumedPendingAttendees : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf5eb] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#484036]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#faf5eb] flex flex-col">
        <Header />
        <div className="p-8 text-center text-red-800">
          Failed to load wedding dashboard. Please refresh.
        </div>
      </div>
    );
  }

  // Dietary chart data
  const dietaryData = summary
    ? [
        { name: 'Vegetarian', count: summary.dietaryTotals[Dietary.VEGETARIAN], color: '#484036' },
        { name: 'Non-Veg', count: summary.dietaryTotals[Dietary.NON_VEGETARIAN], color: '#666e72' },
        { name: 'Jain', count: summary.dietaryTotals[Dietary.JAIN], color: '#8c7a6b' },
        { name: 'Vegan', count: summary.dietaryTotals[Dietary.VEGAN], color: '#524b42' },
        { name: 'Other', count: summary.dietaryTotals[Dietary.NO_PREFERENCE] + summary.dietaryTotals[Dietary.EGGETARIAN], color: '#9e978e' },
      ].filter((d) => d.count > 0)
    : [];

  // Arrival distribution data
  const arrivalData = summary
    ? [
        { name: 'On Time', count: summary.arrivalDistribution[ArrivalWindow.ON_TIME] },
        { name: '< 1 hr', count: summary.arrivalDistribution[ArrivalWindow.WITHIN_1_HOUR_AFTER] },
        { name: '1-2 hrs', count: summary.arrivalDistribution[ArrivalWindow.ONE_TO_TWO_HOURS_AFTER] },
        { name: '> 2 hrs', count: summary.arrivalDistribution[ArrivalWindow.MORE_THAN_TWO_HOURS_AFTER] },
        { name: 'Not Sure', count: summary.arrivalDistribution[ArrivalWindow.NOT_SURE] },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#faf5eb] flex flex-col selection:bg-[#cacab0] selection:text-[#484036]">
      <Header
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar & Mobile Drawer */}
        <div className="hidden md:block">
          <Sidebar weddingTitle={wedding?.title} />
        </div>
        {isMobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-[#33302c]/50"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="relative z-50 w-64 bg-[#faf5eb] h-full">
              <Sidebar
                weddingTitle={wedding?.title}
                onCloseMobile={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Top Bar with Event Selector & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 pb-6 border-b border-[#666e72]/20">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] uppercase tracking-[0.05em] font-normal text-[#484036] bg-[#f2e9cf] px-2.5 py-0.5 rounded-[4px] border border-[#cacab0]">
                  Event-Scoped Metrics
                </span>
                {summary && !summary.isInvariantValid && (
                  <span className="text-[11px] font-normal text-red-800 bg-[#f2e9cf] px-2 py-0.5 rounded-[4px] border border-red-300 flex items-center gap-1">
                    <ShieldAlert size={12} /> Invariant Check Warning
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-normal text-[#33302c] tracking-[-0.04em]">
                {selectedEvent?.name || 'Wedding Dashboard'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <EventSelector events={events} selectedEventId={selectedEvent?.id} />

              <Link
                to={`/weddings/${weddingId}/messages?kind=REMINDER&eventId=${selectedEvent?.id || ''}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[4px] border border-[#484036] text-[#484036] hover:bg-[#484036] hover:text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em] transition-all shadow-none"
              >
                <Send size={14} />
                <span>Follow Up</span>
              </Link>
            </div>
          </div>

          {!selectedEvent ? (
            <div className="bg-[#ecece4] rounded-[4px] border border-[#666e72]/30 p-12 text-center max-w-lg mx-auto shadow-none">
              <p className="text-[#484036] mb-6 text-sm font-normal">No events found for this wedding yet.</p>
              <Link
                to={`/weddings/${weddingId}/events`}
                className="px-6 py-2.5 rounded-[4px] border border-[#484036] bg-[#484036] text-[#faf5eb] font-normal text-xs uppercase tracking-[0.05em]"
              >
                Create First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-7">
              {/* The Knot-Inspired Quick Planning Hub */}
              <div className="bg-white p-5 rounded-xl border border-[#cacab0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-maroon-700 text-saffron-300 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#33302c]">
                      {wedding?.title || 'Your Wedding Celebration'}
                    </h3>
                    <p className="text-xs text-[#666e72]">
                      All-in-one planning: Website live • WhatsApp RSVPs enabled • Checklist synced
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to="/wedding-websites"
                    className="px-3.5 py-2 rounded-lg bg-[#faf5eb] hover:bg-stone-200/60 border border-stone-300 text-[#484036] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Globe size={13} className="text-maroon-700" />
                    <span>Website Studio</span>
                  </Link>
                  <Link
                    to="/checklist"
                    className="px-3.5 py-2 rounded-lg bg-[#faf5eb] hover:bg-stone-200/60 border border-stone-300 text-[#484036] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Checklist</span>
                  </Link>
                  <Link
                    to={`/weddings/${weddingId}/messages?kind=INVITE`}
                    className="px-3.5 py-2 rounded-lg bg-maroon-700 hover:bg-maroon-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Send size={13} />
                    <span>Send Invites</span>
                  </Link>
                </div>
              </div>

              {/* Hero Attendance Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Confirmed (Prominent) */}
                <div className="bg-[#ecece4] text-[#33302c] p-7 rounded-[4px] border border-[#484036] col-span-2 sm:col-span-1 shadow-none">
                  <div className="flex items-center justify-between text-[#484036] mb-2">
                    <span className="text-xs font-normal uppercase tracking-[0.05em]">
                      Confirmed Heads
                    </span>
                    <CheckCircle2 size={16} className="text-[#484036]" />
                  </div>
                  <div className="text-4xl font-normal tracking-[-0.04em] text-[#33302c]">
                    {summary.confirmed}
                  </div>
                  <p className="text-xs text-[#666e72] mt-2 font-normal">
                    {Math.round(summary.personConfirmationRate * 100)}% of invited people
                  </p>
                </div>

                {/* Declined */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                  <div className="flex items-center justify-between text-[#666e72] mb-2">
                    <span className="text-xs font-normal uppercase tracking-[0.05em]">
                      Declined
                    </span>
                    <XCircle size={16} className="text-[#666e72]" />
                  </div>
                  <div className="text-4xl font-normal tracking-[-0.04em] text-[#33302c]">
                    {summary.declined}
                  </div>
                  <p className="text-xs text-[#666e72] mt-2 font-normal">
                    {summary.invited > 0 ? Math.round((summary.declined / summary.invited) * 100) : 0}% of invited people
                  </p>
                </div>

                {/* Awaiting Response */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                  <div className="flex items-center justify-between text-[#666e72] mb-2">
                    <span className="text-xs font-normal uppercase tracking-[0.05em]">
                      Awaiting
                    </span>
                    <Clock size={16} className="text-[#666e72]" />
                  </div>
                  <div className="text-4xl font-normal tracking-[-0.04em] text-[#33302c]">
                    {summary.awaiting}
                  </div>
                  <p className="text-xs text-[#666e72] mt-2 font-normal">
                    Unconfirmed attendance
                  </p>
                </div>

                {/* Total Invited */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                  <div className="flex items-center justify-between text-[#666e72] mb-2">
                    <span className="text-xs font-normal uppercase tracking-[0.05em]">
                      Total List Cap
                    </span>
                    <Users size={16} className="text-[#484036]" />
                  </div>
                  <div className="text-4xl font-normal tracking-[-0.04em] text-[#33302c]">
                    {summary.invited}
                  </div>
                  <p className="text-xs text-[#666e72] mt-2 font-normal">
                    Across {summary.totalHouseholds} households
                  </p>
                </div>
              </div>

              {/* Secondary Rates & Catering Bounds Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Catering Bounds Card (Explicitly NOT a forecast) */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] flex items-center gap-2">
                      <Utensils size={16} className="text-[#484036]" />
                      <span>Catering Planning Bounds (Strict Certainty)</span>
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.05em] font-normal text-[#484036] bg-[#f2e9cf] px-2.5 py-0.5 rounded-[4px] border border-[#cacab0]">
                      Not an estimate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="p-4 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20">
                      <p className="text-xs uppercase tracking-[0.05em] text-[#666e72]">Minimum Certain</p>
                      <p className="text-3xl font-normal text-[#33302c] tracking-[-0.03em] mt-1">
                        {summary.cateringBounds.minCertain}
                      </p>
                      <p className="text-[11px] text-[#666e72] mt-1">Strictly confirmed</p>
                    </div>

                    <div className="p-4 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20">
                      <p className="text-xs uppercase tracking-[0.05em] text-[#666e72]">Maximum Possible</p>
                      <p className="text-3xl font-normal text-[#33302c] tracking-[-0.03em] mt-1">
                        {summary.cateringBounds.maxPossible}
                      </p>
                      <p className="text-[11px] text-[#666e72] mt-1">Confirmed + Awaiting</p>
                    </div>

                    <div className="p-4 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20">
                      <p className="text-xs uppercase tracking-[0.05em] text-[#666e72]">Target Comparison</p>
                      <p className="text-3xl font-normal text-[#33302c] tracking-[-0.03em] mt-1">
                        {selectedEvent.cateringTarget ? selectedEvent.cateringTarget : 'No Target'}
                      </p>
                      <p className="text-[11px] text-[#666e72] mt-1">
                        {selectedEvent.cateringTarget
                          ? summary.cateringTargetDiff! >= 0
                            ? `+${summary.cateringTargetDiff} above target`
                            : `${Math.abs(summary.cateringTargetDiff!)} to reach target`
                          : 'Set catering target in event'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Rates & Contacted Status */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none flex flex-col justify-between">
                  <div>
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mb-4">
                      Response Transparency
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-[#484036] mb-1.5 uppercase tracking-[0.04em]">
                          <span>Household Response Rate</span>
                          <span className="font-medium text-[#33302c]">
                            {Math.round(summary.householdResponseRate * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#faf5eb] rounded-[2px] h-2 overflow-hidden border border-[#666e72]/20">
                          <div
                            className="bg-[#484036] h-2 rounded-[2px] transition-all"
                            style={{ width: `${Math.round(summary.householdResponseRate * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[#666e72] mt-1">
                          {summary.respondedHouseholds} of {summary.totalHouseholds} households responded
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-[#484036] mb-1.5 uppercase tracking-[0.04em]">
                          <span>Person Response Rate</span>
                          <span className="font-medium text-[#33302c]">
                            {Math.round(summary.personResponseRate * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#faf5eb] rounded-[2px] h-2 overflow-hidden border border-[#666e72]/20">
                          <div
                            className="bg-[#666e72] h-2 rounded-[2px] transition-all"
                            style={{ width: `${Math.round(summary.personResponseRate * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#666e72]/20 flex items-center justify-between text-xs text-[#666e72]">
                    <span>Not yet contacted:</span>
                    <span className="font-medium text-[#33302c]">
                      {summary.notYetContactedHouseholds} households ({summary.notYetContactedPeople} people)
                    </span>
                  </div>
                </div>
              </div>

              {/* Planning Assumption Card (P1: User-entered assumption clearly labeled) */}
              <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em]">
                      Planning Assumption Scenario
                    </h3>
                    <span className="text-[10px] uppercase tracking-[0.05em] font-normal text-[#484036] bg-[#f2e9cf] border border-[#cacab0] px-2.5 py-0.5 rounded-[4px]">
                      Your assumption
                    </span>
                  </div>
                  <span className="text-xs text-[#666e72] font-normal">
                    Turnout simulation for awaiting guests
                  </span>
                </div>

                <div className="bg-[#faf5eb] rounded-[4px] p-6 border border-[#666e72]/25 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xs text-[#484036] mb-2 uppercase tracking-[0.04em]">
                        <span>Assume Awaiting Response Turnout:</span>
                        <span className="font-medium text-[#33302c] text-sm">{assumptionPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={assumptionPercent}
                        onChange={(e) => setAssumptionPercent(Number(e.target.value))}
                        className="w-full accent-[#484036] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#666e72] mt-1">
                        <span>0% (Min Certain: {summary.cateringBounds.minCertain})</span>
                        <span>50%</span>
                        <span>100% (Max Possible: {summary.cateringBounds.maxPossible})</span>
                      </div>
                    </div>

                    <div className="sm:border-l sm:border-[#666e72]/20 sm:pl-6 flex items-center gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.05em] text-[#666e72]">Scenario Attendance</p>
                        <p className="text-3xl font-normal tracking-[-0.03em] text-[#33302c] my-0.5">
                          {totalWithAssumption}{' '}
                          <span className="text-xs font-normal text-[#666e72]">heads</span>
                        </p>
                        <p className="text-[11px] text-[#666e72]">
                          {summary.confirmed} confirmed + {assumedPendingAttendees} assumed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-[#484036] bg-[#f2e9cf] p-4 rounded-[4px] border border-[#cacab0]">
                  <ShieldAlert className="w-4 h-4 text-[#484036] shrink-0 mt-0.5" />
                  <p>
                    <strong>Your assumption — not a forecast or guarantee.</strong> This scenario is calculated solely from your entered percentage ({assumptionPercent}%) of currently awaiting guests ({summary.awaiting} people). Unconfirmed guests are never counted as confirmed.
                  </p>
                </div>
              </div>

              {/* Visualizations vs Table View Toggle */}
              <div className="flex items-center justify-between pt-2">
                <h2 className="text-xl font-normal text-[#33302c] tracking-[-0.03em]">
                  Attendance & Catering Breakdown
                </h2>
                <div className="flex items-center gap-1.5 bg-[#ecece4] p-1 rounded-[4px] border border-[#666e72]/30">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`px-3 py-1.5 rounded-[2px] text-xs uppercase tracking-[0.05em] transition-colors ${
                      activeTab === 'visual'
                        ? 'bg-[#484036] text-[#faf5eb] font-normal'
                        : 'text-[#484036] hover:text-[#33302c]'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setActiveTab('table')}
                    className={`px-3 py-1.5 rounded-[2px] text-xs uppercase tracking-[0.05em] transition-colors ${
                      activeTab === 'table'
                        ? 'bg-[#484036] text-[#faf5eb] font-normal'
                        : 'text-[#484036] hover:text-[#33302c]'
                    }`}
                  >
                    Accessible Table
                  </button>
                </div>
              </div>

              {activeTab === 'visual' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Confirmed Over Time Trend */}
                  <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#484036]" />
                      <span>Confirmed Attendance Over Time</span>
                    </h3>
                    {data.trend.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-[#666e72] font-normal">
                        No revisions recorded yet. Revisions log automatically with each RSVP.
                      </div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#cacab0" opacity={0.4} />
                            <XAxis dataKey="date" stroke="#666e72" fontSize={11} />
                            <YAxis stroke="#666e72" fontSize={11} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="confirmed"
                              stroke="#484036"
                              strokeWidth={2}
                              dot={{ fill: '#484036', r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Dietary Preferences (Confirmed Only) */}
                  <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] flex items-center gap-2">
                        <Utensils size={16} className="text-[#484036]" />
                        <span>Dietary Requirements (Confirmed Heads Only)</span>
                      </h3>
                      <span className="text-xs text-[#666e72] font-normal">
                        Total: {summary.dietaryTotals.total}
                      </span>
                    </div>

                    {dietaryData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-[#666e72] font-normal">
                        No confirmed guests yet. Dietary data is never inferred for pending guests.
                      </div>
                    ) : (
                      <>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dietaryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                              <XAxis type="number" stroke="#666e72" fontSize={11} />
                              <YAxis dataKey="name" type="category" stroke="#666e72" fontSize={11} width={80} />
                              <Tooltip />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {dietaryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-[#666e72]/20 mt-2">
                          {dietaryData.map((d) => {
                            const pct =
                              summary.dietaryTotals.total > 0
                                ? Math.round((d.count / summary.dietaryTotals.total) * 100)
                                : 0;
                            return (
                              <div
                                key={d.name}
                                className="flex items-center justify-between p-2.5 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: d.color }}
                                  />
                                  <span className="text-xs text-[#484036] truncate">{d.name}</span>
                                </div>
                                <span className="text-xs font-normal text-[#33302c] shrink-0">
                                  {d.count} <span className="text-[10px] text-[#666e72]">({pct}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Arrival Window Distribution */}
                  <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-[#484036]" />
                      <span>Guest Arrival Distribution</span>
                    </h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={arrivalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cacab0" opacity={0.4} />
                          <XAxis dataKey="name" stroke="#666e72" fontSize={11} />
                          <YAxis stroke="#666e72" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#484036" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Breakdown (All 6 States) */}
                  <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                    <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mb-4">
                      Organizer Status Distribution
                    </h3>
                    <div className="space-y-2.5">
                      {Object.entries(data.statusCounts).map(([statusKey, count]) => (
                        <div
                          key={statusKey}
                          className="flex items-center justify-between p-2.5 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20 text-xs"
                        >
                          <StatusBadge status={statusKey as OrganizerStatus} size="sm" />
                          <span className="font-normal text-[#33302c] text-sm">
                            {count} household{count === 1 ? '' : 's'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Accessible Text / Table Alternative for Screen Readers & Reports */
                <div className="bg-[#ecece4] rounded-[4px] border border-[#666e72]/30 p-7 shadow-none">
                  <h3 className="font-normal text-[#33302c] text-xl tracking-[-0.03em] mb-5">
                    Complete Tabular Breakdown for {selectedEvent.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-[#666e72]/20">
                      <thead>
                        <tr className="text-left text-xs font-normal text-[#666e72] uppercase tracking-[0.05em] bg-[#faf5eb]">
                          <th className="py-3 px-4">Metric</th>
                          <th className="py-3 px-4">Count (People)</th>
                          <th className="py-3 px-4">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#666e72]/15">
                        <tr>
                          <td className="py-2.5 px-4 font-normal text-[#484036]">Confirmed</td>
                          <td className="py-2.5 px-4 font-normal">{summary.confirmed}</td>
                          <td className="py-2.5 px-4">{Math.round(summary.personConfirmationRate * 100)}%</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-normal text-[#666e72]">Declined</td>
                          <td className="py-2.5 px-4 font-normal">{summary.declined}</td>
                          <td className="py-2.5 px-4">
                            {summary.invited > 0 ? Math.round((summary.declined / summary.invited) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-normal text-[#484036]">Awaiting Response</td>
                          <td className="py-2.5 px-4 font-normal">{summary.awaiting}</td>
                          <td className="py-2.5 px-4">
                            {summary.invited > 0 ? Math.round((summary.awaiting / summary.invited) * 100) : 0}%
                          </td>
                        </tr>
                        <tr className="bg-[#faf5eb] font-normal text-[#33302c]">
                          <td className="py-2.5 px-4">Total Guest Cap</td>
                          <td className="py-2.5 px-4">{summary.invited}</td>
                          <td className="py-2.5 px-4">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mt-7 mb-3">Dietary Totals (Confirmed Only)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(summary.dietaryTotals)
                      .filter(([k]) => k !== 'total')
                      .map(([diet, cnt]) => (
                        <div key={diet} className="p-3 bg-[#faf5eb] rounded-[4px] border border-[#666e72]/20">
                          <p className="text-[#666e72] uppercase tracking-[0.05em] text-[10px]">{DIETARY_LABELS[diet as Dietary] || diet}</p>
                          <p className="text-xl font-normal text-[#33302c] mt-1">{cnt as number}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Needs Follow-Up & Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Needs Follow-Up Action Box */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-[#484036]" />
                        <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em]">
                          Needs Follow-Up ({data.needsFollowUpList.length})
                        </h3>
                      </div>
                      <Link
                        to={`/weddings/${weddingId}/messages?kind=REMINDER&eventId=${selectedEvent.id}`}
                        className="text-xs uppercase tracking-[0.05em] font-normal text-[#484036] hover:text-[#33302c] flex items-center gap-1"
                      >
                        <span>Send Reminders</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>

                    {data.needsFollowUpList.length === 0 ? (
                      <p className="text-xs text-[#666e72] py-6 text-center font-normal">
                        All guests are on track. No urgent follow-ups required right now.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {data.needsFollowUpList.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-normal text-[#33302c]">{item.displayName}</p>
                              <p className="text-[#666e72] text-[11px] mt-0.5">{item.reason}</p>
                            </div>
                            <span className="shrink-0 text-[#484036] font-normal">
                              {item.invitedCount} seats
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {data.needsFollowUpList.length > 6 && (
                    <div className="mt-4 text-center">
                      <Link
                        to={`/weddings/${weddingId}/guests?status=NEEDS_FOLLOW_UP&eventId=${selectedEvent.id}`}
                        className="text-xs uppercase tracking-[0.05em] text-[#484036] hover:underline"
                      >
                        View all {data.needsFollowUpList.length} follow-up guests
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent RSVP Activity Feed */}
                <div className="bg-[#ecece4] p-7 rounded-[4px] border border-[#666e72]/30 shadow-none">
                  <h3 className="font-normal text-[#33302c] text-base tracking-[-0.03em] mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-[#666e72]" />
                    <span>Recent Activity Feed</span>
                  </h3>

                  {data.recentActivity.length === 0 ? (
                    <p className="text-xs text-[#666e72] py-6 text-center font-normal">
                      No activity recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {data.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 p-3 rounded-[4px] bg-[#faf5eb] border border-[#666e72]/20 text-xs"
                        >
                          <div
                            className={`p-1.5 rounded-[2px] mt-0.5 ${
                              act.type === 'RSVP_UPDATE'
                                ? 'bg-[#ecece4] text-[#484036]'
                                : 'bg-[#f2e9cf] text-[#484036]'
                            }`}
                          >
                            {act.type === 'RSVP_UPDATE' ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Send size={13} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-normal text-[#33302c] truncate">{act.title}</p>
                            <p className="text-[11px] text-[#666e72] mt-0.5">
                              {new Date(act.timestamp).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
