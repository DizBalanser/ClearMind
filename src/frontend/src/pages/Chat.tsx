/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, CalendarDays, BrainCircuit, Target, Check, X } from 'lucide-react';
import { chat, profileMemory } from '../services/api';
import type { Item, ScheduleBlock, ReflectionSummary, MemoryCandidate } from '../types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    agent?: string;
    items?: Item[];
    schedule?: ScheduleBlock[];
    reflection?: ReflectionSummary;
    memoryCandidates?: MemoryCandidate[];
}

// Fallback for TypeScript to recognize SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Good morning! I'm your ClearMind Multi-Agent Assistant. You can dump thoughts, ask me to reflect on your habits, or have me plan your day. How can I help?",
            agent: 'orchestrator'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [memoryCardStatus, setMemoryCardStatus] = useState<Record<string, 'saving' | 'saved' | 'ignored' | 'error'>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const baseInputRef = useRef<string>('');

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    currentTranscript += transcript;
                    if (event.results[i].isFinal && !transcript.endsWith(' ')) {
                        currentTranscript += ' ';
                    }
                }
                
                const base = baseInputRef.current;
                const space = (base && !base.endsWith(' ') && currentTranscript && !currentTranscript.startsWith(' ')) ? ' ' : '';
                setInput(base + space + currentTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            baseInputRef.current = input; // Save current input instead of clearing it
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch chat history on component mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const history = await chat.getHistory(10);
                if (history && history.length > 0) {
                    const formattedHistory: Message[] = history.map((msg: any) => ({
                        role: msg.role,
                        content: msg.content,
                        agent: msg.agent_used,
                    }));
                    
                    setMessages(prev => {
                        // Keep the initial welcome message, then append history
                        return [prev[0], ...formattedHistory];
                    });
                }
            } catch (error) {
                console.error("Failed to load chat history:", error);
            }
        };
        loadHistory();
    }, []);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await chat.send(userMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                agent: response.agent,
                items: response.items,
                schedule: response.schedule,
                reflection: response.reflection,
                memoryCandidates: response.memory_candidates,
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble processing that right now. Please try again.",
                agent: 'orchestrator'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            task: '#10b981',
            idea: '#f59e0b',
            thought: '#8b5cf6'
        };
        return colors[category] || '#64748b';
    };

    const formatTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const saveMemoryCandidate = async (key: string, candidate: MemoryCandidate) => {
        setMemoryCardStatus(prev => ({ ...prev, [key]: 'saving' }));
        try {
            await profileMemory.createContext({
                category: candidate.category,
                fact: candidate.fact,
                confidence: candidate.confidence,
                source: 'chat_confirmed',
            });
            setMemoryCardStatus(prev => ({ ...prev, [key]: 'saved' }));
        } catch (error) {
            console.error('Failed to save memory candidate', error);
            setMemoryCardStatus(prev => ({ ...prev, [key]: 'error' }));
        }
    };

    const ignoreMemoryCandidate = (key: string) => {
        setMemoryCardStatus(prev => ({ ...prev, [key]: 'ignored' }));
    };

    const renderAgentIcon = (agent?: string) => {
        switch (agent) {
            case 'scheduler': return <CalendarDays size={20} className="text-[#f59e0b]" />;
            case 'reflection': return <BrainCircuit size={20} className="text-[#8b5cf6]" />;
            case 'planner': return <Target size={20} className="text-[#10b981]" />;
            default: return <span className="material-symbols-outlined text-[20px] text-white">smart_toy</span>; // brain_dump / default
        }
    };

    const renderAgentName = (agent?: string) => {
        switch (agent) {
            case 'scheduler': return 'Scheduler Agent';
            case 'reflection': return 'Reflection Agent';
            case 'planner': return 'Strategic Planner';
            default: return 'Brain Dump Agent';
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-[#e6edf3]">
            {/* Header */}
            <header className="premium-glass flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-10 shrink-0 w-full">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-[#f0f6fc]">Multi-Agent System</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                            </span>
                            <span className="text-xs text-[#8b949e] font-medium">Orchestrator Active</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                {/* Timestamp */}
                <div className="flex justify-center">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        Today, {formatTime()}
                    </span>
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'} animate-fade-in`}>
                        {msg.role === 'assistant' && (
                        <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#0d1117] to-slate-900 flex items-center justify-center shadow-sm border border-white/10">
                                {renderAgentIcon(msg.agent)}
                            </div>
                        )}

                        <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'w-full'}`}>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-[#e6edf3]">
                                    {msg.role === 'user' ? 'You' : renderAgentName(msg.agent)}
                                </span>
                                <span className="text-xs text-[#7d8590]">{formatTime()}</span>
                            </div>

                            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai w-full'}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {/* Standard Classified Items (Agent A) */}
                            {msg.items && msg.items.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-2 w-full">
                                    {msg.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="item-card w-full sm:w-[320px]">
                                            <div className="item-card-strip" style={{ backgroundColor: getCategoryColor(item.category) }} />
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <span className={`badge badge-${item.category}`}>{item.category}</span>
                                                    {item.subcategory && (
                                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.subcategory}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-[#1a1a2e] leading-tight">{item.title}</h3>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Schedule Blocks (Agent C) */}
                            {msg.schedule && msg.schedule.length > 0 && (
                                    <div className="mt-2 w-full premium-card overflow-hidden">
                                    <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                        <CalendarDays size={16} className="text-[#f59e0b]" />
                                        <h3 className="text-sm font-bold text-[#f0f6fc]">Proposed Schedule</h3>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {msg.schedule.map((block, bIdx) => (
                                            <div key={bIdx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-sm text-[#e6edf3]">{block.title}</span>
                                                    <span className="text-xs text-[#8b949e]">Duration: {block.estimated_duration_minutes} min</span>
                                                </div>
                                                {block.scheduled_start && block.scheduled_end && (
                                                    <div className="flex flex-col items-end text-sm font-medium text-[#14B8A6]">
                                                        <span>{formatDateTime(block.scheduled_start)} - {formatDateTime(block.scheduled_end)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reflection / Planner Data (Agent B & D) */}
                            {msg.reflection && (
                                <div className="mt-2 w-full flex flex-col gap-3">
                                    {msg.reflection.patterns && msg.reflection.patterns.length > 0 && (
                                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                            <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-1.5">
                                                <BrainCircuit size={16} /> Observed Patterns
                                            </h4>
                                            <ul className="space-y-1">
                                                {msg.reflection.patterns.map((p, pIdx) => (
                                                    <li key={pIdx} className="text-sm text-purple-800 flex items-start gap-2">
                                                        <span className="text-purple-400 mt-0.5">•</span>
                                                        <span>{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {msg.reflection.suggestions && msg.reflection.suggestions.length > 0 && (
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                            <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                                                <Target size={16} /> Actionable Suggestions
                                            </h4>
                                            <ul className="space-y-1">
                                                {msg.reflection.suggestions.map((s, sIdx) => (
                                                    <li key={sIdx} className="text-sm text-emerald-800 flex items-start gap-2">
                                                        <span className="text-emerald-400 mt-0.5">•</span>
                                                        <span>{s}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {msg.memoryCandidates && msg.memoryCandidates.length > 0 && (
                                <div className="mt-2 w-full rounded-xl border border-blue-100 bg-blue-50 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-blue-600" />
                                        <h4 className="text-sm font-bold text-blue-950">Should I remember this?</h4>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {msg.memoryCandidates.map((candidate, candidateIdx) => {
                                            const key = `${idx}-${candidateIdx}`;
                                            const status = memoryCardStatus[key];
                                            if (status === 'ignored') return null;

                                            return (
                                                <div key={key} className="rounded-lg border border-blue-100 bg-white p-3 shadow-sm">
                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                                            {candidate.category}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {Math.round(candidate.confidence * 100)}% confidence
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-6 text-[#1a1a2e]">{candidate.fact}</p>
                                                    {candidate.reason && (
                                                        <p className="mt-1 text-xs text-gray-500">{candidate.reason}</p>
                                                    )}
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => saveMemoryCandidate(key, candidate)}
                                                            disabled={status === 'saving' || status === 'saved'}
                                                            className="inline-flex items-center gap-1 rounded-lg bg-[#14B8A6] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                                                        >
                                                            <Check size={14} />
                                                            {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving...' : 'Save memory'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => ignoreMemoryCandidate(key)}
                                                            disabled={status === 'saving' || status === 'saved'}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 disabled:opacity-60"
                                                        >
                                                            <X size={14} />
                                                            Ignore
                                                        </button>
                                                        {status === 'error' && (
                                                            <span className="text-xs font-medium text-red-500">Could not save. Try again.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm border border-white/20">
                                Y
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-3xl mr-auto animate-fade-in">
                        <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#0d1117] to-slate-900 flex items-center justify-center text-white shadow-sm border border-white/10">
                            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        </div>
                        <div className="chat-bubble-ai flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#14B8A6] animate-pulse">auto_awesome</span>
                            <span className="text-sm text-gray-500">Orchestrator routing request...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Composer */}
            <div className="p-4 md:p-6 shrink-0 border-t border-white/10">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSend} className={`premium-glass relative flex items-end gap-2 border ${isListening ? 'border-red-400 ring-2 ring-red-400/20' : 'border-white/10'} rounded-2xl p-2 transition-all`}>
                        <button 
                            type="button" 
                            onClick={toggleListening}
                            className={`hover-glow p-3 transition-colors rounded-xl shrink-0 flex items-center justify-center ${isListening ? 'bg-red-500/15 text-red-300 animate-pulse' : 'text-[#8b949e] hover:text-white hover:bg-white/5'}`}
                            title={isListening ? "Stop listening" : "Start speaking"}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        
                        <input
                            type="text"
                            className="w-full bg-transparent border-none text-[#e6edf3] placeholder-[#7d8590] focus:ring-0 py-3 text-base outline-none"
                            placeholder={isListening ? "Listening..." : "Type a task, ask for a schedule, or reflect..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <div className="flex items-center gap-1 pb-1">
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="hover-glow p-2 bg-[#14B8A6] hover:bg-teal-500 text-white rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-[#7d8590]">Powered by Gemini 2.5 Multi-Agent System (Flash & Pro).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
