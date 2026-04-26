import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import AppLayout from '../components/layout/AppLayout';

const Onboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Placeholder state for profile data
    const [profile, setProfile] = useState({
        occupation: '',
        goals: '',
        personality: ''
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else handleSubmit();
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await auth.updateProfile({
                occupation: profile.occupation,
                // Backend expects Dict[str, str], so simplified for now, or we can just send strings if backend schema allows.
                // Looking at UserProfile schema: goals: Dict[str, str], personality: Dict[str, str].
                // We need to map the string input to a dictionary format or update backend schema.
                // For MVP simplicity, let's assume we store the main text as "main" key.
                goals: { main: profile.goals },
                personality: { main: profile.personality }
            });
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to update profile:', error);
            // Optionally show error state
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-[#e6edf3]">
            <div className="premium-card max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <img src="/logo.png" alt="Logo" className="mx-auto h-12 w-12 object-contain" />
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#5eead4]">Digital Twin Setup</p>
                    <h2 className="mt-2 text-3xl font-extrabold neon-gradient-text">
                        Setup your Digital Twin
                    </h2>
                    <p className="mt-2 text-sm text-[#8b949e]">
                        Step {step} of 3
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#0d1117] rounded-full h-2.5 border border-white/10 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[#14B8A6] to-[#8b5cf6] h-2.5 rounded-full transition-all duration-300 shadow-[0_0_18px_rgba(20,184,166,0.45)]"
                        style={{ width: `${(step / 3) * 100}%` }}
                    ></div>
                </div>

                <div className="mt-8 space-y-6">
                    {step === 1 && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg font-medium text-[#f0f6fc] mb-4">What do you do?</h3>
                            <input
                                type="text"
                                className="input-field block w-full py-3 sm:text-sm sm:leading-6"
                                placeholder="e.g. Student, Software Engineer, Artist"
                                value={profile.occupation}
                                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg font-medium text-[#f0f6fc] mb-4">What are your main goals?</h3>
                            <textarea
                                rows={4}
                                className="input-field block w-full py-3 sm:text-sm sm:leading-6"
                                placeholder="e.g. Finish thesis, Run a marathon, Learn Japanese"
                                value={profile.goals}
                                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                            />
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-fade-in">
                            <h3 className="text-lg font-medium text-[#f0f6fc] mb-4">How would you describe yourself?</h3>
                            <textarea
                                rows={4}
                                className="input-field block w-full py-3 sm:text-sm sm:leading-6"
                                placeholder="e.g. I'm organized but procrastinate on big tasks. I'm a night owl."
                                value={profile.personality}
                                onChange={(e) => setProfile({ ...profile, personality: e.target.value })}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className="premium-button w-full flex justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-[#14B8A6] disabled:opacity-50 transition-all"
                    >
                        {loading ? 'Finalizing...' : (step === 3 ? 'Complete Setup' : 'Next Step')}
                    </button>
                </div>
            </div>
        </div>
        </AppLayout>
    );
};

export default Onboarding;
