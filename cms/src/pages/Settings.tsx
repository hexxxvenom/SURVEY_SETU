import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { User, Lock, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const Settings = () => {
  const { token, role } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err: any) {
        console.error("Failed to fetch profile", err);
        setError(err.response?.data?.error || "Connection to security server failed");
      }
    };
    if (token) fetchMe();
  }, [token, API_URL]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4"/>
        <h2 className="text-xl font-bold text-navy mb-2">Access Error</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-navy text-white px-6 py-2 rounded">Retry Connection</button>
      </div>
    );
  }

  if (!profile) return (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="animate-spin text-navy mb-4" size={48}/>
      <p className="text-gray-500 animate-pulse text-sm font-bold uppercase tracking-widest">Verifying Administrator Profile...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-navy mb-8">System Settings</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-navy to-ashoka rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {profile.name?.[0] || 'A'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            <p className="text-gray-500 flex items-center gap-1 text-sm"><User size={14}/> {profile.username} • <span className="text-saffron font-bold">{profile.role}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">Account Status</span>
            <span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle size={12}/> {profile.status}</span>
          </div>
          <div className="bg-gray-50 p-4 rounded border border-gray-100">
            <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px] tracking-wider">Environment</span>
            <span className="font-bold text-navy">{role === 'SUPER_ADMIN' ? 'PROD_ROOT' : 'STANDARD'}</span>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
          <Lock size={20} className="text-saffron"/> Security Credential Update
        </h3>

        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">New Account Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded p-3 focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all"
              placeholder="Minimum 6 characters recommended"
              required
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-4 text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message.includes('success') ? <CheckCircle size={16}/> : <AlertCircle size={16}/>} {message}
            </div>
          )}

          <button className="w-full md:w-auto bg-navy text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-all shadow-md active:scale-95">
            <Save size={18}/> Update Settings
          </button>
        </form>
      </div>
    </div>
  );
};
