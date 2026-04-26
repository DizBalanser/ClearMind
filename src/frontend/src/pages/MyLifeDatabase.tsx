import { useState, useEffect } from 'react';
import { Check, Clock, Edit2, Trash2, LayoutGrid, Network } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { items } from '../services/api';
import type { Item, MainCategory, Subcategory } from '../types';
import KnowledgeGraph from '../components/graph/KnowledgeGraph';

const MyLifeDatabase = () => {
    const tabs: Array<'All' | MainCategory> = ['All', 'task', 'idea', 'thought'];
    const [activeTab, setActiveTab] = useState<'All' | MainCategory>('All');
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');

    // Edit modal state
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        category: 'task' as MainCategory,
        subcategory: '' as Subcategory | '',
        life_area: '',
        priority: 5
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            const data = await items.getAll();
            setAllItems(data);
        } catch {
            setError('Failed to load your database.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (item: Item) => {
        const newStatus = item.status === 'done' ? 'pending' : 'done';
        try {
            const updated = await items.updateStatus(item.id, newStatus);
            setAllItems(prev => prev.map(i => i.id === item.id ? updated : i));
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setEditForm({
            title: item.title,
            description: item.description || '',
            category: item.category,
            subcategory: item.subcategory || '',
            life_area: item.life_area || '',
            priority: item.priority || 5
        });
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setSaving(true);
        try {
            const updateData: Partial<Item> = {
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                subcategory: editForm.subcategory || undefined,
                life_area: editForm.life_area,
                priority: editForm.priority
            };
            const updated = await items.update(editingItem.id, updateData);
            setAllItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
            setEditingItem(null);
        } catch (err) {
            console.error('Failed to update item:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsAddingNew(true);
        setEditForm({
            title: '',
            description: '',
            category: 'task',
            subcategory: '',
            life_area: '',
            priority: 5
        });
    };

    const handleSaveNew = async () => {
        if (!editForm.title.trim()) return;
        setSaving(true);
        try {
            const newItem = await items.create({
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                subcategory: editForm.subcategory || undefined,
                life_area: editForm.life_area,
                priority: editForm.priority,
                status: 'pending'
            });
            setAllItems(prev => [newItem, ...prev]);
            setIsAddingNew(false);
        } catch (err) {
            console.error('Failed to create item:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: Item) => {
        if (!confirm(`Delete "${item.title}"?`)) return;
        try {
            await items.delete(item.id);
            setAllItems(prev => prev.filter(i => i.id !== item.id));
        } catch (err) {
            console.error('Failed to delete item:', err);
        }
    };

    // Get subcategories based on main category
    const getSubcategories = (category: MainCategory): Subcategory[] => {
        switch (category) {
            case 'task': return ['obligation', 'goal', 'habit', 'deadline'];
            case 'idea': return ['project', 'creative', 'improvement'];
            case 'thought': return ['reflection', 'learning', 'memory', 'question'];
            default: return [];
        }
    };

    const filteredItems = allItems.filter(item => {
        if (activeTab !== 'All' && item.category !== activeTab) return false;
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (subcategoryFilter !== 'all' && item.subcategory !== subcategoryFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!item.title.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const getCategoryColor = (category: MainCategory) => {
        const colors: Record<MainCategory, { bg: string; text: string; strip: string }> = {
            task: { bg: 'bg-emerald-500/10 border border-emerald-400/20', text: 'text-emerald-300', strip: '#10b981' },
            idea: { bg: 'bg-amber-500/10 border border-amber-400/20', text: 'text-amber-300', strip: '#f59e0b' },
            thought: { bg: 'bg-purple-500/10 border border-purple-400/20', text: 'text-purple-300', strip: '#8b5cf6' }
        };
        return colors[category] || { bg: 'bg-gray-100', text: 'text-gray-600', strip: '#64748b' };
    };

    const getSubcategoryLabel = (subcategory?: Subcategory) => {
        if (!subcategory) return null;
        return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
    };

    const getTabLabel = (tab: 'All' | MainCategory) => {
        if (tab === 'All') return 'All';
        return tab.charAt(0).toUpperCase() + tab.slice(1) + 's';
    };

    return (
        <div className="flex h-full w-full">
            {/* Edit Modal */}
            <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="premium-card w-full max-w-lg p-6 animate-fade-in">
                        <Dialog.Title className="text-xl font-bold text-[#f0f6fc] mb-6">Edit Item</Dialog.Title>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Title</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Description</label>
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value as MainCategory, subcategory: '' })}
                                        className="input-field capitalize"
                                    >
                                        <option value="task">Task</option>
                                        <option value="idea">Idea</option>
                                        <option value="thought">Thought</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Subcategory</label>
                                    <select
                                        value={editForm.subcategory}
                                        onChange={e => setEditForm({ ...editForm, subcategory: e.target.value as Subcategory })}
                                        className="input-field capitalize"
                                    >
                                        <option value="">None</option>
                                        {getSubcategories(editForm.category).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Life Area</label>
                                <input type="text" value={editForm.life_area} onChange={e => setEditForm({ ...editForm, life_area: e.target.value })} className="input-field" placeholder="e.g., Career, Health, Personal" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Priority: {editForm.priority}</label>
                                <input type="range" min="1" max="10" value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: parseInt(e.target.value) })} className="w-full accent-[#14B8A6]" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setEditingItem(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSaveEdit} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Add New Modal */}
            <Dialog open={isAddingNew} onClose={() => setIsAddingNew(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="premium-card w-full max-w-lg p-6 animate-fade-in">
                        <Dialog.Title className="text-xl font-bold text-[#f0f6fc] mb-6">Add New Item</Dialog.Title>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Title</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="input-field" placeholder="What's on your mind?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Description</label>
                                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input-field" placeholder="Add details (optional)" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value as MainCategory, subcategory: '' })}
                                        className="input-field capitalize"
                                    >
                                        <option value="task">Task</option>
                                        <option value="idea">Idea</option>
                                        <option value="thought">Thought</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Subcategory</label>
                                    <select
                                        value={editForm.subcategory}
                                        onChange={e => setEditForm({ ...editForm, subcategory: e.target.value as Subcategory })}
                                        className="input-field capitalize"
                                    >
                                        <option value="">None</option>
                                        {getSubcategories(editForm.category).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Life Area</label>
                                <input type="text" value={editForm.life_area} onChange={e => setEditForm({ ...editForm, life_area: e.target.value })} className="input-field" placeholder="e.g., Career, Health, Personal" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#e6edf3] mb-1.5">Priority: {editForm.priority}</label>
                                <input type="range" min="1" max="10" value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: parseInt(e.target.value) })} className="w-full accent-[#14B8A6]" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setIsAddingNew(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSaveNew} disabled={saving || !editForm.title.trim()} className="btn-primary">{saving ? 'Saving...' : 'Add Item'}</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Sticky Header */}
                <div className="premium-glass w-full z-10 sticky top-0 border-b border-white/10">
                    <div className="px-6 pt-8 pb-4 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
                        {/* Page Heading */}
                        <div className="flex flex-wrap justify-between items-end gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5eead4]">Knowledge Store</p>
                                <h1 className="neon-gradient-text text-3xl md:text-4xl font-black tracking-tight">My Life Database</h1>
                                <p className="text-[#8b949e] text-base">Organize your tasks, ideas, and thoughts in one place.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-[#0d1117]/70 p-1 rounded-xl shadow-sm border border-white/10 flex items-center">
                                    <button 
                                        onClick={() => setViewMode('list')} 
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-[#14B8A6]/15 text-[#5eead4] shadow-md' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
                                    >
                                        <LayoutGrid size={16} /> List
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('graph')} 
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'graph' ? 'bg-[#14B8A6]/15 text-[#5eead4] shadow-md' : 'text-[#8b949e] hover:text-[#e6edf3]'}`}
                                    >
                                        <Network size={16} /> Graph
                                    </button>
                                </div>
                                <button onClick={handleAddNew} className="btn-primary">
                                    <span className="material-symbols-outlined text-[20px]">add</span>
                                    Add Item
                                </button>
                            </div>
                        </div>

                        {/* Tabs & Controls */}
                        {viewMode === 'list' && (
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                {/* Tabs */}
                                <div className="flex gap-6 overflow-x-auto pb-1">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => { setActiveTab(tab); setSubcategoryFilter('all'); }}
                                            className={`flex flex-col items-center justify-center border-b-[3px] pb-3 min-w-fit transition-colors ${activeTab === tab
                                                ? 'border-b-[#14B8A6] text-[#5eead4]'
                                                : 'border-b-transparent text-[#8b949e] hover:text-[#e6edf3]'
                                                }`}
                                        >
                                            <span className="text-sm font-bold tracking-wide">{getTabLabel(tab)}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Search & Filter */}
                                <div className="flex flex-1 md:flex-initial items-center gap-3">
                                    <div className="relative flex-1 md:w-64">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-[#7d8590]">search</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="input-field"
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Search your mind..."
                                        />
                                    </div>
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-4 rounded-full bg-[#0d1117]/80 border border-white/10 text-[#e6edf3] text-sm font-medium shadow-sm hover:border-[#14B8A6] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all cursor-pointer appearance-none pr-8">
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="done">Done</option>
                                    </select>
                                    {activeTab !== 'All' && (
                                        <select value={subcategoryFilter} onChange={e => setSubcategoryFilter(e.target.value)} className="h-10 px-4 rounded-full bg-[#0d1117]/80 border border-white/10 text-[#e6edf3] text-sm font-medium shadow-sm hover:border-[#14B8A6] focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20 transition-all cursor-pointer appearance-none pr-8 hidden sm:block capitalize">
                                            <option value="all">All Types</option>
                                            {getSubcategories(activeTab).map(sub => (
                                                <option key={sub} value={sub} className="capitalize">{sub}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-[1400px] h-full mx-auto">
                        {viewMode === 'graph' ? (
                            <div className="h-full min-h-[600px] w-full pt-2">
                                <KnowledgeGraph
                                    onEditItem={(node) => {
                                        const matchedItem = allItems.find((i) => i.id === node.id);
                                        if (matchedItem) handleEdit(matchedItem);
                                    }}
                                />
                            </div>
                        ) : loading ? (
                            <div className="text-center py-16 text-[#8b949e]">Loading...</div>
                        ) : error ? (
                            <div className="text-center py-16 text-red-500">{error}</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-16">
                                <span className="material-symbols-outlined text-[#5eead4] text-5xl mb-4">database</span>
                                <p className="text-[#8b949e] mb-2">No items found</p>
                                <a href="/chat" className="text-[#14B8A6] text-sm hover:underline">Add items via AI Assistant →</a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                                {filteredItems.map(item => {
                                    const colors = getCategoryColor(item.category);
                                    return (
                                        <div key={item.id} className="premium-card hover-glow group relative flex flex-col justify-between transition-all duration-300 min-h-[180px] overflow-hidden">
                                            {/* Color Strip */}
                                            <div className="h-1.5 w-full" style={{ backgroundColor: colors.strip }}></div>

                                            {/* Hover Actions */}
                                            <div className="absolute top-6 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(item)} className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-[#8b949e] hover:text-[#e6edf3]">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item)} className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/15 text-[#8b949e] hover:text-red-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-3 p-5 pt-4">
                                                <div className="flex items-start gap-3 pr-16">
                                                    <button onClick={() => handleToggleComplete(item)} className={`checkbox ${item.status === 'done' ? 'checked' : ''}`}>
                                                        {item.status === 'done' && <Check size={14} />}
                                                    </button>
                                                    <p className={`text-[#e6edf3] font-bold leading-tight ${item.status === 'done' ? 'line-through !text-[#7d8590]' : ''}`}>
                                                        {item.title}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text} capitalize`}>
                                                        {item.category}
                                                    </span>
                                                    {item.subcategory && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-[#8b949e] capitalize">
                                                            {getSubcategoryLabel(item.subcategory)}
                                                        </span>
                                                    )}
                                                    {item.life_area && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-[#8b949e]">
                                                            {item.life_area}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                                                {item.deadline ? (
                                                    <div className="flex items-center gap-1.5 text-orange-500">
                                                        <Clock size={14} />
                                                        <span className="text-xs font-medium">{new Date(item.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-[#7d8590]">
                                                        <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                                                        <span className="text-xs font-medium">No Date</span>
                                                    </div>
                                                )}
                                                {item.priority && item.priority > 7 && (
                                                    <span className="material-symbols-outlined text-purple-500 text-[20px]">auto_awesome</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyLifeDatabase;
