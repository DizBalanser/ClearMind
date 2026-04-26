import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Edit3, Loader2, Plus, Save, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { profileMemory } from '../services/api';
import type { ProfileMemoryCategory, ProfileQuestion, ProfileQuestionAnswer, ProfileUpdateLog, UserContextEntry } from '../types';

type CategoryStyle = {
    label: string;
    icon: string;
    border: string;
    glow: string;
    text: string;
    bg: string;
};

const categoryStyles: Record<ProfileMemoryCategory, CategoryStyle> = {
    identity: {
        label: 'Identity',
        icon: 'fingerprint',
        border: 'border-[#bc8cff]/45',
        glow: 'shadow-[0_0_24px_rgba(188,140,255,0.16)]',
        text: 'text-[#bc8cff]',
        bg: 'bg-[#bc8cff]/10',
    },
    constraint: {
        label: 'Operating Rules',
        icon: 'rule',
        border: 'border-[#f85149]/45',
        glow: 'shadow-[0_0_24px_rgba(248,81,73,0.14)]',
        text: 'text-[#f85149]',
        bg: 'bg-[#f85149]/10',
    },
    goal: {
        label: 'Goals',
        icon: 'flag',
        border: 'border-[#3fb950]/45',
        glow: 'shadow-[0_0_24px_rgba(63,185,80,0.14)]',
        text: 'text-[#3fb950]',
        bg: 'bg-[#3fb950]/10',
    },
    general: {
        label: 'General Memory',
        icon: 'memory',
        border: 'border-[#58a6ff]/45',
        glow: 'shadow-[0_0_24px_rgba(88,166,255,0.14)]',
        text: 'text-[#58a6ff]',
        bg: 'bg-[#58a6ff]/10',
    },
};

const categories: ProfileMemoryCategory[] = ['identity', 'constraint', 'goal', 'general'];

const formatDate = (value?: string | null) => {
    if (!value) return 'unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'unknown time';
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const confidenceLabel = (confidence?: number | null) => {
    if (confidence == null) return 'confidence unknown';
    return `${Math.round(confidence * 100)}% confidence`;
};

const UserProfile = () => {
    const [context, setContext] = useState<UserContextEntry[]>([]);
    const [updates, setUpdates] = useState<ProfileUpdateLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [editing, setEditing] = useState<UserContextEntry | null>(null);
    const [editFact, setEditFact] = useState('');
    const [editCategory, setEditCategory] = useState<ProfileMemoryCategory>('general');
    const [newFact, setNewFact] = useState('');
    const [newCategory, setNewCategory] = useState<ProfileMemoryCategory>('general');
    const [creating, setCreating] = useState(false);
    const [questions, setQuestions] = useState<ProfileQuestion[]>([]);
    const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
    const [reviewAnswers, setReviewAnswers] = useState<ProfileQuestionAnswer[]>([]);
    const [questionnaireSaving, setQuestionnaireSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMemory = async () => {
        setError(null);
        try {
            const data = await profileMemory.get();
            setContext(data.context);
            setUpdates(data.updates);
        } catch (err) {
            console.error('Failed to load profile memory', err);
            setError('Could not load profile memory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMemory();
        profileMemory.getQuestions()
            .then(setQuestions)
            .catch((err) => {
                console.error('Failed to load profile questions', err);
            });
    }, []);

    const groupedContext = useMemo(() => {
        return categories.reduce<Record<ProfileMemoryCategory, UserContextEntry[]>>((acc, category) => {
            acc[category] = context.filter((entry) => entry.category === category);
            return acc;
        }, {
            identity: [],
            constraint: [],
            goal: [],
            general: [],
        });
    }, [context]);

    const startEditing = (entry: UserContextEntry) => {
        setEditing(entry);
        setEditFact(entry.fact);
        setEditCategory(entry.category);
    };

    const cancelEditing = () => {
        setEditing(null);
        setEditFact('');
        setEditCategory('general');
    };

    const createMemory = async () => {
        if (!newFact.trim()) return;
        setCreating(true);
        setError(null);
        try {
            const created = await profileMemory.createContext({
                category: newCategory,
                fact: newFact.trim(),
                source: 'user',
                confidence: 1,
            });
            setContext((prev) => [created, ...prev.filter((entry) => entry.id !== created.id)]);
            setNewFact('');
            setNewCategory('general');
            await loadMemory();
        } catch (err) {
            console.error('Failed to create memory fact', err);
            setError('Could not add that memory fact.');
        } finally {
            setCreating(false);
        }
    };

    const buildReviewAnswers = () => {
        const answers = questions
            .map((question) => ({
                question_id: question.id,
                category: question.category,
                fact: questionAnswers[question.id]?.trim() || '',
            }))
            .filter((answer) => answer.fact.length > 0);
        setReviewAnswers(answers);
    };

    const updateReviewAnswer = (index: number, patch: Partial<ProfileQuestionAnswer>) => {
        setReviewAnswers((prev) => prev.map((answer, answerIndex) => (
            answerIndex === index ? { ...answer, ...patch } : answer
        )));
    };

    const removeReviewAnswer = (index: number) => {
        setReviewAnswers((prev) => prev.filter((_, answerIndex) => answerIndex !== index));
    };

    const saveQuestionnaire = async () => {
        const answers = reviewAnswers.filter((answer) => answer.fact.trim());
        if (answers.length === 0) return;

        setQuestionnaireSaving(true);
        setError(null);
        try {
            await profileMemory.submitQuestionnaire(answers.map((answer) => ({
                ...answer,
                fact: answer.fact.trim(),
            })));
            setQuestionAnswers({});
            setReviewAnswers([]);
            await loadMemory();
        } catch (err) {
            console.error('Failed to save questionnaire answers', err);
            setError('Could not save questionnaire answers.');
        } finally {
            setQuestionnaireSaving(false);
        }
    };

    const saveEdit = async () => {
        if (!editing || !editFact.trim()) return;
        setSavingId(editing.id);
        setError(null);
        try {
            const updated = await profileMemory.updateContext(editing.id, {
                category: editCategory,
                fact: editFact.trim(),
            });
            setContext((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
            await loadMemory();
            cancelEditing();
        } catch (err) {
            console.error('Failed to update memory fact', err);
            setError('Could not update that memory fact.');
        } finally {
            setSavingId(null);
        }
    };

    const deleteEntry = async (entry: UserContextEntry) => {
        if (!confirm(`Delete this memory?\n\n"${entry.fact}"`)) return;
        setDeletingId(entry.id);
        setError(null);
        try {
            await profileMemory.deleteContext(entry.id);
            setContext((prev) => prev.filter((item) => item.id !== entry.id));
            if (editing?.id === entry.id) cancelEditing();
        } catch (err) {
            console.error('Failed to delete memory fact', err);
            setError('Could not delete that memory fact.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-full w-full text-[#e6edf3] overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-8">
                <header className="premium-card relative overflow-hidden p-6">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(88,166,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(188,140,255,0.12),transparent_30%)]" />
                    <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 items-center justify-center rounded-2xl border border-[#58a6ff]/40 bg-[#58a6ff]/10 text-[#58a6ff] shadow-[0_0_24px_rgba(88,166,255,0.25)]">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#58a6ff]">Global User Profile</p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#f0f6fc]">AI Memory Console</h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b949e]">
                                    Inspect and correct the long-term facts your agents use to personalize planning, reflection, scheduling, and graph analysis.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/70 px-4 py-3">
                                <p className="text-xs text-[#7d8590]">Active facts</p>
                                <p className="mt-1 text-xl font-bold text-[#f0f6fc]">{context.length}</p>
                            </div>
                            <div className="rounded-xl border border-[#30363d] bg-[#0d1117]/70 px-4 py-3">
                                <p className="text-xs text-[#7d8590]">Log events</p>
                                <p className="mt-1 text-xl font-bold text-[#f0f6fc]">{updates.length}</p>
                            </div>
                            <div className="col-span-2 rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/10 px-4 py-3 sm:col-span-1">
                                <p className="text-xs text-[#7d8590]">Status</p>
                                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#3fb950]">
                                    <ShieldCheck size={16} /> Synced
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="rounded-xl border border-[#f85149]/35 bg-[#f85149]/10 px-4 py-3 text-sm text-[#ffb3ad]">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#30363d] bg-[#161b22] text-[#8b949e]">
                        <Loader2 className="mr-2 animate-spin" size={18} />
                        Loading AI memory...
                    </div>
                ) : (
                    <>
                    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Plus size={18} className="text-[#3fb950]" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3fb950]">Add Memory</p>
                                    <h2 className="text-lg font-bold text-[#f0f6fc]">Save a Fact Manually</h2>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <select
                                    value={newCategory}
                                    onChange={(event) => setNewCategory(event.target.value as ProfileMemoryCategory)}
                                    className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                >
                                    {categories.map((option) => (
                                        <option key={option} value={option}>{categoryStyles[option].label}</option>
                                    ))}
                                </select>
                                <textarea
                                    value={newFact}
                                    onChange={(event) => setNewFact(event.target.value)}
                                    rows={3}
                                    placeholder="Example: User prefers short practical explanations."
                                    className="w-full resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                />
                                <button
                                    type="button"
                                    onClick={createMemory}
                                    disabled={creating || !newFact.trim()}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#3fb950]/40 bg-[#3fb950]/15 px-3 py-2 text-sm font-semibold text-[#3fb950] disabled:opacity-50"
                                >
                                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save memory
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#58a6ff]">Quick Profile Test</p>
                                    <h2 className="text-lg font-bold text-[#f0f6fc]">Answer a Few Questions</h2>
                                    <p className="mt-1 text-sm text-[#8b949e]">Answer any questions you want. Review and edit before saving.</p>
                                </div>
                                <span className="rounded-full border border-[#30363d] px-3 py-1 text-xs text-[#8b949e]">
                                    {questions.length} questions
                                </span>
                            </div>

                            {reviewAnswers.length === 0 ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {questions.map((question) => (
                                        <label key={question.id} className="rounded-xl border border-[#30363d] bg-[#0d1117]/70 p-3">
                                            <span className={`mb-2 inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${categoryStyles[question.category].border} ${categoryStyles[question.category].bg} ${categoryStyles[question.category].text}`}>
                                                {categoryStyles[question.category].label}
                                            </span>
                                            <span className="block text-sm font-semibold text-[#e6edf3]">{question.prompt}</span>
                                            <textarea
                                                value={questionAnswers[question.id] || ''}
                                                onChange={(event) => setQuestionAnswers((prev) => ({
                                                    ...prev,
                                                    [question.id]: event.target.value,
                                                }))}
                                                rows={2}
                                                placeholder={question.placeholder || ''}
                                                className="mt-2 w-full resize-none rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                            />
                                        </label>
                                    ))}
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={buildReviewAnswers}
                                            disabled={!Object.values(questionAnswers).some((answer) => answer.trim())}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#58a6ff]/40 bg-[#58a6ff]/15 px-4 py-2 text-sm font-semibold text-[#58a6ff] disabled:opacity-50"
                                        >
                                            <Sparkles size={16} />
                                            Review answers
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-xl border border-[#58a6ff]/30 bg-[#58a6ff]/10 p-3 text-sm text-[#c9d1d9]">
                                        Review these facts before saving. You can edit wording or remove anything.
                                    </div>
                                    {reviewAnswers.map((answer, index) => (
                                        <div key={`${answer.question_id}-${index}`} className="rounded-xl border border-[#30363d] bg-[#0d1117]/70 p-3">
                                            <div className="mb-2 flex items-center gap-2">
                                                <select
                                                    value={answer.category}
                                                    onChange={(event) => updateReviewAnswer(index, { category: event.target.value as ProfileMemoryCategory })}
                                                    className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-[#e6edf3] outline-none"
                                                >
                                                    {categories.map((option) => (
                                                        <option key={option} value={option}>{categoryStyles[option].label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => removeReviewAnswer(index)}
                                                    className="ml-auto rounded-lg p-1.5 text-[#8b949e] hover:bg-[#30363d] hover:text-[#f85149]"
                                                    title="Remove answer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <textarea
                                                value={answer.fact}
                                                onChange={(event) => updateReviewAnswer(index, { fact: event.target.value })}
                                                rows={2}
                                                className="w-full resize-none rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                            />
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setReviewAnswers([])}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#30363d] px-4 py-2 text-sm font-semibold text-[#8b949e] hover:text-[#e6edf3]"
                                        >
                                            Back to questions
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveQuestionnaire}
                                            disabled={questionnaireSaving || !reviewAnswers.some((answer) => answer.fact.trim())}
                                            className="inline-flex items-center gap-2 rounded-lg border border-[#3fb950]/40 bg-[#3fb950]/15 px-4 py-2 text-sm font-semibold text-[#3fb950] disabled:opacity-50"
                                        >
                                            {questionnaireSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            Save reviewed facts
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                        <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#58a6ff]">Section 01</p>
                                    <h2 className="mt-1 text-xl font-bold text-[#f0f6fc]">Core Identity & Operating Rules</h2>
                                </div>
                                <Sparkles size={18} className="text-[#58a6ff]" />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                {categories.map((category) => {
                                    const style = categoryStyles[category];
                                    const entries = groupedContext[category];
                                    return (
                                        <div key={category} className={`rounded-2xl border ${style.border} ${style.glow} bg-[#0d1117]/65 p-4`}>
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-[20px] ${style.text}`}>{style.icon}</span>
                                                    <h3 className={`text-sm font-bold ${style.text}`}>{style.label}</h3>
                                                </div>
                                                <span className="rounded-full border border-[#30363d] px-2.5 py-1 text-xs text-[#8b949e]">
                                                    {entries.length}
                                                </span>
                                            </div>

                                            {entries.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-[#30363d] bg-[#161b22]/50 p-4 text-sm text-[#7d8590]">
                                                    No active facts in this category yet.
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    {entries.map((entry) => (
                                                        <div key={entry.id} className={`group rounded-xl border ${style.border} ${style.bg} p-3 transition-all hover:bg-[#161b22]`}>
                                                            {editing?.id === entry.id ? (
                                                                <div className="space-y-3">
                                                                    <select
                                                                        value={editCategory}
                                                                        onChange={(event) => setEditCategory(event.target.value as ProfileMemoryCategory)}
                                                                        className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                                                    >
                                                                        {categories.map((option) => (
                                                                            <option key={option} value={option}>{categoryStyles[option].label}</option>
                                                                        ))}
                                                                    </select>
                                                                    <textarea
                                                                        value={editFact}
                                                                        onChange={(event) => setEditFact(event.target.value)}
                                                                        rows={3}
                                                                        className="w-full resize-none rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-[#58a6ff]"
                                                                    />
                                                                    <div className="flex justify-end gap-2">
                                                                        <button onClick={cancelEditing} className="inline-flex items-center gap-1 rounded-lg border border-[#30363d] px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#e6edf3]">
                                                                            <X size={14} /> Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={saveEdit}
                                                                            disabled={savingId === entry.id || !editFact.trim()}
                                                                            className="inline-flex items-center gap-1 rounded-lg border border-[#3fb950]/40 bg-[#3fb950]/15 px-3 py-1.5 text-xs font-semibold text-[#3fb950] disabled:opacity-50"
                                                                        >
                                                                            {savingId === entry.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                            Save
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm leading-6 text-[#e6edf3]">{entry.fact}</p>
                                                                    <div className="mt-3 flex items-center justify-between gap-2">
                                                                        <span className="text-[11px] text-[#7d8590]">
                                                                            {confidenceLabel(entry.confidence)} · {entry.source || 'agent'}
                                                                        </span>
                                                                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                                            <button
                                                                                onClick={() => startEditing(entry)}
                                                                                className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#30363d] hover:text-[#58a6ff]"
                                                                                title="Edit memory"
                                                                            >
                                                                                <Edit3 size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteEntry(entry)}
                                                                                disabled={deletingId === entry.id}
                                                                                className="rounded-lg p-1.5 text-[#8b949e] hover:bg-[#30363d] hover:text-[#f85149] disabled:opacity-50"
                                                                                title="Delete memory"
                                                                            >
                                                                                {deletingId === entry.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                            <div className="mb-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3fb950]">Section 02</p>
                                <h2 className="mt-1 text-xl font-bold text-[#f0f6fc]">Memory Extraction Feed</h2>
                                <p className="mt-2 text-sm text-[#8b949e]">Raw profile updates captured by the Flash Lite orchestrator.</p>
                            </div>

                            <div className="max-h-[720px] overflow-y-auto rounded-2xl border border-[#30363d] bg-[#0d1117] p-4 font-mono text-xs">
                                {updates.length === 0 ? (
                                    <div className="flex min-h-[260px] items-center justify-center text-[#7d8590]">
                                        No memory extraction events yet.
                                    </div>
                                ) : (
                                    <div className="relative flex flex-col gap-4">
                                        <div className="absolute bottom-0 left-[7px] top-2 w-px bg-[#30363d]" />
                                        {updates.map((update) => {
                                            const style = categoryStyles[update.category];
                                            return (
                                                <article key={update.id} className="relative pl-7">
                                                    <span className={`absolute left-0 top-1 size-3 rounded-full border ${style.border} ${style.bg} shadow-[0_0_14px_currentColor] ${style.text}`} />
                                                    <div className="rounded-xl border border-[#30363d] bg-[#161b22]/75 p-3">
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-md border ${style.border} ${style.bg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.text}`}>
                                                                {update.category}
                                                            </span>
                                                            <span className="text-[#7d8590]">[{formatDate(update.created_at)}]</span>
                                                            <span className="text-[#7d8590]">source={update.source || 'agent'}</span>
                                                        </div>
                                                        <p className="leading-5 text-[#c9d1d9]">
                                                            <span className="text-[#3fb950]">$ extract_memory</span>{' '}
                                                            <span>{update.fact}</span>
                                                        </p>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
