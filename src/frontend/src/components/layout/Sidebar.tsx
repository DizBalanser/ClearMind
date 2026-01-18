import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { auth } from '../../services/api';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'AI Assistant', href: '/chat', icon: 'smart_toy' },
    { name: 'Database', href: '/database', icon: 'database' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
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
            } catch (e) {
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
        <aside className="hidden md:flex w-72 flex-col bg-[#1a1a2e] h-full text-white shrink-0 relative">
            {/* Collapse Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-8 z-10 size-6 bg-[#1a1a2e] border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a40] transition-colors shadow-md"
            >
                <ChevronLeft size={14} />
            </button>

            <div className="p-6 pb-2">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <img src="/logo.png" alt="ClearMind" className="size-10 rounded-xl shadow-lg" />
                    <div>
                        <h1 className="text-lg font-bold leading-none tracking-tight">ClearMind</h1>
                        <p className="text-slate-400 text-xs mt-1">Personal Organizer</p>
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
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
            <div className="mt-auto p-6 border-t border-white/5">
                <Link
                    to="/profile"
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
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
                    className="w-full mt-3 flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Sign out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
