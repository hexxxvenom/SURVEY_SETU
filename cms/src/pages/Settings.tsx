import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { User, Lock, Save, CheckCircle, Loader2, Layout, AlertCircle } from 'lucide-react';

export const Settings = () => {
  const { token, role, name: authName } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, configRes] = await Promise.all([
            axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_URL}/config/app-branding`).catch(() => ({ data: { title: "SurveySetu Login" } }))
        ]);
        setProfile(meRes.data);
        setAppTitle(configRes.data?.title || "SurveySetu Login");
      } catch (err) {
        console.error("Fetch failed", err);
        if (authName) {
            setProfile({ name: authName, username: "superadmin", role: role, status: "ACTIVE" });
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, API_URL, role, authName]);

  const handleUpdateBranding = async () => {
      setMessage("");
      try {
          await axios.post(`${API_URL}/config/app-branding`, { title: appTitle }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setMessage("App branding updated! The mobile login screen has been rebranded.");
          setTimeout(() => setMessage(""), 5000);
      } catch (err) {
          setMessage("Branding update failed");
      }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post(`${API_URL}/auth/change-password`, { newPassword }, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Password updated successfully!");
      setNewPassword("");
      setTimeout(() => setMessage(""), 5000);
    } catch (err: any) {
      setMessage("Failed to update password");
    }
  };

  if (loading || !profile) {
    return (
        <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-navy mb-4" size={48}/>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Synchronizing Security Environment...</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <h1 className="text-3xl font-black text-navy uppercase tracking-tighter italic">System Control Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Profile */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-navy"><User className="text-saffron" size={20}/> Administrator Profile</h3>
            <div className="space-y-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authenticated Name</p>
                    <p className="font-black text-navy">{profile.name || "System Admin"}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Access Principal</p>
                    <p className="font-bold text-gray-600">{profile.username || "superadmin"}</p>
                </div>

                <div className="pt-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Security Credential Update</h4>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-saffron font-bold text-navy transition-all"
                            placeholder="Enter new master secret..."
                        />
                        <button className="w-full bg-navy text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-blue-900 active:scale-95 transition-all">
                            Rotate Access Key
                        </button>
                    </form>
                </div>
            </div>
          </div>

          {/* App Branding */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-navy"><Layout className="text-ashoka" size={20}/> Mobile App Branding</h3>
            <div className="space-y-6">
                <div className="bg-ashoka/5 p-4 rounded-xl border border-ashoka/10">
                    <p className="text-[10px] text-ashoka font-black uppercase leading-relaxed">
                        Notice: Changing this title will instantly update the login screen for all active field surveyors.
                    </p>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Android Login Title</label>
                    <input
                      className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-ashoka font-black text-navy"
                      value={appTitle}
                      onChange={e => setAppTitle(e.target.value)}
                      placeholder="e.g. My Organization Login"
                    />
                </div>
                <button
                    onClick={handleUpdateBranding}
                    className="w-full bg-ashoka text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                   <Save size={16}/> Broadcast New Branding
                </button>
            </div>
          </div>
      </div>

      {message && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl animate-bounce z-50 flex items-center gap-2 ${message.includes('failed') ? 'bg-red-600' : 'bg-green-600'} text-white`}>
              {message.includes('failed') ? <AlertCircle size={16}/> : <CheckCircle size={16}/>} {message}
          </div>
      )}
    </div>
  );
};
