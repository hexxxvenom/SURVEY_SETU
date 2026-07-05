import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';

interface Option { id: string; text: string; order: number; }
interface Question { id: string; text: string; options: Option[]; isMandatory: boolean; order: number; }

export const SurveyEditor = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL;

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('en');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

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
    if (!title) return alert("Please enter a survey title");
    if (questions.length === 0) return alert("Please add at least one question");

    setSaving(true);
    try {
      await axios.post(`${API_URL}/surveys`, {
        title,
        language,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        questions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/surveys');
    } catch (err) {
      alert("Failed to save survey. Check connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-in fade-in duration-500">
      <button onClick={() => navigate('/surveys')} className="flex items-center gap-2 text-gray-400 font-bold hover:text-navy mb-8 uppercase text-xs">
        <ArrowLeft size={16} /> Back to Library
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10">
        <h2 className="text-xl font-black text-navy mb-6 uppercase tracking-widest">Survey Definition</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Title</label>
            <input 
              type="text" className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-saffron outline-none font-bold text-navy"
              value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Infrastructure Audit"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Language</label>
            <select 
              className="w-full border-2 border-gray-100 rounded-xl p-3 focus:border-saffron outline-none font-bold text-navy"
              value={language} onChange={e => setLanguage(e.target.value)}
            >
              <option value="en">English (Universal)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white p-8 rounded-3xl shadow-sm relative border border-gray-100 group hover:border-ashoka/30 transition-all">
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => removeQuestion(q.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl" title="Delete Question">
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="mb-6 pr-12">
              <span className="text-[10px] font-black text-ashoka uppercase tracking-widest mb-2 block">Question {qIndex + 1}</span>
              <input 
                type="text" className="w-full border-b-2 border-gray-100 p-2 focus:border-ashoka outline-none text-xl font-black text-navy placeholder:text-gray-200"
                value={q.text} onChange={e => updateQuestionText(q.id, e.target.value)} placeholder="What is your primary concern?"
              />
            </div>

            <div className="mb-8">
              <label className="flex items-center gap-3 cursor-pointer group/check w-fit">
                <input type="checkbox" checked={q.isMandatory} onChange={() => toggleMandatory(q.id)} className="w-5 h-5 rounded-lg border-2 border-gray-200 text-ashoka focus:ring-0" />
                <span className="text-xs font-bold text-gray-400 uppercase group-hover/check:text-navy transition-colors tracking-widest">Mark as Mandatory</span>
              </label>
            </div>

            <div className="space-y-4">
              {q.options.map((opt, oIndex) => (
                <div key={opt.id} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-white border-2 border-gray-100 flex items-center justify-center text-xs font-black text-gray-300">
                    {String.fromCharCode(65 + oIndex)}
                  </div>
                  <input 
                    type="text" className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-navy py-2"
                    value={opt.text} onChange={e => updateOptionText(q.id, opt.id, e.target.value)} placeholder={`Label for Option ${oIndex + 1}`}
                  />
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(q.id, opt.id)} className="text-gray-300 hover:text-red-400 px-2 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {q.options.length < 4 && (
                <button onClick={() => addOption(q.id)} className="text-[10px] text-ashoka font-black uppercase tracking-widest flex items-center gap-2 mt-4 hover:brightness-75 bg-ashoka/5 px-4 py-2 rounded-full transition-all">
                  <Plus size={14} /> Extend Choice Array
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addQuestion}
        className="w-full mt-10 py-8 border-4 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300 font-black uppercase tracking-[0.3em] hover:border-saffron/30 hover:text-saffron transition-all flex flex-col items-center justify-center gap-4 group"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-saffron/10 transition-colors">
            <Plus size={32} />
        </div>
        Append Data Point
      </button>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-2xl flex gap-2 shadow-2xl z-50">
        <button
            disabled={saving}
            onClick={() => saveSurvey(false)}
            className="px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Retain as Draft
        </button>
        <button
            disabled={saving}
            onClick={() => saveSurvey(true)}
            className="px-10 py-3 bg-navy text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg hover:bg-blue-900 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
          Commit & Broadcast (Publish)
        </button>
      </div>
    </div>
  );
};
