import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';
import { Header } from '../../components/common/Header';
import { User, Building2, Lock, Check, AlertCircle } from 'lucide-react';
import { PASSWORD_MIN_LENGTH } from '@rsvp/shared';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setIsUpdatingProfile(true);

    try {
      await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, businessName }),
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mb-2">
          Account Settings
        </h1>
        <p className="text-sm text-stone-500 mb-8">
          Manage your planner profile and security credentials.
        </p>

        <div className="space-y-8">
          {/* Profile Form */}
          <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <User size={18} className="text-maroon-700" />
              <span>Organizer Profile</span>
            </h2>

            {profileError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Business / Agency Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Royal Wedding Planners"
                  className="w-full px-3.5 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2 border border-cream-200 bg-cream-50 rounded-xl text-stone-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Email address cannot be changed directly.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 rounded-2xl border border-cream-200 shadow-sm space-y-4">
            <h2 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Lock size={18} className="text-maroon-700" />
              <span>Security & Password</span>
            </h2>

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} />
                <span>Password changed successfully!</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  New Password (min {PASSWORD_MIN_LENGTH} characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-cream-300 rounded-xl focus:ring-2 focus:ring-maroon-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl bg-maroon-700 hover:bg-maroon-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
