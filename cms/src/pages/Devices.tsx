import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { Smartphone, Lock, Unlock, Loader2 } from 'lucide-react';

export const Devices = () => {
  const { token } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Device Management</h1>
        <button className="bg-ashoka text-white px-4 py-2 rounded flex items-center gap-2 font-bold">
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
    </div>
  );
};
