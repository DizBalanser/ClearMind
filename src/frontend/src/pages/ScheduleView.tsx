import { useEffect, useState } from 'react';
import { CalendarDays, Download, Clock } from 'lucide-react';
import { schedule } from '../services/api';
import type { ScheduleBlock } from '../types';

const ScheduleView = () => {
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const data = await schedule.get();
                setBlocks(data);
            } catch (error) {
                console.error("Failed to load schedule", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const handleExport = async () => {
        try {
            const blob = await schedule.exportIcs();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clearmind-schedule.ics';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Failed to export schedule", error);
        }
    };

    const formatDateTime = (isoStr: string) => {
        const d = new Date(isoStr);
        return {
            date: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Group blocks by date
    const groupedBlocks = blocks.reduce((acc, block) => {
        if (!block.scheduled_start) return acc;
        const dateKey = new Date(block.scheduled_start).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(block);
        return acc;
    }, {} as Record<string, ScheduleBlock[]>);

    return (
        <div className="flex flex-col h-full animate-fade-in text-[#e6edf3]">
            <header className="premium-glass flex items-center justify-between px-8 py-6 border-b border-white/10">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Scheduler Agent</p>
                    <h1 className="mt-1 text-2xl font-bold text-[#f0f6fc]">My Schedule</h1>
                    <p className="text-[#8b949e] mt-1">Timeline of your planned tasks and events.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="premium-button flex items-center gap-2 px-4 py-2 rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/15 text-[#5eead4] transition-colors shadow-sm font-medium"
                >
                    <Download size={18} />
                    Export .ics
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-10">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14B8A6]"></div>
                        </div>
                    ) : Object.keys(groupedBlocks).length === 0 ? (
                        <div className="premium-card text-center py-20">
                            <CalendarDays size={48} className="mx-auto text-[#5eead4] mb-4" />
                            <h3 className="text-lg font-bold text-[#f0f6fc]">No scheduled tasks</h3>
                            <p className="text-[#8b949e] mt-2">Ask the Scheduler Agent in the Chat to plan your day.</p>
                        </div>
                    ) : (
                        Object.entries(groupedBlocks).map(([dateStr, dayBlocks]) => (
                            <div key={dateStr} className="relative">
                                {/* Date Header */}
                                <div className="sticky top-0 z-10 py-2 mb-4">
                                    <h2 className="text-lg font-bold text-[#f0f6fc] flex items-center gap-2">
                                        <CalendarDays size={20} className="text-[#14B8A6]" />
                                        {formatDateTime(dayBlocks[0].scheduled_start).date}
                                    </h2>
                                </div>

                                {/* Timeline */}
                                <div className="ml-4 pl-6 border-l-2 border-[#30363d] space-y-6">
                                    {dayBlocks.map((block, idx) => {
                                        const timeStr = formatDateTime(block.scheduled_start).time;
                                        return (
                                            <div key={idx} className="relative group">
                                                {/* Timeline dot */}
                                                <div className="absolute -left-[31px] top-4 w-4 h-4 bg-[#0d1117] border-2 border-[#10b981] rounded-full group-hover:scale-125 transition-transform shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
                                                
                                                <div className="premium-card hover-glow rounded-xl p-5 transition-all ml-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2 text-[#10b981] font-bold text-sm">
                                                                <Clock size={16} />
                                                                {timeStr}
                                                            </div>
                                                            <h3 className="text-lg font-bold mt-1 text-[#f0f6fc]">{block.title}</h3>
                                                            <p className="text-[#8b949e] text-sm mt-1">Duration: {block.estimated_duration_minutes} minutes</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleView;
