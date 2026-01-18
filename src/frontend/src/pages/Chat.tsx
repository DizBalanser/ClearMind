import { useState, useRef, useEffect } from 'react';
import { Send, Check, Edit2 } from 'lucide-react';
import { chat } from '../services/api';
import type { Item } from '../types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    items?: Item[];
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Good morning! I noticed you have a few open loops from yesterday. Ready to organize your day?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await chat.send(userMsg);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                items: response.items || []
            }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble processing that. Please try again."
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

    return (
        <div className="flex flex-col h-full animate-fade-in relative text-[#1a1a2e]">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-bold text-[#1a1a2e]">ClearMind Assistant</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                            </span>
                            <span className="text-xs text-gray-500 font-medium">Online</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth bg-[#f6f6f7] pb-48">
                {/* Timestamp */}
                <div className="flex justify-center">
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        Today, {formatTime()}
                    </span>
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'} animate-fade-in`}>
                        {msg.role === 'assistant' && (
                            <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#1a1a2e] to-slate-900 flex items-center justify-center text-white shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                            </div>
                        )}

                        <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-[#1a1a2e]">
                                    {msg.role === 'user' ? 'You' : 'ClearMind AI'}
                                </span>
                                <span className="text-xs text-gray-400">{formatTime()}</span>
                            </div>

                            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>

                            {/* Item Cards */}
                            {msg.items && msg.items.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-2 w-full">
                                    {msg.items.map((item, itemIdx) => (
                                        <div
                                            key={itemIdx}
                                            className="item-card w-full sm:w-[320px]"
                                        >
                                            <div
                                                className="item-card-strip"
                                                style={{ backgroundColor: getCategoryColor(item.category) }}
                                            />
                                            <div className="p-4 flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <span className={`badge badge-${item.category}`}>
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-[#1a1a2e] leading-tight">{item.title}</h3>
                                                    {item.deadline && (
                                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                                                            {new Date(item.deadline).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                                                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors">
                                                        <Edit2 size={16} />
                                                        Edit
                                                    </button>
                                                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1a1a2e] hover:bg-[#2a2a40] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                                                        <Check size={16} />
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                Y
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-3xl mr-auto animate-fade-in">
                        <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[#1a1a2e] to-slate-900 flex items-center justify-center text-white shadow-sm">
                            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                        </div>
                        <div className="chat-bubble-ai flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#14B8A6] animate-pulse">auto_awesome</span>
                            <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Composer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#f6f6f7] to-transparent pointer-events-none">
                <div className="pointer-events-auto max-w-4xl mx-auto">
                    <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-white border border-gray-200 shadow-lg rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#1a1a2e]/10 transition-shadow">
                        <button type="button" className="p-2 text-gray-400 hover:text-[#1a1a2e] transition-colors rounded-lg hover:bg-gray-100 shrink-0">
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                        <input
                            type="text"
                            className="w-full bg-transparent border-none text-[#1a1a2e] placeholder-gray-400 focus:ring-0 py-3 text-base"
                            placeholder="Type a new task or ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <div className="flex items-center gap-1 pb-1">
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2 bg-[#14B8A6] hover:bg-teal-600 text-white rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">ClearMind AI can make mistakes. Please review generated tasks.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
