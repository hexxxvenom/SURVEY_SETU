import { useAuthStore } from '../store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download } from 'lucide-react';

const mockVolumeData = [
  { name: 'Mon', responses: 400 },
  { name: 'Tue', responses: 300 },
  { name: 'Wed', responses: 550 },
  { name: 'Thu', responses: 200 },
  { name: 'Fri', responses: 678 },
  { name: 'Sat', responses: 890 },
  { name: 'Sun', responses: 430 },
];

const mockDistributionData = [
  { name: 'Agriculture', count: 450 },
  { name: 'Business', count: 210 },
  { name: 'Service', count: 800 },
  { name: 'Unemployed', count: 120 },
];

export const Dashboard = () => {
  const role = useAuthStore(state => state.role);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Dashboard Overview</h1>
        <button className="bg-saffron text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-orange-500 transition-colors">
          <Download size={20} /> Export Report
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-saffron">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Surveys</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-ashoka">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Devices</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">18</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-gold">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Responses</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">3,450</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-navy">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Logged in as</h3>
          <p className="text-xl font-bold text-gray-800 mt-2">{role}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Area Chart: Response Volume */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold text-navy mb-4">Response Volume (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="responses" stroke="#FF9933" fill="#FF9933" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Answer Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold text-navy mb-4">Demographic: Primary Occupation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDistributionData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 12, fontWeight: 500}} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0B3D91" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
