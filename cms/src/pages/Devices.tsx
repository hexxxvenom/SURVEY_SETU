import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Smartphone, Lock, Unlock, Loader2, X, Trash2, Edit, CheckCircle } from 'lucide-react';

export const Devices = () => {
  const { token } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Now clearly labeled as Hardware ID for the admin
  const [formData, setFormData] = useState({ device_identifier: '' });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await axios.put(`${API_URL}/admin/devices/${editingDevice.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/devices`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      closeModal();
      fetchDevices();
    } catch (err: any) {
      alert(err.response?.data?.error || "Operation failed. Ensure the Hardware ID is unique.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove Hardware ID "${name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/devices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDevices();
    } catch (err) {
      alert("Failed to delete device");
    }
  };

  const openEditModal = (device: any) => {
    setEditingDevice(device);
    setFormData({ device_identifier: device.device_identifier });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDevice(null);
    setFormData({ device_identifier: '' });
  };

  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await axios.patch(`${API_URL}/admin/devices/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDevices();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy">Hardware Authorization</h1>
          <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-bold">Physical Device Control Center</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ashoka text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-800 transition-all shadow-md active:scale-95"
        >
          <Smartphone size={20} /> Authorize New Hardware
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-[10px] uppercase tracking-[0.2em]">
              <th className="px-6 py-5 font-black">Physical Hardware ID (Android ID)</th>
              <th className="px-6 py-5 font-black">Assigned Field User</th>
              <th className="px-6 py-5 font-black text-center">Status</th>
              <th className="px-6 py-5 font-black text-right">Security Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {devices.map(device => (
              <tr key={device.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-navy flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                  {device.device_identifier}
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm font-bold text-gray-700">{device.user?.name || '---'}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase">{device.user?.username || 'Unassigned'}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest ${device.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(device)} className="p-2 text-ashoka hover:bg-ashoka/5 rounded-lg transition-colors" title="Edit Hardware ID">
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => toggleLock(device.id, device.status)}
                      className={`p-2 rounded-lg transition-colors ${device.status === 'ACTIVE' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={device.status === 'ACTIVE' ? 'Block Access' : 'Restore Access'}
                    >
                      {device.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                    <button onClick={() => handleDelete(device.id, device.device_identifier)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="De-authorize Hardware">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {devices.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
             <Smartphone size={48} className="text-gray-100 mb-4"/>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic text-center">No authorized physical hardware detected in cloud registry.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-navy p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-saffron"/>
                <h2 className="font-black uppercase tracking-widest text-sm">{editingDevice ? 'Update Hardware Registry' : 'Register Field Hardware'}</h2>
              </div>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Physical Hardware ID (Android ID)</label>
                <input
                  required
                  className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-saffron font-mono text-navy font-bold transition-all"
                  placeholder="Paste the code from the surveyor's phone..."
                  value={formData.device_identifier}
                  onChange={e => setFormData({...formData, device_identifier: e.target.value})}
                />
                <p className="mt-3 text-[9px] text-gray-400 leading-relaxed italic">
                   Note: The Hardware ID is shown at the bottom of the App Login screen.
                   Surveyors can tap it to copy and send it to you.
                </p>
              </div>
              <button className={`w-full ${editingDevice ? 'bg-ashoka' : 'bg-saffron'} text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2`}>
                <CheckCircle size={16}/> {editingDevice ? 'Update Authorization' : 'Authorize Hardware'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
