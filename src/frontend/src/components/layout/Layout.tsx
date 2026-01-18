import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';
import { auth } from '../../services/api';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved ? JSON.parse(saved) : false;
    });
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

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

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f6f6f7]">
            {/* Sidebar */}
            <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Nav Bar - visible when sidebar is collapsed */}
                {sidebarCollapsed && (
                    <TopNavBar onMenuClick={toggleSidebar} userName={userName} />
                )}

                <main className="flex-1 flex flex-col overflow-hidden relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
