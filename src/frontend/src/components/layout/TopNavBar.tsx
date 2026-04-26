import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface TopNavBarProps {
    onMenuClick: () => void;
    userName: string;
}

const TopNavBar = ({ onMenuClick, userName }: TopNavBarProps) => {
    return (
        <header className="premium-glass sticky top-0 z-50 w-full border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
                <div className="flex items-center gap-6">
                    {/* Menu Toggle */}
                    <button
                        onClick={onMenuClick}
                        className="hover-glow flex items-center justify-center size-10 rounded-xl text-[#8b949e] hover:text-white transition-colors"
                    >
                        <Menu size={22} />
                    </button>

                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <img src="/logo.png" alt="ClearMind" className="size-9 rounded-xl shadow-md" />
                        <h2 className="neon-gradient-text text-xl font-bold tracking-tight hidden sm:block">ClearMind</h2>
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Profile Avatar */}
                    <Link
                        to="/profile"
                        className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md border-2 border-white cursor-pointer hover:scale-105 transition-transform"
                    >
                        {userName.charAt(0).toUpperCase()}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default TopNavBar;

