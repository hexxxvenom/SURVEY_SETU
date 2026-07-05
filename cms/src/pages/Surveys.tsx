import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Plus, Edit, Trash2, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Surveys = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/surveys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSurveys(res.data.data);
    } catch (err) {
      console.error("Failed to fetch surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [token, API_URL]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Mission Templates</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Survey Design & Lifecycle Management</p>
        </div>
        <Link 
          to="/surveys/new"
          className="bg-navy text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-900 transition-all"
        >
          <Plus size={18} /> Design New Survey
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map(survey => (
          <div key={survey.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all group">
             <div className="flex justify-between items-start mb-4">
                <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${survey.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                   {survey.status}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Link to={`/surveys/${survey.id}/edit`} className="p-2 bg-gray-50 text-gray-400 hover:text-navy rounded-lg"><Edit size={16}/></Link>
                   <button className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={16}/></button>
                </div>
             </div>

             <h3 className="font-black text-navy text-lg leading-tight mb-2">{survey.title}</h3>
             <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Clock size={12}/> v{survey.version}</span>
                <span className="flex items-center gap-1"><CheckCircle size={12}/> {survey.questions?.length || 0} Points</span>
             </div>

             <div className="mt-8 pt-4 border-t border-dashed flex justify-between items-center">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID: {survey.id}</p>
                <button className="text-ashoka font-black uppercase text-[10px] tracking-widest hover:underline">Manage dataset &rarr;</button>
             </div>
          </div>
        ))}
      </div>

      {surveys.length === 0 && (
         <div className="py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-300 font-black uppercase tracking-widest">No Active Missions Defined</p>
         </div>
      )}
    </div>
  );
};
