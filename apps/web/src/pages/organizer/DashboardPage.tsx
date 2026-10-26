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
      <div className="min-h-screen bg-cream-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-maroon-700" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col">
        <Header />
        <div className="p-8 text-center text-rose-800">
          Failed to load wedding dashboard. Please refresh.
        </div>
      </div>
    );
  }

  // Dietary chart data
  const dietaryData = summary
    ? [
        { name: 'Vegetarian', count: summary.dietaryTotals[Dietary.VEGETARIAN], color: '#16a34a' },
        { name: 'Non-Veg', count: summary.dietaryTotals[Dietary.NON_VEGETARIAN], color: '#dc2626' },
        { name: 'Jain', count: summary.dietaryTotals[Dietary.JAIN], color: '#f59e0b' },
        { name: 'Vegan', count: summary.dietaryTotals[Dietary.VEGAN], color: '#0d9488' },
        { name: 'Other', count: summary.dietaryTotals[Dietary.NO_PREFERENCE] + summary.dietaryTotals[Dietary.EGGETARIAN], color: '#78716c' },
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
    <div className="min-h-screen bg-cream-50 flex flex-col">
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
              className="fixed inset-0 bg-stone-900/60"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="relative z-50 w-64 bg-white h-full">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-saffron-600 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200">
                  Event-Scoped Metrics
                </span>
                {summary && !summary.isInvariantValid && (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                    <ShieldAlert size={12} /> Invariant Check Warning
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                {selectedEvent?.name || 'Wedding Dashboard'}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <EventSelector events={events} selectedEventId={selectedEvent?.id} />

              <Link
                to={`/weddings/${weddingId}/messages?kind=REMINDER&eventId=${selectedEvent?.id || ''}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
              >
                <Send size={15} />
                <span>Follow Up</span>
              </Link>
            </div>
          </div>

          {!selectedEvent ? (
            <div className="bg-white rounded-2xl border border-cream-200 p-8 text-center max-w-lg mx-auto">
              <p className="text-stone-700 mb-4">No events found for this wedding yet.</p>
              <Link
                to={`/weddings/${weddingId}/events`}
                className="px-4 py-2 rounded-xl bg-maroon-700 text-white font-medium text-sm"
              >
                Create First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hero Attendance Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Confirmed (Prominent) */}
                <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-700 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between opacity-80 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Confirmed Heads
                    </span>
                    <CheckCircle2 size={18} className="text-emerald-300" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                    {summary.confirmed}
                  </div>
                  <p className="text-xs text-emerald-200 mt-2">
                    {Math.round(summary.personConfirmationRate * 100)}% of invited people
                  </p>
                </div>

                {/* Declined */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Declined
                    </span>
                    <XCircle size={18} className="text-rose-600" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-stone-900">
                    {summary.declined}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    {summary.invited > 0 ? Math.round((summary.declined / summary.invited) * 100) : 0}% of invited people
                  </p>
                </div>

                {/* Awaiting Response */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Awaiting
                    </span>
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-stone-900">
                    {summary.awaiting}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    Unconfirmed attendance
                  </p>
                </div>

                {/* Total Invited */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                  <div className="flex items-center justify-between text-stone-500 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total List Cap
                    </span>
                    <Users size={18} className="text-maroon-700" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-stone-900">
                    {summary.invited}
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    Across {summary.totalHouseholds} households
                  </p>
                </div>
              </div>

              {/* Secondary Rates & Catering Bounds Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Catering Bounds Card (Explicitly NOT a forecast) */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-semibold text-stone-900 text-sm flex items-center gap-2">
                      <Utensils size={16} className="text-saffron-600" />
                      <span>Catering Planning Bounds (Strict Certainty)</span>
                    </h3>
                    <span className="text-[11px] font-medium text-stone-500 bg-cream-100 px-2 py-0.5 rounded-full">
                      Not an estimate
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                      <p className="text-xs text-stone-500">Minimum Certain</p>
                      <p className="text-2xl font-serif font-bold text-emerald-800">
                        {summary.cateringBounds.minCertain}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Strictly confirmed</p>
                    </div>

                    <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                      <p className="text-xs text-stone-500">Maximum Possible</p>
                      <p className="text-2xl font-serif font-bold text-stone-800">
                        {summary.cateringBounds.maxPossible}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Confirmed + Awaiting</p>
                    </div>

                    <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                      <p className="text-xs text-stone-500">Target Comparison</p>
                      <p className="text-2xl font-serif font-bold text-maroon-800">
                        {selectedEvent.cateringTarget ? selectedEvent.cateringTarget : 'No Target'}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
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
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-semibold text-stone-900 text-sm mb-3">
                      Response Transparency
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-stone-600 mb-1">
                          <span>Household Response Rate</span>
                          <span className="font-semibold text-stone-900">
                            {Math.round(summary.householdResponseRate * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-maroon-700 h-2 rounded-full transition-all"
                            style={{ width: `${Math.round(summary.householdResponseRate * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          {summary.respondedHouseholds} of {summary.totalHouseholds} households responded
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-stone-600 mb-1">
                          <span>Person Response Rate</span>
                          <span className="font-semibold text-stone-900">
                            {Math.round(summary.personResponseRate * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-cream-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-saffron-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.round(summary.personResponseRate * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between text-xs text-stone-500">
                    <span>Not yet contacted:</span>
                    <span className="font-semibold text-stone-800">
                      {summary.notYetContactedHouseholds} households ({summary.notYetContactedPeople} people)
                    </span>
                  </div>
                </div>
              </div>

              {/* Planning Assumption Card (P1: User-entered assumption clearly labeled) */}
              <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-semibold text-stone-900 text-sm">
                      Planning Assumption Scenario
                    </h3>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Your assumption
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">
                    Expected turnout simulation for remaining awaiting guests
                  </span>
                </div>

                <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-xs font-medium text-stone-700 mb-1.5">
                        <span>Assume Awaiting Response Turnout:</span>
                        <span className="font-bold text-amber-950 text-sm">{assumptionPercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={assumptionPercent}
                        onChange={(e) => setAssumptionPercent(Number(e.target.value))}
                        className="w-full accent-amber-700 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
                        <span>0% (Min Certain: {summary.cateringBounds.minCertain})</span>
                        <span>50%</span>
                        <span>100% (Max Possible: {summary.cateringBounds.maxPossible})</span>
                      </div>
                    </div>

                    <div className="sm:border-l sm:border-amber-200 sm:pl-6 flex items-center gap-4">
                      <div>
                        <p className="text-[11px] text-stone-500">Scenario Attendance</p>
                        <p className="text-2xl font-serif font-bold text-amber-950">
                          {totalWithAssumption}{' '}
                          <span className="text-xs font-sans font-normal text-stone-500">heads</span>
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {summary.confirmed} confirmed + {assumedPendingAttendees} assumed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-50/90 p-3 rounded-xl border border-amber-200">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Your assumption — not a forecast or guarantee.</strong> This scenario is calculated solely from your entered percentage ({assumptionPercent}%) of currently awaiting guests ({summary.awaiting} people). Unconfirmed guests are never counted as confirmed.
                  </p>
                </div>
              </div>

              {/* Visualizations vs Table View Toggle */}
              <div className="flex items-center justify-between pt-2">
                <h2 className="text-lg font-serif font-bold text-stone-900">
                  Attendance & Catering Breakdown
                </h2>
                <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'visual'
                        ? 'bg-white text-stone-900 shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setActiveTab('table')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      activeTab === 'table'
                        ? 'bg-white text-stone-900 shadow-sm font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Accessible Table
                  </button>
                </div>
              </div>

              {activeTab === 'visual' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Confirmed Over Time Trend */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                    <h3 className="font-serif font-semibold text-stone-900 text-sm mb-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-maroon-700" />
                      <span>Confirmed Attendance Over Time</span>
                    </h3>
                    {data.trend.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-stone-400">
                        No revisions recorded yet. Revisions log automatically with each RSVP.
                      </div>
                    ) : (
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f5f1eb" />
                            <XAxis dataKey="date" stroke="#998365" fontSize={11} />
                            <YAxis stroke="#998365" fontSize={11} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="confirmed"
                              stroke="#881a36"
                              strokeWidth={3}
                              dot={{ fill: '#881a36', r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Dietary Preferences (Confirmed Only) */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-serif font-semibold text-stone-900 text-sm flex items-center gap-2">
                        <Utensils size={16} className="text-emerald-700" />
                        <span>Dietary Requirements (Confirmed Heads Only)</span>
                      </h3>
                      <span className="text-xs text-stone-500 font-medium">
                        Total: {summary.dietaryTotals.total}
                      </span>
                    </div>

                    {dietaryData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-stone-400">
                        No confirmed guests yet. Dietary data is never inferred for pending guests.
                      </div>
                    ) : (
                      <>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dietaryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                              <XAxis type="number" stroke="#998365" fontSize={11} />
                              <YAxis dataKey="name" type="category" stroke="#998365" fontSize={11} width={80} />
                              <Tooltip />
                              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {dietaryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-cream-100 mt-2">
                          {dietaryData.map((d) => {
                            const pct =
                              summary.dietaryTotals.total > 0
                                ? Math.round((d.count / summary.dietaryTotals.total) * 100)
                                : 0;
                            return (
                              <div
                                key={d.name}
                                className="flex items-center justify-between p-2 rounded-xl bg-cream-50 border border-cream-200"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: d.color }}
                                  />
                                  <span className="text-xs text-stone-700 truncate">{d.name}</span>
                                </div>
                                <span className="text-xs font-bold text-stone-900 shrink-0">
                                  {d.count} <span className="text-[10px] text-stone-400 font-normal">({pct}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Arrival Window Distribution */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                    <h3 className="font-serif font-semibold text-stone-900 text-sm mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-saffron-600" />
                      <span>Guest Arrival Distribution</span>
                    </h3>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={arrivalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f1eb" />
                          <XAxis dataKey="name" stroke="#998365" fontSize={11} />
                          <YAxis stroke="#998365" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#e89205" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Status Breakdown (All 6 States) */}
                  <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                    <h3 className="font-serif font-semibold text-stone-900 text-sm mb-4">
                      Organizer Status Distribution
                    </h3>
                    <div className="space-y-2.5">
                      {Object.entries(data.statusCounts).map(([statusKey, count]) => (
                        <div
                          key={statusKey}
                          className="flex items-center justify-between p-2 rounded-xl bg-cream-50/60 border border-cream-100 text-xs"
                        >
                          <StatusBadge status={statusKey as OrganizerStatus} size="sm" />
                          <span className="font-semibold text-stone-900 text-sm">
                            {count} household{count === 1 ? '' : 's'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Accessible Text / Table Alternative for Screen Readers & Reports */
                <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
                  <h3 className="font-serif font-bold text-stone-900 mb-4">
                    Complete Tabular Breakdown for {selectedEvent.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm divide-y divide-cream-200">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider bg-cream-50">
                          <th className="py-3 px-4">Metric</th>
                          <th className="py-3 px-4">Count (People)</th>
                          <th className="py-3 px-4">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-100">
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-emerald-800">Confirmed</td>
                          <td className="py-2.5 px-4 font-semibold">{summary.confirmed}</td>
                          <td className="py-2.5 px-4">{Math.round(summary.personConfirmationRate * 100)}%</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-rose-800">Declined</td>
                          <td className="py-2.5 px-4 font-semibold">{summary.declined}</td>
                          <td className="py-2.5 px-4">
                            {summary.invited > 0 ? Math.round((summary.declined / summary.invited) * 100) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-medium text-amber-800">Awaiting Response</td>
                          <td className="py-2.5 px-4 font-semibold">{summary.awaiting}</td>
                          <td className="py-2.5 px-4">
                            {summary.invited > 0 ? Math.round((summary.awaiting / summary.invited) * 100) : 0}%
                          </td>
                        </tr>
                        <tr className="bg-cream-50 font-bold">
                          <td className="py-2.5 px-4">Total Guest Cap</td>
                          <td className="py-2.5 px-4">{summary.invited}</td>
                          <td className="py-2.5 px-4">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-serif font-semibold text-stone-900 mt-6 mb-3">Dietary Totals (Confirmed Only)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(summary.dietaryTotals)
                      .filter(([k]) => k !== 'total')
                      .map(([diet, cnt]) => (
                        <div key={diet} className="p-3 bg-cream-50 rounded-xl border border-cream-200">
                          <p className="text-stone-500">{DIETARY_LABELS[diet as Dietary] || diet}</p>
                          <p className="text-lg font-bold text-stone-900 mt-1">{cnt as number}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Needs Follow-Up & Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Needs Follow-Up Action Box */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-600" />
                        <h3 className="font-serif font-bold text-stone-900 text-base">
                          Needs Follow-Up ({data.needsFollowUpList.length})
                        </h3>
                      </div>
                      <Link
                        to={`/weddings/${weddingId}/messages?kind=REMINDER&eventId=${selectedEvent.id}`}
                        className="text-xs font-semibold text-maroon-700 hover:text-maroon-800 flex items-center gap-1"
                      >
                        <span>Send Reminders</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>

                    {data.needsFollowUpList.length === 0 ? (
                      <p className="text-xs text-stone-400 py-6 text-center">
                        All guests are on track! No urgent follow-ups required right now.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {data.needsFollowUpList.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <p className="font-semibold text-stone-900">{item.displayName}</p>
                              <p className="text-amber-900 text-[11px] mt-0.5">{item.reason}</p>
                            </div>
                            <span className="shrink-0 text-stone-500 font-medium">
                              {item.invitedCount} seats
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {data.needsFollowUpList.length > 6 && (
                    <div className="mt-3 text-center">
                      <Link
                        to={`/weddings/${weddingId}/guests?status=NEEDS_FOLLOW_UP&eventId=${selectedEvent.id}`}
                        className="text-xs font-semibold text-maroon-700 hover:underline"
                      >
                        View all {data.needsFollowUpList.length} follow-up guests
                      </Link>
                    </div>
                  )}
                </div>

                {/* Recent RSVP Activity Feed */}
                <div className="bg-white p-5 rounded-2xl border border-cream-200 shadow-sm">
                  <h3 className="font-serif font-bold text-stone-900 text-base mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-stone-500" />
                    <span>Recent Activity Feed</span>
                  </h3>

                  {data.recentActivity.length === 0 ? (
                    <p className="text-xs text-stone-400 py-6 text-center">
                      No activity recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {data.recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-cream-50 transition-colors border border-cream-100 text-xs"
                        >
                          <div
                            className={`p-1.5 rounded-lg mt-0.5 ${
                              act.type === 'RSVP_UPDATE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {act.type === 'RSVP_UPDATE' ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Send size={14} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-stone-800 truncate">{act.title}</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">
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
