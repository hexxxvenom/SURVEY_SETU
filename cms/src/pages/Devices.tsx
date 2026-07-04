import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Smartphone, Lock, Unlock, Loader2, X } from 'lucide-react';

export const Devices = () => {
  const { token } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({ device_identifier: '' });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      console.log(`[DEBUG] Fetching devices from: ${API_URL}/admin/devices`);
      const res = await axios.get(`${API_URL}/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(res.data.data);
    } catch (err: any) {
      console.error("[ERROR] Failed to fetch devices:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token, API_URL]);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(`[DEBUG] Registering device:`, formData);
      await axios.post(`${API_URL}/admin/devices`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setFormData({ device_identifier: '' });
      fetchDevices();
    } catch (err: any) {
      console.error("[ERROR] Device registration failed:", err.response?.data || err.message);
      alert(`Registration failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    console.log(`[DEBUG] Toggling lock for device ${id} to ${newStatus}`);
    try {
      const res = await axios.patch(`${API_URL}/admin/devices/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`[DEBUG] Toggle success:`, res.data);
      fetchDevices();
    } catch (err: any) {
      console.error("[ERROR] Toggle lock failed:", err.response?.data || err.message);
      alert(`Failed to update status: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Device Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-ashoka text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-blue-800 transition-colors"
        >
          <Smartphone size={20} /> Register New Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Device Identifier</th>
              <th className="p-4 font-medium">Assigned To</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map(device => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-sm text-gray-800">{device.device_identifier}</td>
                <td className="p-4 text-gray-600">{device.user?.name || 'Unassigned'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {device.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => toggleLock(device.id, device.status)}
                    className={`${device.status === 'ACTIVE' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'} transition-colors`}
                    title={device.status === 'ACTIVE' ? 'Lock Device' : 'Unlock Device'}
                  >
                    {device.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {devices.length === 0 && <div className="p-10 text-center text-gray-400 italic">No registered devices.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-navy p-4 text-white flex justify-between items-center">
              <h2 className="font-bold">Hardware Registration</h2>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleRegisterDevice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Device ID / Serial / IMEI</label>
                <input required className="w-full border rounded p-2 outline-none focus:border-saffron font-mono"
                  placeholder="e.g., DEV-DEMO-001"
                  value={formData.device_identifier} onChange={e => setFormData({...formData, device_identifier: e.target.value})}/>
              </div>
              <button className="w-full bg-ashoka text-white py-3 rounded font-bold hover:bg-blue-800 mt-4 transition-colors">
                Authorize Hardware
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
