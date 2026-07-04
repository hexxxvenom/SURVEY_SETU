import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Download, User, Phone, MapPin } from 'lucide-react';

interface ResponseData {
  id: string;
  respondent_name: string;
  respondent_contact: string;
  gps_lat: number;
  gps_lng: number;
  submitted_at: string;
  survey: { title: string };
  surveyor: { name: string };
}

export const Responses = () => {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const token = useAuthStore(state => state.token);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/responses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResponses(res.data.data);
      } catch (err) {
        console.error("Failed to fetch responses", err);
      }
    };
    fetchResponses();
  }, [token, API_URL]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Field Responses</h1>
        <button className="bg-gold text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-yellow-600 transition-colors">
          <Download size={20} /> Export All
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Respondent</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Survey</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Surveyor</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {responses.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{r.respondent_name || 'N/A'}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {r.respondent_contact || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{r.survey.title}</td>
                <td className="px-6 py-4">
                   <div className="text-sm flex items-center gap-2"><User size={14} className="text-gray-400"/> {r.surveyor.name}</div>
                </td>
                <td className="px-6 py-4">
                   {r.gps_lat ? (
                     <a href={`https://maps.google.com/?q=${r.gps_lat},${r.gps_lng}`} target="_blank" rel="noreferrer" className="text-ashoka text-xs flex items-center gap-1 hover:underline">
                       <MapPin size={12}/> View Map
                     </a>
                   ) : <span className="text-xs text-gray-400">No GPS</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.submitted_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <button className="text-navy text-xs font-bold hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {responses.length === 0 && <div className="p-10 text-center text-gray-400 italic">No responses found yet.</div>}
      </div>
    </div>
  );
};
