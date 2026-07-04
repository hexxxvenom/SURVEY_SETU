import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Download, User, Phone, MapPin, Eye, FileDown } from 'lucide-react';

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
  const token = useAuthStore(state => state.token);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchResponses = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResponses(res.data.data);
    } catch (err) {
      console.error("Failed to fetch responses");
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [token, API_URL]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-navy">Field Responses</h1>
        <button className="bg-gold text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-yellow-600 transition-colors">
          <Download size={20} /> Export All (CSV)
        </button>
      </div>

      {!selectedResponse ? (
        <div className="bg-white rounded-lg shadow overflow-hidden no-print">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Respondent</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Survey</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
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
                       <a href={`https://maps.google.com/?q=${r.gps_lat},${r.gps_lng}`} target="_blank" rel="noreferrer" className="text-ashoka text-xs flex items-center gap-1">
                         <MapPin size={12}/> Map
                       </a>
                     ) : <span className="text-xs text-gray-400">None</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedResponse(r)}
                      className="text-navy p-2 hover:bg-navy/5 rounded-full transition-colors" title="View PDF Preview"
                    >
                      <Eye size={20}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow max-w-4xl mx-auto printable-area">
          <div className="flex justify-between items-start mb-10 no-print">
             <button onClick={() => setSelectedResponse(null)} className="text-gray-400 hover:text-navy">&larr; Back to List</button>
             <div className="flex gap-4">
                <button onClick={handlePrint} className="bg-navy text-white px-4 py-2 rounded flex items-center gap-2">
                  <Download size={18}/> Save as PDF / Print
                </button>
             </div>
          </div>

          <div className="border-b-4 border-saffron pb-6 mb-8 text-center">
            <h1 className="text-2xl font-bold text-navy uppercase tracking-widest">SurveySetu Response Record</h1>
            <p className="text-gray-500 text-sm mt-2">Official Field Collection Document</p>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Respondent Details</h3>
              <p className="text-xl font-bold">{selectedResponse.respondent_name}</p>
              <p className="text-gray-600 flex items-center gap-2 mt-1"><Phone size={14}/> {selectedResponse.respondent_contact}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Survey Metadata</h3>
              <p className="font-bold text-navy">{selectedResponse.survey.title}</p>
              <p className="text-sm text-gray-500 mt-1">Collected by: {selectedResponse.surveyor.name}</p>
              <p className="text-sm text-gray-500">Date: {new Date(selectedResponse.submitted_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase border-b pb-2">Response Data</h3>
            {selectedResponse.answers.map((a, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="bg-gray-100 text-gray-500 w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0">{i+1}</span>
                <div>
                  <p className="font-medium text-gray-800">{a.question.question_text}</p>
                  <p className="text-navy font-bold mt-1 text-lg italic">"{a.selectedOption.option_text}"</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-8 border-t border-dashed text-center text-gray-400 text-xs italic">
            This is a digitally generated response record from the SurveySetu platform.
            <br/>Response ID: {selectedResponse.id}
          </div>
        </div>
      )}
    </div>
  );
};
