import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import {
  Download, User, Phone, MapPin, Eye, Search,
  Calendar, Filter, Smartphone, ChevronRight, ArrowLeft, Loader2, RefreshCw
} from 'lucide-react';

interface ResponseData {
  id: string;
  respondent_name: string;
  respondent_contact: string;
  gps_lat: number;
  gps_lng: number;
  submitted_at: string;
  survey: { title: string };
  surveyor: { name: string; username: string };
  device: { device_identifier: string; device_name: string };
  answers: Array<{ question: { question_text: string }, selectedOption: { option_text: string } }>;
}

export const Responses = () => {
  const [allResponses, setAllResponses] = useState<ResponseData[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { token } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/responses?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllResponses(res.data.data || []);
      setFilteredResponses(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch responses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [token, API_URL]);

  useEffect(() => {
    let result = allResponses;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.surveyor.username.toLowerCase().includes(q) ||
        r.device.device_identifier.toLowerCase().includes(q) ||
        r.respondent_name?.toLowerCase().includes(q)
      );
    }
    if (dateFilter) result = result.filter(r => r.submitted_at.startsWith(dateFilter));
    if (selectedUser) result = result.filter(r => r.surveyor.username === selectedUser);
    setFilteredResponses(result);
  }, [searchQuery, dateFilter, selectedUser, allResponses]);

  const uniqueUsers = Array.from(new Set(allResponses.map(r => r.surveyor.username)));

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="animate-spin text-navy mb-4" size={48}/>
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Fetching Real-Time Field Submissions...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      {!selectedResponse && (
        <div className="no-print">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Field Intelligence</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Real-Time Surveyor Data Stream</p>
            </div>

            <div className="flex gap-3">
               <button onClick={fetchResponses} className="p-2 bg-navy/5 text-navy rounded-xl hover:bg-navy hover:text-white transition-all"><RefreshCw size={20}/></button>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                  <input type="text" placeholder="Search Surveyor / Device..." className="pl-10 pr-4 py-2 border rounded-xl text-sm outline-none w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
               </div>
               <input type="date" className="px-4 py-2 border rounded-xl text-sm outline-none" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}/>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
             <button onClick={() => setSelectedUser(null)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${!selectedUser ? 'bg-navy text-white' : 'bg-white text-gray-400 border-gray-100 hover:border-navy'}`}>All Field Staff</button>
             {uniqueUsers.map(user => (
               <button key={user} onClick={() => setSelectedUser(user)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${selectedUser === user ? 'bg-saffron text-white border-saffron shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-saffron'}`}>
                  <User size={10}/> {user}
               </button>
             ))}
          </div>
        </div>
      )}

      {!selectedResponse ? (
        <div className="grid grid-cols-1 gap-4 no-print">
          {filteredResponses.map((r) => (
            <div key={r.id} onClick={() => setSelectedResponse(r)} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-saffron/30 cursor-pointer transition-all group flex justify-between items-center">
              <div className="flex gap-6 items-center">
                 <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center font-black">{r.surveyor.username[0].toUpperCase()}</div>
                 <div>
                    <h3 className="font-black text-navy group-hover:text-saffron transition-colors">{r.respondent_name || 'Anonymous'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Phone size={10}/> {r.respondent_contact}</span>
                       <span className="text-[10px] font-bold text-ashoka uppercase flex items-center gap-1"><Smartphone size={10}/> {r.device.device_name || r.device.device_identifier}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(r.submitted_at).toLocaleString()}</span>
                    </div>
                 </div>
              </div>
              <ChevronRight className="text-gray-200 group-hover:text-saffron transition-all" size={24}/>
            </div>
          ))}
          {filteredResponses.length === 0 && <div className="py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100 text-gray-300 font-black uppercase tracking-widest">Zero field entries found</div>}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-center mb-8 no-print">
              <button onClick={() => setSelectedResponse(null)} className="flex items-center gap-2 text-gray-400 font-black uppercase text-xs hover:text-navy transition-colors"><ArrowLeft size={16}/> Back to Intelligence Stream</button>
              <button onClick={handlePrint} className="bg-navy text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2"><Download size={16}/> Print Official Record</button>
           </div>

           <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 printable-area p-12">
              <div className="border-b-4 border-saffron pb-8 mb-10 text-center">
                 <h1 className="text-3xl font-black text-navy uppercase tracking-widest">SurveySetu Official Submission</h1>
                 <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Authenticated Digital Response Log</p>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                 <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Field Subject</h4>
                    <p className="font-black text-navy text-xl">{selectedResponse.respondent_name}</p>
                    <p className="text-gray-500 text-xs font-bold mt-1">{selectedResponse.respondent_contact}</p>
                 </div>
                 <div className="text-right">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Surveyor & Hardware</h4>
                    <p className="font-black text-gray-800 text-sm uppercase">{selectedResponse.surveyor.name}</p>
                    <p className="text-ashoka text-[10px] font-black mt-1 uppercase flex items-center justify-end gap-1"><Smartphone size={10}/> {selectedResponse.device.device_name || selectedResponse.device.device_identifier}</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center gap-3"><div className="w-8 h-1 bg-saffron rounded-full"/> Question Dataset</h4>
                 <div className="grid grid-cols-1 gap-6">
                    {selectedResponse.answers.map((a, i) => (
                      <div key={i} className="flex gap-6 items-start bg-gray-50/30 p-5 rounded-2xl border border-gray-50">
                         <span className="text-gray-300 text-2xl font-black italic">{(i+1).toString().padStart(2, '0')}</span>
                         <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 leading-tight">{a.question.question_text}</p>
                            <p className="text-navy font-black text-lg italic tracking-tight">"{a.selectedOption.option_text}"</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-20 pt-8 border-t border-dashed opacity-40 flex justify-between items-end">
                 <p className="text-[8px] font-bold uppercase tracking-widest">Authenticated by SurveySetu Cloud Engine • {new Date(selectedResponse.submitted_at).toLocaleString()}</p>
                 <div className="flex gap-2"><div className="w-2 h-2 rounded-full bg-saffron"/><div className="w-2 h-2 rounded-full bg-ashoka"/><div className="w-2 h-2 rounded-full bg-navy"/></div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
