import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { X, ArrowRight } from 'lucide-react';
import { auth } from '../../services/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView: 'login' | 'register';
}

const AuthModal = ({ isOpen, onClose, initialView }: AuthModalProps) => {
    const navigate = useNavigate();
    const [view, setView] = useState<'login' | 'register'>(initialView);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setError('');
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            setShowPassword(false);
        }
    }, [isOpen, initialView]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateForm = (): string | null => {
        if (view === 'register') {
            if (formData.name.trim().length < 2) return 'Name must be at least 2 characters';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) return 'Please enter a valid email address';
            if (formData.password.length < 8) return 'Password must be at least 8 characters';
            if (!/[A-Z]/.test(formData.password)) return 'Password must contain at least one uppercase letter';
            if (!/[0-9]/.test(formData.password)) return 'Password must contain at least one number';
            if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        }
        return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            if (view === 'register') {
                await auth.register({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name
                });
                const response = await auth.login(formData.email, formData.password);
                localStorage.setItem('token', response.access_token);
                navigate('/onboarding');
            } else {
                const response = await auth.login(formData.email, formData.password);
                localStorage.setItem('token', response.access_token);
                navigate('/dashboard');
            }
            onClose();
        } catch (err: any) {
            let errorMessage = 'Authentication failed';
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 modal-backdrop" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(26, 26, 46, 0.4)' }} aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="relative w-full max-w-[440px] transform overflow-hidden rounded-lg bg-white shadow-2xl border border-white/20 animate-fade-in">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Header / Logo */}
                    <div className="flex flex-col items-center pt-8 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[#14B8A6] text-3xl">psychology</span>
                            <h1 className="text-xl font-bold tracking-tight text-[#1a1a2e]">ClearMind</h1>
                        </div>
                        <p className="text-sm text-gray-500">Your digital twin for productivity</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="px-8 pb-4">
                        <div className="flex p-1 bg-gray-100 rounded-xl relative">
                            <button
                                onClick={() => { setView('login'); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${view === 'login'
                                    ? 'bg-white text-[#1a1a2e] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => { setView('register'); setError(''); }}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${view === 'register'
                                    ? 'bg-white text-[#1a1a2e] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Register
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="px-8 pb-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            {error && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-100">
                                    {error}
                                </div>
                            )}

                            {view === 'register' && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-[#1a1a2e]">Full Name</label>
                                    <input
                                        name="name"
                                        type="text"
                                        placeholder="John Doe"
                                        required
                                        className="input-field"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-[#1a1a2e]">Email address</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    className="input-field"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-[#1a1a2e]">Password</label>
                                    {view === 'login' && (
                                        <a className="text-xs font-medium text-[#14B8A6] hover:text-[#14B8A6]/80 transition-colors" href="#">
                                            Forgot Password?
                                        </a>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        required
                                        className="input-field pr-10"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer text-gray-400 hover:text-gray-600"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                                {view === 'register' && (
                                    <p className="text-xs text-gray-500 mt-1">Min 8 chars, 1 uppercase, 1 number</p>
                                )}
                            </div>

                            {view === 'register' && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-[#1a1a2e]">Confirm Password</label>
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        required
                                        className="input-field"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-2 w-full flex justify-center items-center gap-2 rounded-lg bg-[#1a1a2e] hover:bg-[#2a2a40] py-3 px-4 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative mt-8 mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-3 text-xs text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Logins */}
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                                GitHub
                            </button>
                        </div>

                        {/* Footer */}
                        <p className="mt-8 text-center text-xs text-gray-500">
                            By continuing, you agree to our{' '}
                            <a className="font-medium text-[#14B8A6] hover:underline" href="#">Terms of Service</a>
                            {' '}and{' '}
                            <a className="font-medium text-[#14B8A6] hover:underline" href="#">Privacy Policy</a>.
                        </p>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default AuthModal;
