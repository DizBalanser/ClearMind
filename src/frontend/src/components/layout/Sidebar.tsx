import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { auth } from '../../services/api';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'AI Assistant', href: '/chat', icon: 'smart_toy' },
    { name: 'Database', href: '/database', icon: 'database' },
    { name: 'Schedule', href: '/schedule', icon: 'calendar_month' },
    { name: 'AI Memory', href: '/profile', icon: 'psychology_alt' },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
    const location = useLocation();
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await auth.getMe();
                setUserName(user.name || 'User');
            } catch {
                console.error('Failed to fetch user');
            }
        };
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    if (isCollapsed) return null;

    return (
        <aside className="premium-glass hidden md:flex w-72 flex-col h-full text-white shrink-0 relative border-r border-white/10">
            {/* Collapse Button */}
            <button
                onClick={onToggle}
                className="hover-glow absolute -right-3 top-8 z-10 size-6 rounded-full border border-[#14B8A6]/35 bg-[#0d1117]/90 flex items-center justify-center text-[#8b949e] hover:text-white transition-colors shadow-md"
            >
                <ChevronLeft size={14} />
            </button>

            <div className="p-6 pb-2">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <img src="/logo.png" alt="ClearMind" className="size-10 rounded-xl shadow-lg" />
                    <div>
                        <h1 className="text-lg font-bold leading-none tracking-tight">ClearMind</h1>
                        <p className="text-[#7d8590] text-xs mt-1">AI Command Center</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`hover-glow flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                                    ? 'border border-[#14B8A6]/35 bg-[#14B8A6]/15 text-[#5eead4] shadow-[0_0_24px_rgba(20,184,166,0.12)]'
                                    : 'border border-transparent text-[#8b949e] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Section */}
            <div className="mt-auto p-6 border-t border-white/10">
                <Link
                    to="/profile"
                    className="hover-glow flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                >
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col flex-1">
                        <span className="text-sm font-medium">{userName}</span>
                        <span className="text-xs text-slate-400">View Profile</span>
                    </div>
                </Link>
                <button
                    onClick={handleLogout}
                    className="hover-glow w-full mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#8b949e] hover:text-red-400 hover:bg-white/5 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sign out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
