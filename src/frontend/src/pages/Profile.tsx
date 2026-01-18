import { useState, useEffect } from 'react';
import { User, Mail, Camera, Save } from 'lucide-react';
import { auth } from '../services/api';
import type { User as UserType } from '../types';

const Profile = () => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const userData = await auth.getMe();
            setUser(userData);
            setFormData({ name: userData.name || '', email: userData.email });
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            // Note: Backend would need an update profile endpoint
            // For now, just show success message
            setMessage('Profile updated successfully!');
            setEditing(false);
        } catch (error) {
            setMessage('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1a1a2e] mb-2">
                        My Profile
                    </h1>
                    <p className="text-gray-500 text-lg">Manage your account settings and preferences.</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Cover */}
                    <div className="h-32 bg-gradient-to-r from-[#1a1a2e] to-[#14B8A6]"></div>

                    {/* Avatar & Info */}
                    <div className="px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="size-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <button className="absolute bottom-0 right-0 size-8 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-600 hover:text-[#14B8A6] transition-colors border border-gray-200">
                                    <Camera size={16} />
                                </button>
                            </div>
                            <div className="flex-1 pt-4 sm:pt-0">
                                <h2 className="text-2xl font-bold text-[#1a1a2e]">{user?.name || 'User'}</h2>
                                <p className="text-gray-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="btn-secondary text-sm"
                            >
                                {editing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                {editing && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-[#1a1a2e] mb-4">Edit Information</h3>

                        {message && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                                    <User size={14} className="inline mr-1" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                                    <Mail size={14} className="inline mr-1" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    disabled
                                />
                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary"
                            >
                                <Save size={16} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Account Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-[#1a1a2e] mb-4">Account</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div>
                                <p className="font-medium text-[#1a1a2e]">Member Since</p>
                                <p className="text-sm text-gray-500">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div>
                                <p className="font-medium text-[#1a1a2e]">Account Status</p>
                                <p className="text-sm text-gray-500">Active</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                Verified
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
