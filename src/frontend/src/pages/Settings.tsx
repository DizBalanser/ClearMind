const Settings = () => {
    return (
        <div className="max-w-4xl space-y-8">
            <h1 className="text-2xl font-bold text-primary">Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                <div className="p-6">
                    <h2 className="text-lg font-medium text-primary mb-1">Profile Information</h2>
                    <p className="text-sm text-secondary mb-4">Update your personal details and preferences.</p>

                    <button className="text-accent hover:text-accent/80 font-medium text-sm">
                        Edit Profile
                    </button>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-medium text-primary mb-1">Goals & Areas</h2>
                    <p className="text-sm text-secondary mb-4">Manage your long-term goals and life areas.</p>

                    <button className="text-accent hover:text-accent/80 font-medium text-sm">
                        Manage Goals
                    </button>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-medium text-primary mb-1">Appearance</h2>
                    <p className="text-sm text-secondary mb-4">Customize how ClearMind looks on your device.</p>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input type="radio" name="theme" defaultChecked className="text-accent focus:ring-accent" />
                            Light
                        </label>
                        <label className="flex items-center gap-2 text-sm text-primary">
                            <input type="radio" name="theme" className="text-accent focus:ring-accent" />
                            Dark
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
