import type { ReactNode } from 'react';
import SpatialBackground from './SpatialBackground';

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    return (
        <div className="premium-shell relative min-h-screen overflow-hidden text-[#e6edf3]">
            <SpatialBackground />
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_10%,rgba(88,166,255,0.12),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(188,140,255,0.1),transparent_32%)]" />
            <div className="relative z-10 h-screen">{children}</div>
        </div>
    );
};

export default AppLayout;
