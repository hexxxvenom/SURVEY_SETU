import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import {
  Download, User, Phone, MapPin, Eye, Search,
  Calendar, Filter, Smartphone, ChevronRight, ArrowLeft, Loader2
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
  device: { device_identifier: string };
  answers: Array<{ question: { question_text: string }, selectedOption: { option_text: string } }>;
}

export const Responses = () => {
  const [allResponses, setAllResponses] = useState<ResponseData[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { token } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchResponses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/admin/responses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllResponses(res.data.data);
        setFilteredResponses(res.data.data);
      } catch (err) {
        console.error("Failed to fetch responses");
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [token, API_URL]);

  // Handle Filtering Logic
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

    if (dateFilter) {
      result = result.filter(r => r.submitted_at.startsWith(dateFilter));
    }

    if (selectedUser) {
      result = result.filter(r => r.surveyor.username === selectedUser);
    }

    setFilteredResponses(result);
  }, [searchQuery, dateFilter, selectedUser, allResponses]);

  const uniqueUsers = Array.from(new Set(allResponses.map(r => r.surveyor.username)));

  const handlePrint = () => window.print();

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div className="animate-in fade-in duration-300">
      {/* 1. TOP HEADER & GLOBAL FILTERS */}
      {!selectedResponse && (
        <div className="no-print">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Field Intelligence</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Response Analytics & Surveyor Tracking</p>
            </div>

            <div className="flex gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                  <input
                    type="text"
                    placeholder="Search Username / Device ID..."
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-saffron/20 focus:border-saffron w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                  <input
                    type="date"
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-ashoka/20 focus:border-ashoka"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
               </div>
            </div>
          </div>

          {/* USER SELECTION TABS */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
             <button
                onClick={() => setSelectedUser(null)}
                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${!selectedUser ? 'bg-navy text-white border-navy' : 'bg-white text-gray-400 border-gray-100 hover:border-navy hover:text-navy'}`}
             >
                All Surveyors
             </button>
             {uniqueUsers.map(user => (
               <button
                  key={user}
                  onClick={() => setSelectedUser(user)}
                  className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${selectedUser === user ? 'bg-saffron text-white border-saffron shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-saffron hover:text-saffron'}`}
               >
                  <User size={12}/> {user}
               </button>
             ))}
          </div>
        </div>
      )}

      {/* 2. RESPONSE LIST / GRID VIEW */}
      {!selectedResponse ? (
        <div className="grid grid-cols-1 gap-4 no-print">
          {filteredResponses.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedResponse(r)}
              className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-xl hover:border-saffron/30 cursor-pointer transition-all group flex justify-between items-center"
            >
              <div className="flex gap-6 items-center">
                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-navy group-hover:bg-saffron/10 group-hover:text-saffron transition-colors">
                    <User size={24}/>
                 </div>
                 <div>
                    <h3 className="font-black text-navy group-hover:text-saffron transition-colors">{r.respondent_name || 'Anonymous Respondent'}</h3>
                    <div className="flex items-center gap-4 mt-1">
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Phone size={10}/> {r.respondent_contact || 'No Contact'}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Smartphone size={10}/> {r.device.device_identifier}</span>
                       <span className="text-[10px] font-bold text-ashoka uppercase flex items-center gap-1"><Calendar size={10}/> {new Date(r.submitted_at).toLocaleDateString()}</span>
                    </div>
                 </div>
              </div>

              <div className="text-right flex items-center gap-6">
                 <div>
                    <p className="text-xs font-black text-gray-800 uppercase tracking-widest">{r.survey.title}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Surveyor: {r.surveyor.name}</p>
                 </div>
                 <ChevronRight className="text-gray-200 group-hover:text-saffron transition-all" size={24}/>
              </div>
            </div>
          ))}
          {filteredResponses.length === 0 && (
            <div className="py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-100">
               <Filter className="mx-auto text-gray-200 mb-4" size={48}/>
               <p className="text-gray-400 font-black uppercase tracking-widest">No matching field data found</p>
            </div>
          )}
        </div>
      ) : (
        /* 3. ENHANCED PRINT / PREVIEW VIEW (DRILL DOWN) */
        <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-center mb-8 no-print">
              <button
                onClick={() => setSelectedResponse(null)}
                className="flex items-center gap-2 text-gray-400 font-black uppercase text-xs hover:text-navy transition-colors"
              >
                <ArrowLeft size={16}/> Back to Intelligence Stream
              </button>
              <button
                onClick={handlePrint}
                className="bg-navy text-white px-6 py-2 rounded-lg font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2"
              >
                <Download size={16}/> Save PDF / Print Official Copy
              </button>
           </div>

           <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 printable-area">
              {/* Header Branding */}
              <div className="bg-gradient-to-r from-navy to-ashoka p-8 text-white flex justify-between items-center">
                 <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">SurveySetu Response Record</h1>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Verified Digital Field Submission</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-bold text-saffron uppercase">Submission Hash</p>
                    <p className="text-[10px] font-mono text-white/50 uppercase">{selectedResponse.id.split('-')[0]}...{selectedResponse.id.split('-').pop()}</p>
                 </div>
              </div>

              <div className="p-10">
                 {/* Metadata Grid */}
                 <div className="grid grid-cols-3 gap-8 mb-12 border-b pb-8">
                    <div>
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Respondent</h4>
                       <p className="font-black text-navy text-lg">{selectedResponse.respondent_name || 'Not Provided'}</p>
                       <p className="text-gray-500 text-xs font-bold mt-1">{selectedResponse.respondent_contact || 'N/A'}</p>
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Surveyor & Hardware</h4>
                       <p className="font-black text-gray-800 text-sm uppercase">{selectedResponse.surveyor.name}</p>
                       <p className="text-ashoka text-[10px] font-black mt-1 uppercase flex items-center gap-1"><Smartphone size={10}/> {selectedResponse.device.device_identifier}</p>
                    </div>
                    <div className="text-right">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Timestamp</h4>
                       <p className="font-black text-gray-800 text-sm uppercase">{new Date(selectedResponse.submitted_at).toLocaleDateString()}</p>
                       <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">{new Date(selectedResponse.submitted_at).toLocaleTimeString()}</p>
                    </div>
                 </div>

                 {/* Questions Dataset */}
                 <div className="space-y-8">
                    <h4 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                       <div className="w-8 h-1 bg-saffron rounded-full"/> Complete Answer Dataset
                    </h4>

                    <div className="grid grid-cols-1 gap-6">
                       {selectedResponse.answers.map((a, i) => (
                         <div key={i} className="flex gap-6 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <span className="text-gray-300 text-2xl font-black italic min-w-[40px]">{(i+1).toString().padStart(2, '0')}</span>
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-tight leading-tight">{a.question.question_text}</p>
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-ashoka"/>
                                  <p className="text-navy font-black text-lg italic tracking-tight">"{a.selectedOption.option_text}"</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* GPS Verification */}
                 {selectedResponse.gps_lat && (
                   <div className="mt-12 bg-navy/5 p-6 rounded-xl border border-navy/10 flex justify-between items-center">
                      <div>
                         <h4 className="text-[10px] font-black text-navy uppercase tracking-widest mb-1">Geospatial Verification</h4>
                         <p className="text-gray-500 text-[10px] font-bold">Coordinates: {selectedResponse.gps_lat}, {selectedResponse.gps_lng}</p>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${selectedResponse.gps_lat},${selectedResponse.gps_lng}`}
                        target="_blank" rel="noreferrer"
                        className="bg-ashoka text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-green-800 transition-all no-print"
                      >
                         Open Satellite Map
                      </a>
                   </div>
                 )}

                 {/* Footer Branding */}
                 <div className="mt-16 pt-8 border-t border-dashed flex justify-between items-end opacity-40">
                    <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-gray-500">
                       Authenticated by SurveySetu Cloud Engine
                    </div>
                    <div className="flex gap-2">
                       <div className="w-2 h-2 rounded-full bg-saffron"/>
                       <div className="w-2 h-2 rounded-full bg-ashoka"/>
                       <div className="w-2 h-2 rounded-full bg-navy"/>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
