import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AuthModal from '../components/auth/AuthModal';

const LandingPage = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authView, setAuthView] = useState<'login' | 'register'>('login');

    const openAuth = (view: 'login' | 'register') => {
        setAuthView(view);
        setIsAuthOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialView={authView}
            />

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="ClearMind" className="size-8 rounded-lg shadow-md" />
                            <span className="text-xl font-bold tracking-tight text-[#1a1a2e]">ClearMind</span>
                        </div>
                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a className="text-sm font-medium text-gray-600 hover:text-[#1a1a2e] transition-colors" href="#features">Features</a>
                            <a className="text-sm font-medium text-gray-600 hover:text-[#1a1a2e] transition-colors" href="#">Pricing</a>
                            <a className="text-sm font-medium text-gray-600 hover:text-[#1a1a2e] transition-colors" href="#">About</a>
                        </div>
                        {/* CTA Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => openAuth('login')}
                                className="hidden sm:flex text-sm font-semibold text-[#1a1a2e] hover:opacity-80 transition-opacity"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => openAuth('register')}
                                className="btn-teal"
                            >
                                Get Started Free
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-20">
                <section className="relative pt-20 pb-32 overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#1a1a2e]/5 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
                            {/* Beta Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm mb-4">
                                <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beta Access Open</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#1a1a2e] leading-[1.1]">
                                Organize your thoughts <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a1a2e] to-[#14B8A6]">with clarity.</span>
                            </h1>

                            <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
                                A web-based productivity tool that helps you capture, classify, and manage your tasks, ideas, and reflections using AI-assisted organization.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
                                <button
                                    onClick={() => openAuth('register')}
                                    className="w-full sm:w-auto h-12 px-8 rounded-lg bg-[#14B8A6] text-white text-base font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:scale-[1.02] transition-all duration-200"
                                >
                                    Get Started Free
                                </button>
                                <button
                                    onClick={() => openAuth('login')}
                                    className="w-full sm:w-auto h-12 px-8 rounded-lg bg-white border border-gray-200 text-[#1a1a2e] text-base font-bold shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>

                        {/* App Preview */}
                        <div className="mt-20 relative max-w-5xl mx-auto">
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 bg-white aspect-[16/9] relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50 z-0"></div>
                                <div className="w-full h-full bg-gradient-to-br from-[#f6f6f7] to-white flex items-center justify-center">
                                    <span className="text-gray-400 text-lg">Dashboard Preview</span>
                                </div>

                                {/* Floating Glass Card 1 */}
                                <div className="absolute top-12 left-12 w-64 glass-panel p-4 rounded-lg shadow-lg transform transition-transform group-hover:-translate-y-2 duration-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="material-symbols-outlined text-[#14B8A6]">auto_awesome</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase">AI Insight</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800">Meeting rescheduled. Deep work block suggested for 2 PM.</p>
                                </div>

                                {/* Floating Glass Card 2 */}
                                <div className="absolute bottom-12 right-12 w-56 glass-panel p-4 rounded-lg shadow-lg transform transition-transform group-hover:translate-y-2 duration-500 delay-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-[#1a1a2e]">Project Alpha</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">On Track</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-[#14B8A6] h-full w-3/4 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1a2e] mb-4">Intelligent Features</h2>
                            <p className="text-lg text-gray-500">Everything you need to clear your mind and focus on what matters most.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-blue-600 text-3xl">psychology</span>
                                </div>
                                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">AI-Assisted Classification</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Submit free-form text and receive structured suggestions for categorization. Review and approve classifications before saving.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-[#14B8A6] text-3xl">database</span>
                                </div>
                                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">Structured Database</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    All your entries are stored in a searchable, filterable database organized by category, status, and priority.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="material-symbols-outlined text-purple-600 text-3xl">bolt</span>
                                </div>
                                <h3 className="text-xl font-bold text-[#1a1a2e] mb-3">Priority Management</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    View and manage items by priority level. Mark tasks complete and track progress through your personal workflow.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Project Info Section */}
                <section className="py-16 border-t border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">Bachelor's Thesis Project</p>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            This application was developed as part of a Bachelor's thesis to explore AI-assisted productivity tools.
                        </p>
                    </div>
                </section>

                {/* CTA Banner */}
                <section className="py-20 px-4">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-[#1a1a2e] text-white overflow-hidden relative shadow-2xl">
                        {/* Decorative Circle */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#14B8A6] rounded-full opacity-20 blur-3xl"></div>
                        <div className="relative z-10 px-8 py-16 md:px-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-xl">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get organized?</h2>
                                <p className="text-gray-300 text-lg">Create an account to start capturing and organizing your thoughts, tasks, and ideas.</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => openAuth('register')}
                                    className="h-12 px-8 rounded-lg bg-white text-[#1a1a2e] text-base font-bold shadow-lg hover:bg-gray-100 transition-colors w-full md:w-auto whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    Create Account <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        {/* Brand */}
                        <div className="col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" alt="ClearMind" className="size-6 rounded" />
                                <span className="text-lg font-bold text-[#1a1a2e]">ClearMind</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                A web-based productivity application for organizing tasks, ideas, and thoughts.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-bold text-[#1a1a2e] mb-4">Product</h4>
                            <ul className="space-y-2">
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Features</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Pricing</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Integrations</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Changelog</a></li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="font-bold text-[#1a1a2e] mb-4">Resources</h4>
                            <ul className="space-y-2">
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Documentation</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Community</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Webinars</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Blog</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-bold text-[#1a1a2e] mb-4">Company</h4>
                            <ul className="space-y-2">
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">About Us</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Careers</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Legal</a></li>
                                <li><a className="text-sm text-gray-500 hover:text-[#14B8A6] transition-colors" href="#">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">© 2026 ClearMind Inc. All rights reserved.</p>
                        <div className="flex gap-6">
                            <a className="text-sm text-gray-400 hover:text-[#1a1a2e] transition-colors" href="#">Privacy Policy</a>
                            <a className="text-sm text-gray-400 hover:text-[#1a1a2e] transition-colors" href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
