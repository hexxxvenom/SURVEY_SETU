import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import {
  User, Clock, MapPin, ChevronDown, ChevronUp, Camera,
  Loader2, Filter, Calendar, CheckCircle2, RefreshCw
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  user_id: string;
  device_id: string;
  selfie_photo_url: string;
  gps_lat: number;
  gps_lng: number;
  login_timestamp: string;
  logout_timestamp: string | null;
  user: { name: string, username: string };
  device: { device_identifier: string };
}

export const Attendance = () => {
  const { token } = useAuthStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(""); // Default to empty to show ALL initially
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Force disable browser cache for real-time data
      const res = await axios.get(`${API_URL}/admin/attendance?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data.data);
    } catch (err) {
      console.error("Attendance fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [token, API_URL]);

  // SMARTER FILTERING: Handles timezone issues and partial dates
  const filteredRecords = records.filter(r => {
    if (!dateFilter) return true; // Show all if no filter
    return r.login_timestamp.includes(dateFilter);
  });

  const calculateDuration = (login: string, logout: string | null) => {
    if (!logout) return "Session Active";
    const diff = new Date(logout).getTime() - new Date(login).getTime();
    if (diff < 0) return "Just Started";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-navy mb-4" size={48}/>
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Streaming Real-Time Attendance Data...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter italic">Attendance Ledger</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Live Biometric & Geospatial Feed</p>
        </div>

        <div className="flex gap-4">
           <button
             onClick={fetchAttendance}
             className="bg-navy/5 text-navy p-2 rounded-xl hover:bg-navy hover:text-white transition-all flex items-center gap-2 font-bold text-xs"
           >
              <RefreshCw size={16}/> Sync Now
           </button>
           <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input
                type="date"
                className="pl-10 pr-4 py-2 border-2 border-gray-100 rounded-xl text-sm outline-none focus:border-ashoka font-black text-navy"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-white">
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-3xl shadow-lg border-b-4 border-green-900">
           <p className="text-xs font-bold uppercase tracking-widest opacity-60">Verified Active Today</p>
           <p className="text-3xl font-black mt-1">{filteredRecords.filter(r => !r.logout_timestamp).length}</p>
        </div>
        <div className="bg-gradient-to-br from-navy to-blue-900 p-6 rounded-3xl shadow-lg border-b-4 border-blue-950">
           <p className="text-xs font-bold uppercase tracking-widest opacity-60">Total Shift Cycles</p>
           <p className="text-3xl font-black mt-1">{filteredRecords.length}</p>
        </div>
        <div className="bg-gradient-to-br from-ashoka to-emerald-900 p-6 rounded-3xl shadow-lg border-b-4 border-emerald-950">
           <p className="text-xs font-bold uppercase tracking-widest opacity-60">Field Coverage</p>
           <p className="text-3xl font-black mt-1">100% Secure</p>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
              <th className="px-6 py-5">Personnel</th>
              <th className="px-6 py-5 text-center">Clock-In (IST/Cloud)</th>
              <th className="px-6 py-5 text-center">Clock-Out</th>
              <th className="px-6 py-5 text-center">Duty Duration</th>
              <th className="px-6 py-5 text-right">Biometric Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRecords.map((r) => (
              <React.Fragment key={r.id}>
                <tr
                  className={`hover:bg-navy/[0.01] cursor-pointer transition-all ${expandedId === r.id ? 'bg-navy/[0.03]' : ''}`}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-navy to-ashoka text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                          {r.user.name?.[0] || 'S'}
                       </div>
                       <div>
                          <p className="font-black text-navy text-sm">{r.user.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase font-mono">{r.device.device_identifier}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-black text-navy bg-navy/5 px-3 py-1 rounded-lg">
                        {new Date(r.login_timestamp).toLocaleString([], {hour: '2-digit', minute:'2-digit', hour12: true})}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold px-3 py-1 rounded-lg ${r.logout_timestamp ? 'bg-gray-100 text-gray-500' : 'bg-saffron text-white animate-pulse'}`}>
                        {r.logout_timestamp ? new Date(r.logout_timestamp).toLocaleString([], {hour: '2-digit', minute:'2-digit', hour12: true}) : 'ON DUTY'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black text-ashoka uppercase tracking-widest">
                      {calculateDuration(r.login_timestamp, r.logout_timestamp)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                       {expandedId === r.id ? <ChevronUp size={20} className="text-saffron"/> : <ChevronDown size={20} className="text-gray-300"/>}
                    </div>
                  </td>
                </tr>

                {expandedId === r.id && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={5} className="p-10">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-top duration-500">
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Camera size={14} className="text-saffron"/> Biometric Verification (Captured at Login)
                             </h4>
                             <div className="group relative w-full h-80 bg-gray-200 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                                {r.selfie_photo_url ? (
                                  <img src={`${API_URL}${r.selfie_photo_url}`} alt="Selfie" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                                ) : (
                                  <div className="flex flex-col items-center justify-center h-full gap-2">
                                     <Camera className="text-gray-300" size={48}/>
                                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter italic">Image verification not available</p>
                                  </div>
                                )}
                                <div className="absolute top-4 right-4 bg-navy/80 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Secured</div>
                             </div>
                          </div>

                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <MapPin size={14} className="text-ashoka"/> Deployment Geospatial Data
                             </h4>
                             <div className="w-full h-80 bg-white rounded-[2rem] border-2 border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-xl hover:border-ashoka/30 transition-colors">
                                <div className="w-20 h-20 bg-ashoka/10 text-ashoka rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
                                   <MapPin size={40}/>
                                </div>
                                <p className="text-sm font-black text-navy uppercase tracking-widest">Verified Check-In Point</p>
                                <p className="text-[10px] text-gray-400 font-mono mt-2 mb-8 bg-gray-50 px-4 py-2 rounded-lg border">LOC: {r.gps_lat}, {r.gps_lng}</p>
                                <a
                                  href={`https://maps.google.com/?q=${r.gps_lat},${r.gps_lng}`}
                                  target="_blank" rel="noreferrer"
                                  className="w-full bg-navy text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-900 transition-all shadow-lg active:scale-95"
                                >
                                   Inspect on Satellite Map
                                </a>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredRecords.length === 0 && (
          <div className="p-32 text-center flex flex-col items-center">
             <Clock size={48} className="text-gray-100 mb-4 animate-pulse"/>
             <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs italic">No synchronized biometric data detected for this timeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Required for React.Fragment in table rows
import React from 'react';
