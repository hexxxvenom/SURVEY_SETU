import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Download, User, Phone, MapPin, Eye, FileDown, CheckCircle, Loader2 } from 'lucide-react';

interface ResponseData {
  id: string;
  respondent_name: string;
  respondent_contact: string;
  gps_lat: number;
  gps_lng: number;
  submitted_at: string;
  survey: { title: string };
  surveyor: { name: string };
  answers: Array<{ question: { question_text: string }, selectedOption: { option_text: string } }>;
}

export const Responses = () => {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponses(res.data.data);
    } catch (err) {
      console.error("Failed to fetch responses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [token, API_URL]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (responses.length === 0) return;

    // Build CSV Content
    const headers = ["Response ID", "Respondent Name", "Contact", "Survey Title", "Surveyor", "Latitude", "Longitude", "Submitted At"];
    const rows = responses.map(r => [
      r.id,
      r.respondent_name || "Anonymous",
      r.respondent_contact || "N/A",
      r.survey.title,
      r.surveyor.name,
      r.gps_lat || "N/A",
      r.gps_lng || "N/A",
      new Date(r.submitted_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Download File
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `SurveySetu_Responses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-navy">Field Responses</h1>
        <button
          onClick={handleExportCSV}
          className="bg-gold text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-yellow-600 transition-colors shadow-sm"
        >
          <Download size={20} /> Export All (CSV)
        </button>
      </div>

      {!selectedResponse ? (
        <div className="bg-white rounded-lg shadow overflow-hidden no-print">
          <table className="w-full text-left border-collapse">
            <thead className="bg-navy text-white">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Respondent</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Survey</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responses.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{r.respondent_name || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {r.respondent_contact || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{r.survey.title}</td>
                  <td className="px-6 py-4">
                     {r.gps_lat ? (
                       <a href={`https://maps.google.com/?q=${r.gps_lat},${r.gps_lng}`} target="_blank" rel="noreferrer" className="text-ashoka text-xs flex items-center gap-1 hover:underline font-bold">
                         <MapPin size={12}/> View Map
                       </a>
                     ) : <span className="text-xs text-gray-400 italic">No GPS</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedResponse(r)}
                      className="bg-navy/5 text-navy p-2 hover:bg-navy hover:text-white rounded-lg transition-all" title="View PDF Preview"
                    >
                      <Eye size={20}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {responses.length === 0 && <div className="p-20 text-center text-gray-400 italic">No responses found in cloud database.</div>}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto printable-area border border-gray-100">
          <div className="flex justify-between items-start mb-10 no-print">
             <button onClick={() => setSelectedResponse(null)} className="text-gray-400 hover:text-navy flex items-center gap-1 font-bold">&larr; Back to List</button>
             <div className="flex gap-4">
                <button onClick={handlePrint} className="bg-navy text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md hover:bg-blue-900 transition-colors">
                  <Download size={18}/> Save as PDF / Print
                </button>
             </div>
          </div>

          <div className="border-b-4 border-saffron pb-6 mb-8 text-center">
            <h1 className="text-2xl font-bold text-navy uppercase tracking-widest">SurveySetu Official Record</h1>
            <p className="text-gray-400 text-xs mt-2 font-mono">ID: {selectedResponse.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Field Respondent</h3>
              <p className="text-xl font-bold text-gray-800">{selectedResponse.respondent_name}</p>
              <p className="text-gray-600 flex items-center gap-2 mt-1"><Phone size={14} className="text-saffron"/> {selectedResponse.respondent_contact}</p>
            </div>
            <div className="text-right">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Survey Metadata</h3>
              <p className="font-bold text-navy">{selectedResponse.survey.title}</p>
              <p className="text-sm text-gray-500 mt-1">Surveyor: <span className="font-bold text-gray-700">{selectedResponse.surveyor.name}</span></p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase">{new Date(selectedResponse.submitted_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase border-b pb-2 tracking-widest">Response Dataset</h3>
            {selectedResponse.answers.map((a, i) => (
              <div key={i} className="flex gap-6 items-start border-l-4 border-ashoka pl-4 py-1">
                <span className="text-gray-300 text-lg font-bold italic font-mono">0{i+1}</span>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">{a.question.question_text}</p>
                  <p className="text-navy font-bold text-xl italic leading-tight">"{a.selectedOption.option_text}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-8 border-t border-dashed text-center">
            <p className="text-gray-400 text-[10px] italic">
              This digital record is authenticated and stored in the SurveySetu Cloud Infrastructure.
              <br/>Generated on {new Date().toLocaleString()}
            </p>
            <div className="mt-4 flex justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-saffron" />
                <div className="w-2 h-2 rounded-full bg-ashoka" />
                <div className="w-2 h-2 rounded-full bg-navy" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
