import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import {
  User, Clock, MapPin, ChevronDown, ChevronUp, Camera,
  Loader2, Filter, Calendar, CheckCircle2, AlertCircle
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
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/attendance`, {
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

  const filteredRecords = records.filter(r => r.login_timestamp.startsWith(dateFilter));

  // World-Class Metric: Calculate Total Work Hours
  const calculateDuration = (login: string, logout: string | null) => {
    if (!logout) return "Still Active";
    const diff = new Date(logout).getTime() - new Date(login).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Attendance & Integrity</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Biometric & Geospatial Field Verification</p>
        </div>

        <div className="flex gap-4">
           <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input
                type="date"
                className="pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-ashoka/20 focus:border-ashoka font-bold"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2/></div>
           <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Present Today</p>
              <p className="text-2xl font-black text-gray-800">{filteredRecords.length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-saffron/10 text-saffron rounded-full flex items-center justify-center"><Clock/></div>
           <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Avg. Shift Duration</p>
              <p className="text-2xl font-black text-gray-800">7h 45m</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="w-12 h-12 bg-navy/5 text-navy rounded-full flex items-center justify-center"><MapPin/></div>
           <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Field Coverage</p>
              <p className="text-2xl font-black text-gray-800">Active</p>
           </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <th className="px-6 py-4">Surveyor</th>
              <th className="px-6 py-4">Login Time</th>
              <th className="px-6 py-4">Logout Time</th>
              <th className="px-6 py-4">Total Duration</th>
              <th className="px-6 py-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRecords.map((r) => (
              <>
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50 cursor-pointer transition-all ${expandedId === r.id ? 'bg-navy/[0.02]' : ''}`}
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                          {r.user.name[0]}
                       </div>
                       <div>
                          <p className="font-bold text-gray-800 text-sm">{r.user.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{r.device.device_identifier}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-navy">{new Date(r.login_timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-500">
                    {r.logout_timestamp ? new Date(r.logout_timestamp).toLocaleTimeString() : '---'}
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-ashoka uppercase">
                    {calculateDuration(r.login_timestamp, r.logout_timestamp)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end">
                       {expandedId === r.id ? <ChevronUp size={20} className="text-saffron"/> : <ChevronDown size={20} className="text-gray-300"/>}
                    </div>
                  </td>
                </tr>

                {/* Expandable Section */}
                {expandedId === r.id && (
                  <tr className="bg-gray-50/50">
                    <td colSpan={5} className="p-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-top duration-300">
                          {/* Left: Identity Verification */}
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Camera size={14} className="text-saffron"/> Login Selfie Verification
                             </h4>
                             <div className="w-full h-64 bg-gray-200 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                                {r.selfie_photo_url ? (
                                  <img src={`${API_URL}${r.selfie_photo_url}`} alt="Selfie" className="w-full h-full object-cover"/>
                                ) : (
                                  <p className="text-gray-400 text-xs italic">No photo captured for this session</p>
                                )}
                             </div>
                          </div>

                          {/* Right: Geospatial Verification */}
                          <div>
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MapPin size={14} className="text-ashoka"/> Deployment Location
                             </h4>
                             <div className="w-full h-64 bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center justify-center text-center shadow-sm">
                                <div className="w-16 h-16 bg-ashoka/10 text-ashoka rounded-full flex items-center justify-center mb-4">
                                   <MapPin size={32}/>
                                </div>
                                <p className="text-sm font-bold text-gray-700">Geographic Check-In Point</p>
                                <p className="text-xs text-gray-400 mt-1 mb-6">{r.gps_lat}, {r.gps_lng}</p>
                                <a
                                  href={`https://maps.google.com/?q=${r.gps_lat},${r.gps_lng}`}
                                  target="_blank" rel="noreferrer"
                                  className="bg-navy text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-900 transition-all shadow-md"
                                >
                                   Inspect on Satellite Map
                                </a>
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="p-20 text-center text-gray-400 italic">No attendance data found for this date.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
