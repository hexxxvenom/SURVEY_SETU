import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { User, Lock, Save, CheckCircle } from 'lucide-react';

export const Settings = () => {
  const { token, role } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile");
      }
    };
    fetchMe();
  }, [token, API_URL]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/change-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password updated successfully!");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to update password");
    }
  };

  if (!profile) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-navy mb-8">System Settings</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-gray-500 flex items-center gap-1"><User size={14}/> {profile.username} • {profile.role}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded">
            <span className="text-gray-400 block mb-1">Status</span>
            <span className="font-bold text-green-600">{profile.status}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <span className="text-gray-400 block mb-1">Role Type</span>
            <span className="font-bold text-navy">{role}</span>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Lock size={20} className="text-saffron"/> Change Password</h3>

        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded p-3 focus:ring-2 focus:ring-saffron outline-none"
              placeholder="Enter minimum 6 characters"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded mb-4 text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <CheckCircle size={16}/> {message}
            </div>
          )}

          <button className="bg-navy text-white px-6 py-3 rounded font-bold flex items-center gap-2 hover:bg-blue-900 transition-colors">
            <Save size={18}/> Update Security Settings
          </button>
        </form>
      </div>
    </div>
  );
};
