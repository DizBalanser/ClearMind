import { useState, useEffect } from 'react';
import { Check, TrendingUp } from 'lucide-react';
import { auth, items } from '../services/api';
import type { User, Item } from '../types';

const Dashboard = () => {
    const [user, setUser] = useState<User | null>(null);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        highPriority: 0
    });
    const [focusItems, setFocusItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [userData, itemsData] = await Promise.all([
                auth.getMe(),
                items.getAll()
            ]);
            setUser(userData);
            setAllItems(itemsData);
            updateStatsAndFocus(itemsData);
        } catch (error) {
            console.error('Dashboard load failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatsAndFocus = (itemsData: Item[]) => {
        const pending = itemsData.filter(i => i.status !== 'done').length;
        const completed = itemsData.filter(i => i.status === 'done').length;
        const highPriority = itemsData.filter(i => (i.priority || 0) > 7 && i.status !== 'done').length;
        setStats({ pending, completed, highPriority });

        const focus = itemsData
            .filter(i => i.status !== 'done')
            .sort((a, b) => ((b.priority || 0) - (a.priority || 0)))
            .slice(0, 4);
        setFocusItems(focus);
    };

    const handleToggleComplete = async (item: Item) => {
        const newStatus = item.status === 'done' ? 'pending' : 'done';
        try {
            const updated = await items.updateStatus(item.id, newStatus);
            const newItems = allItems.map(i => i.id === item.id ? updated : i);
            setAllItems(newItems);
            updateStatsAndFocus(newItems);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-gray-500">Loading your dashboard...</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <main className="w-full max-w-7xl mx-auto px-4 md:px-6 py-8 animate-fade-in-up">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1a1a2e] mb-2">
                        {getGreeting()}, {user?.name || 'Alex'}
                    </h1>
                    <p className="text-gray-500 text-lg">Let's focus on what matters today.</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Pending Card */}
                    <div className="stats-card group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <span className="material-symbols-outlined text-blue-600">pending_actions</span>
                            </div>
                            {stats.pending > 0 && (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-500">
                                    +{Math.min(stats.pending, 2)} new
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Pending Tasks</p>
                            <p className="text-3xl font-bold text-[#1a1a2e]">{stats.pending}</p>
                        </div>
                    </div>

                    {/* Completed Card */}
                    <div className="stats-card relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-full w-1 bg-[#14B8A6]"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-teal-50 rounded-lg">
                                <span className="material-symbols-outlined text-[#14B8A6]">check_circle</span>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#14B8A6]/10 text-[#14B8A6]">On track</span>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">Completed Today</p>
                            <p className="text-3xl font-bold text-[#1a1a2e]">{stats.completed}</p>
                        </div>
                    </div>

                    {/* Priority Card */}
                    <div className="stats-card group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <span className="material-symbols-outlined text-orange-600">priority_high</span>
                            </div>
                            {stats.highPriority > 0 && (
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-600">Urgent</span>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">High Priority</p>
                            <p className="text-3xl font-bold text-[#1a1a2e]">{stats.highPriority}</p>
                        </div>
                    </div>
                </div>

                {/* Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Task List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-[#1a1a2e] flex items-center gap-2">
                                Today's Focus
                                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                    {focusItems.length} Remaining
                                </span>
                            </h2>
                            <a href="/database" className="text-sm font-medium text-[#14B8A6] hover:text-[#14B8A6]/80 transition-colors">View All</a>
                        </div>

                        <div className="card-static divide-y divide-gray-100">
                            {focusItems.length === 0 ? (
                                <div className="p-8 text-center">
                                    <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">celebration</span>
                                    <p className="text-gray-500">You're all caught up!</p>
                                    <a href="/chat" className="text-[#14B8A6] text-sm hover:underline mt-2 inline-block">Add new tasks via Brain Dump →</a>
                                </div>
                            ) : (
                                focusItems.map((item) => (
                                    <label
                                        key={item.id}
                                        className="group flex items-start gap-4 p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                    >
                                        <div className="relative flex items-start pt-1">
                                            <button
                                                onClick={() => handleToggleComplete(item)}
                                                className={`checkbox ${item.status === 'done' ? 'checked' : ''}`}
                                            >
                                                {item.status === 'done' && <Check size={14} />}
                                            </button>
                                        </div>
                                        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-base font-medium text-[#1a1a2e] group-hover:text-[#14B8A6] transition-colors ${item.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                                    {item.title}
                                                </span>
                                                <span className="text-xs text-gray-400">{item.life_area || 'General'}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {item.priority && item.priority > 8 ? (
                                                    <span className="badge-priority-high flex items-center gap-1">
                                                        <TrendingUp size={12} /> High
                                                    </span>
                                                ) : item.priority && item.priority > 5 ? (
                                                    <span className="badge-priority-medium">Medium</span>
                                                ) : (
                                                    <span className="badge-priority-low">Low</span>
                                                )}
                                                {item.deadline && (
                                                    <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                        <span className="material-symbols-outlined text-[14px] mr-1">schedule</span>
                                                        {new Date(item.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: AI Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-4">
                            {/* AI Card */}
                            <div className="relative overflow-hidden rounded-2xl shadow-lg border border-white/60">
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-teal-50/30 to-blue-50 z-0"></div>
                                <div className="relative z-10 p-6 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-[#14B8A6] to-blue-500 flex items-center justify-center shadow-lg text-white">
                                            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                                        </div>
                                        <h3 className="font-bold text-[#1a1a2e]">AI Digital Twin</h3>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Insight */}
                                        <div className="bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <span className="material-symbols-outlined text-[#14B8A6] text-[20px] mt-0.5">insights</span>
                                                <div>
                                                    <p className="text-sm text-[#1a1a2e] font-medium mb-1">Pattern Detected</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        You have {stats.pending} pending tasks. Focus on high-priority items first.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2 justify-end">
                                                <a href="/database" className="text-xs font-semibold text-[#14B8A6] hover:bg-[#14B8A6]/10 px-3 py-1.5 rounded-full border border-[#14B8A6] transition-colors">
                                                    Review Draft
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Action Button */}
                <a
                    href="/chat"
                    className="fixed bottom-8 right-8 size-14 bg-[#1a1a2e] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50 group"
                >
                    <span className="material-symbols-outlined text-[28px] group-hover:rotate-90 transition-transform duration-300">add</span>
                </a>
            </main>
        </div>
    );
};

export default Dashboard;
