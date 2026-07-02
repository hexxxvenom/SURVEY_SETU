import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';

export const Surveys = () => {
  const [surveys, setSurveys] = useState<any[]>([]);

  useEffect(() => {
    // Mock data — in production, fetch from API
    setSurveys([
      { id: '1', title: 'Healthcare Access Survey 2026', status: 'PUBLISHED', version: 2, language: 'en', createdAt: '2026-06-25T10:00:00Z' },
      { id: '2', title: 'Rural Connectivity Assessment', status: 'DRAFT', version: 1, language: 'hi', createdAt: '2026-06-28T14:30:00Z' }
    ]);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Surveys</h1>
        <Link 
          to="/surveys/new"
          className="bg-saffron text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-orange-500 transition-colors"
        >
          <Plus size={20} /> Create New Survey
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Version</th>
              <th className="p-4 font-medium">Language</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {surveys.map(survey => (
              <tr key={survey.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{survey.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${survey.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {survey.status}
                  </span>
                </td>
                <td className="p-4 text-gray-600">v{survey.version}</td>
                <td className="p-4 text-gray-600 flex items-center gap-1"><Globe size={14} /> {survey.language.toUpperCase()}</td>
                <td className="p-4 text-right flex justify-end gap-3">
                  <Link to={`/surveys/${survey.id}/edit`} className="text-ashoka hover:text-navy transition-colors" title="Edit">
                    <Edit size={18} />
                  </Link>
                  <button className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No surveys found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
