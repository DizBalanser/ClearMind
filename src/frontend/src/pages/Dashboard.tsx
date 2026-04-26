import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BrainCircuit, Check, Network, Radar, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { auth, dashboard, items } from '../services/api';
import type { DashboardActivityDay, DashboardAnalytics, Item, User } from '../types';

const formatShortDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const heatmapIntensity = (total: number, max: number) => {
    if (total === 0 || max === 0) return 'bg-[#0d1117] border-[#30363d]';
    const ratio = total / max;
    if (ratio > 0.75) return 'bg-[#14B8A6] border-[#5eead4] shadow-[0_0_16px_rgba(20,184,166,0.45)]';
    if (ratio > 0.45) return 'bg-[#0d9488] border-[#2dd4bf] shadow-[0_0_12px_rgba(20,184,166,0.28)]';
    if (ratio > 0.2) return 'bg-[#115e59] border-[#14B8A6]/60';
    return 'bg-[#134e4a]/70 border-[#14B8A6]/30';
};

const buildHeatmapRows = (activity: DashboardActivityDay[]) => {
    const rows: DashboardActivityDay[][] = [];
    for (let index = 0; index < activity.length; index += 7) {
        rows.push(activity.slice(index, index + 7));
    }
    return rows;
};

const Dashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [userData, itemsData, analyticsData] = await Promise.all([
                auth.getMe(),
                items.getAll(),
                dashboard.getAnalytics(60),
            ]);
            setUser(userData);
            setAllItems(itemsData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (item: Item) => {
        const newStatus = item.status === 'done' ? 'pending' : 'done';
        try {
            const updated = await items.updateStatus(item.id, newStatus);
            setAllItems((prev) => prev.map((existing) => (existing.id === item.id ? updated : existing)));
            const analyticsData = await dashboard.getAnalytics(60);
            setAnalytics(analyticsData);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const focusItems = useMemo(() => {
        return allItems
            .filter((item) => item.status !== 'done')
            .sort((a, b) => ((b.priority || 0) - (a.priority || 0)))
            .slice(0, 5);
    }, [allItems]);

    const maxActivity = useMemo(() => {
        return Math.max(1, ...(analytics?.activity ?? []).map((day) => day.total));
    }, [analytics?.activity]);

    const heatmapRows = useMemo(() => buildHeatmapRows(analytics?.activity ?? []), [analytics?.activity]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const telemetryCards = [
        {
            label: 'Active Profile Rules tracked by Flash',
            value: analytics?.telemetry.active_profile_rules ?? 0,
            icon: BrainCircuit,
            accent: 'text-[#5eead4]',
        },
        {
            label: 'Hidden connections discovered by Gemma 31B',
            value: analytics?.telemetry.hidden_connections ?? 0,
            icon: Network,
            accent: 'text-[#c4b5fd]',
        },
        {
            label: 'Knowledge graph connections',
            value: analytics?.telemetry.graph_connections ?? 0,
            icon: Radar,
            accent: 'text-[#58a6ff]',
        },
        {
            label: 'Recent memory extraction events',
            value: analytics?.telemetry.memory_updates ?? 0,
            icon: Sparkles,
            accent: 'text-[#fbbf24]',
        },
        {
            label: 'Pending task load',
            value: analytics?.telemetry.pending_tasks ?? 0,
            icon: Zap,
            accent: 'text-[#fb7185]',
        },
        {
            label: 'Reflection cycles recorded',
            value: analytics?.telemetry.reflections ?? 0,
            icon: Activity,
            accent: 'text-[#a78bfa]',
        },
    ];

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-[#8b949e]">
                <div className="premium-card px-6 py-4 text-sm">Loading cognitive command center...</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto text-[#e6edf3]">
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
                <section className="premium-card relative overflow-hidden p-6 md:p-8">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#14B8A6]/20 blur-3xl" />
                    <div className="absolute bottom-0 left-1/2 h-40 w-56 rounded-full bg-[#8b5cf6]/20 blur-3xl" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#5eead4]">
                                <span className="size-2 rounded-full bg-[#14B8A6] shadow-[0_0_16px_rgba(20,184,166,0.8)]" />
                                Premium Cognitive Analytics
                            </div>
                            <h1 className="neon-gradient-text text-3xl font-black tracking-tight md:text-5xl">
                                {greeting}, {user?.name || 'Commander'}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8b949e] md:text-base">
                                Your Personal OS is tracking thought volume, knowledge graph growth, and agent memory signals across the last 60 days.
                            </p>
                        </div>
                        <a
                            href="/chat"
                            className="premium-button inline-flex items-center justify-center gap-2 rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/15 px-5 py-3 text-sm font-bold text-[#5eead4]"
                        >
                            <Sparkles size={17} />
                            Start Brain Dump
                        </a>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {telemetryCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <article key={card.label} className="premium-card hover-glow p-4 xl:col-span-1">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className={`flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${card.accent}`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#7d8590]">
                                        live
                                    </span>
                                </div>
                                <p className="text-3xl font-black text-[#f0f6fc]">{card.value}</p>
                                <p className="mt-2 text-xs leading-5 text-[#8b949e]">{card.label}</p>
                            </article>
                        );
                    })}
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <article className="premium-card p-5">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Cognitive Activity Heatmap</p>
                                <h2 className="mt-1 text-xl font-bold text-[#f0f6fc]">Inputs Across 60 Days</h2>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#8b949e]">
                                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#14B8A6]" /> tasks</span>
                                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#f59e0b]" /> ideas</span>
                                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-[#8b5cf6]" /> thoughts</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1117]/50 p-4">
                            <div className="flex min-w-max gap-1.5">
                                {heatmapRows.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-rows-7 gap-1.5">
                                        {week.map((day) => (
                                            <div
                                                key={day.date}
                                                title={`${formatShortDate(day.date)}: ${day.total} inputs (${day.tasks} tasks, ${day.ideas} ideas, ${day.thoughts} thoughts)`}
                                                className={`heatmap-cell size-4 rounded-[5px] border ${heatmapIntensity(day.total, maxActivity)}`}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-[#8b949e]">
                            Brighter cells mean more captured tasks, thoughts, and ideas. Hover a cell to see the daily breakdown.
                        </p>
                    </article>

                    <article className="premium-card p-5">
                        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c4b5fd]">Knowledge Velocity</p>
                                <h2 className="mt-1 text-xl font-bold text-[#f0f6fc]">Nodes and Connections Over Time</h2>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-[#8b5cf6]/25 bg-[#8b5cf6]/10 px-3 py-1 text-xs text-[#c4b5fd]">
                                <TrendingUp size={14} />
                                cumulative
                            </div>
                        </div>
                        <div className="h-[320px] rounded-2xl border border-white/10 bg-[#0d1117]/50 p-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.velocity ?? []} margin={{ left: -12, right: 12, top: 18, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="nodesGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.38} />
                                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="connectionsGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#7d8590" tickLine={false} axisLine={false} minTickGap={24} />
                                    <YAxis stroke="#7d8590" tickLine={false} axisLine={false} width={34} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(13, 17, 23, 0.92)',
                                            border: '1px solid rgba(148, 163, 184, 0.24)',
                                            borderRadius: '14px',
                                            color: '#e6edf3',
                                        }}
                                        labelFormatter={(label) => formatShortDate(String(label))}
                                    />
                                    <Area type="monotone" dataKey="nodes" stroke="#14B8A6" strokeWidth={2.5} fill="url(#nodesGlow)" name="Nodes" />
                                    <Area type="monotone" dataKey="connections" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#connectionsGlow)" name="Connections" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
                    <article className="premium-card overflow-hidden">
                        <div className="border-b border-white/10 px-5 py-4">
                            <h2 className="text-xl font-bold text-[#f0f6fc]">Today&apos;s Focus Queue</h2>
                            <p className="mt-1 text-sm text-[#8b949e]">Highest-priority active items from your Personal OS.</p>
                        </div>
                        <div className="divide-y divide-white/10">
                            {focusItems.length === 0 ? (
                                <div className="p-8 text-center text-[#8b949e]">
                                    <span className="material-symbols-outlined mb-2 text-4xl text-[#3fb950]">celebration</span>
                                    <p>You&apos;re all caught up.</p>
                                    <a href="/chat" className="mt-2 inline-block text-sm font-semibold text-[#5eead4] hover:underline">
                                        Add new tasks via Brain Dump
                                    </a>
                                </div>
                            ) : (
                                focusItems.map((item) => (
                                    <label key={item.id} className="group flex cursor-pointer items-start gap-4 p-5 transition-colors hover:bg-white/[0.04]">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleComplete(item)}
                                            className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                                item.status === 'done'
                                                    ? 'border-[#14B8A6] bg-[#14B8A6] text-white'
                                                    : 'border-[#30363d] bg-[#0d1117] text-transparent group-hover:border-[#14B8A6]'
                                            }`}
                                        >
                                            <Check size={13} />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#e6edf3] group-hover:text-[#5eead4]">{item.title}</p>
                                            <p className="mt-1 text-xs text-[#7d8590]">{item.life_area || 'General'} · priority {item.priority || 5}</p>
                                        </div>
                                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#8b949e]">
                                            {item.category}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                    </article>

                    <article className="premium-card p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 text-[#5eead4]">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#f0f6fc]">Agent Pulse</h2>
                                <p className="text-sm text-[#8b949e]">Live interpretation of your current system state.</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="premium-card-soft p-4">
                                <p className="text-sm font-semibold text-[#e6edf3]">Flash memory layer</p>
                                <p className="mt-1 text-sm leading-6 text-[#8b949e]">
                                    Tracking {analytics?.telemetry.active_profile_rules ?? 0} active user rules and {analytics?.telemetry.memory_updates ?? 0} recent memory events.
                                </p>
                            </div>
                            <div className="premium-card-soft p-4">
                                <p className="text-sm font-semibold text-[#e6edf3]">Gemma graph reasoning</p>
                                <p className="mt-1 text-sm leading-6 text-[#8b949e]">
                                    {analytics?.telemetry.hidden_connections ?? 0} enriched graph links have AI reasoning or weighted signal.
                                </p>
                            </div>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
