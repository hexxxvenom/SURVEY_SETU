import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

interface Option { id: string; text: string; order: number; }
interface Question { id: string; text: string; options: Option[]; isMandatory: boolean; order: number; }

export const SurveyEditor = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [questions, setQuestions] = useState<Question[]>([]);

  const addQuestion = () => {
    setQuestions([
      ...questions, 
      { id: Date.now().toString(), text: '', isMandatory: true, order: questions.length + 1, options: [
        { id: Date.now().toString() + '-1', text: '', order: 1 },
        { id: Date.now().toString() + '-2', text: '', order: 2 }
      ]}
    ]);
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const toggleMandatory = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, isMandatory: !q.isMandatory } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.options.length < 4) {
        return {
          ...q,
          options: [...q.options, { id: Date.now().toString(), text: '', order: q.options.length + 1 }]
        };
      }
      return q;
    }));
  };

  const updateOptionText = (qId: string, oId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options.map(o => o.id === oId ? { ...o, text } : o) };
      }
      return q;
    }));
  };

  const removeOption = (qId: string, oId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.options.length > 2) {
        return { ...q, options: q.options.filter(o => o.id !== oId) };
      }
      return q;
    }));
  };

  const saveSurvey = async (publish: boolean) => {
    console.log({ title, language, status: publish ? 'PUBLISHED' : 'DRAFT', questions });
    navigate('/surveys');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button onClick={() => navigate('/surveys')} className="flex items-center gap-2 text-gray-600 hover:text-navy mb-6">
        <ArrowLeft size={20} /> Back to Surveys
      </button>

      <div className="bg-white p-6 rounded-lg shadow mb-8 border-t-4 border-navy">
        <h2 className="text-xl font-bold text-navy mb-4">Survey Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title</label>
            <input 
              type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-navy outline-none"
              value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Health Infrastructure 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select 
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-navy outline-none"
              value={language} onChange={e => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow relative border border-gray-100">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => removeQuestion(q.id)} className="text-red-500 p-1 hover:bg-red-50 rounded" title="Delete Question">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="mb-4 pr-12">
              <label className="block text-sm font-bold text-gray-700 mb-1">Question {qIndex + 1}</label>
              <input 
                type="text" className="w-full border-b-2 border-gray-200 p-2 focus:border-ashoka outline-none text-lg"
                value={q.text} onChange={e => updateQuestionText(q.id, e.target.value)} placeholder="Enter question text here..."
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={q.isMandatory} onChange={() => toggleMandatory(q.id)} className="w-4 h-4 text-ashoka" />
                <span className="text-sm text-gray-600">Mandatory Question</span>
              </label>
            </div>

            <div className="ml-4 space-y-3">
              {q.options.map((opt, oIndex) => (
                <div key={opt.id} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold text-gray-400">
                    {String.fromCharCode(65 + oIndex)}
                  </div>
                  <input 
                    type="text" className="flex-1 border border-gray-200 rounded p-2 focus:border-ashoka outline-none text-sm"
                    value={opt.text} onChange={e => updateOptionText(q.id, opt.id, e.target.value)} placeholder={`Option ${oIndex + 1}`}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(q.id, opt.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {q.options.length < 4 && (
                <button onClick={() => addOption(q.id)} className="text-sm text-ashoka font-medium flex items-center gap-1 mt-2 hover:underline">
                  <Plus size={16} /> Add Option (Max 4)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addQuestion}
        className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:border-saffron hover:text-saffron transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Add New Question
      </button>

      <div className="fixed bottom-0 left-64 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button onClick={() => saveSurvey(false)} className="px-6 py-2 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50">
          Save as Draft
        </button>
        <button onClick={() => saveSurvey(true)} className="px-6 py-2 bg-navy text-white rounded font-medium hover:bg-blue-900 flex items-center gap-2">
          <Save size={18} /> Publish Survey
        </button>
      </div>
    </div>
  );
};
