import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { User, Lock, Save, CheckCircle, AlertCircle, Loader2, Layout } from 'lucide-react';

export const Settings = () => {
  const { token, role } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, configRes] = await Promise.all([
            axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/config/app-branding`)
        ]);
        setProfile(meRes.data);
        setAppTitle(configRes.data.title);
      } catch (err) {
        console.error("Fetch failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, API_URL]);

  const handleUpdateBranding = async () => {
      try {
          await axios.post(`${API_URL}/config/app-branding`, { title: appTitle }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setMessage("App branding updated!");
      } catch (err) {
          setMessage("Branding update failed");
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/change-password`, { newPassword }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Password updated successfully!");
      setNewPassword("");
    } catch (err: any) {
      setMessage("Failed to update password");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">System Administration</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile */}
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2"><User className="text-saffron"/> Admin Profile</h3>
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</p>
                    <p className="font-bold text-gray-800">{profile.name}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</p>
                    <p className="font-bold text-gray-800">{profile.username}</p>
                </div>
                <form onSubmit={handleChangePassword}>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-6">Change Password</label>
                    <div className="flex gap-2">
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          className="flex-1 border rounded-lg p-2 outline-none focus:border-saffron" placeholder="New Secret..."/>
                        <button className="bg-navy text-white px-4 py-2 rounded-lg font-bold">Update</button>
                    </div>
                </form>
            </div>
          </div>

          {/* App Branding (High Skill Feature) */}
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Layout className="text-ashoka"/> App Branding</h3>
            <div className="space-y-6">
                <p className="text-sm text-gray-500 italic">This will change the login title seen by surveyors on their phones in real-time.</p>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Android Login Title</label>
                    <input
                      className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-ashoka font-bold text-navy"
                      value={appTitle} onChange={e => setAppTitle(e.target.value)}
                    />
                </div>
                <button onClick={handleUpdateBranding} className="w-full bg-ashoka text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-md">
                   Sync Branding to Cloud
                </button>
            </div>
          </div>
      </div>

      {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 font-bold text-center animate-bounce">
              {message}
          </div>
      )}
    </div>
  );
};
