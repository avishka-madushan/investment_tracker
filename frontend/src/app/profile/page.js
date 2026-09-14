'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/formatters';
import { User, Lock, AlertTriangle, Check, AlertCircle, Loader2, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setProfileSubmitting(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!newPassword || newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput !== 'DELETE') return;
    setDeleteSubmitting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error(err);
      alert('Failed to delete account.');
      setDeleteSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Profile & Settings</h1>
            <p className="text-sm text-white/50 mt-1">Manage your account details and security settings.</p>
          </div>

          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg border border-white/20">
            {user?.first_name ? user.first_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Personal Info & Password */}
          <div className="space-y-6">
            
            {/* Personal Info */}
            <div className="glass-card p-6">
              <h2 className="text-base font-semibold text-white mb-4">Personal Information</h2>

              {profileMsg.text && (
                <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full glass-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {profileSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="glass-card p-6">
              <h2 className="text-base font-semibold text-white mb-4">Security & Password</h2>

              {passwordMsg.text && (
                <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full glass-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {passwordSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Account Info & Danger Zone */}
          <div className="space-y-6">
            
            {/* Account Metadata */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-white mb-2">Account Details</h2>

              <div>
                <p className="text-xs text-white/40 uppercase font-semibold">Email Address</p>
                <p className="text-sm font-medium text-white mt-0.5">{user?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <p className="text-xs text-white/40 uppercase font-semibold">Account Created</p>
                  <p className="text-sm font-medium text-white/80 mt-0.5">{formatDate(user?.date_joined)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase font-semibold">Last Login</p>
                  <p className="text-sm font-medium text-white/80 mt-0.5">{formatDate(user?.last_login)}</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-red-500/20">
              <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
              <p className="text-xs text-white/50 mb-4">
                Permanently delete your account and all associated transactions, holdings, and cash records. This action cannot be undone.
              </p>

              <button
                onClick={() => setDeleteModalOpen(true)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>

          </div>

        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 border-red-500/30 animate-slide-up space-y-4">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Account Permanently</h3>
              </div>

              <p className="text-sm text-white/70">
                This will permanently remove your profile, trade history, portfolio holdings, and cash ledger records.
              </p>

              <p className="text-xs font-semibold text-white/90">
                Type <code className="bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">DELETE</code> to confirm:
              </p>

              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full glass-input text-sm"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmInput !== 'DELETE' || deleteSubmitting}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2"
                >
                  {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Permanently Delete</span>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
