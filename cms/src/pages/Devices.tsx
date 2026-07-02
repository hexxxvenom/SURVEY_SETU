import { useState, useEffect } from 'react';
import { Smartphone, Lock, Unlock, QrCode } from 'lucide-react';

export const Devices = () => {
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    // Mock device data
    setDevices([
      { id: '1', identifier: 'DEV-12345', assignedTo: 'Surveyor Field A', status: 'ACTIVE', lastSeen: '2026-06-29T08:15:00Z', printSize: '58mm' },
      { id: '2', identifier: 'DEV-67890', assignedTo: 'Surveyor Field B', status: 'LOCKED', lastSeen: '2026-06-28T14:30:00Z', printSize: '80mm' },
      { id: '3', identifier: 'DEV-99999', assignedTo: null, status: 'ACTIVE', lastSeen: null, printSize: '58mm' },
    ]);
  }, []);

  const toggleLock = (id: string, currentStatus: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, status: currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : d));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">Device Management</h1>
        <button className="bg-saffron text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-orange-500 transition-colors">
          <Smartphone size={20} /> Register New Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Device Identifier</th>
              <th className="p-4 font-medium">Assigned Surveyor</th>
              <th className="p-4 font-medium">Last Seen</th>
              <th className="p-4 font-medium">Printer Default</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map(device => (
              <tr key={device.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono font-medium text-gray-800">{device.identifier}</td>
                <td className="p-4 text-gray-600">
                  {device.assignedTo ? device.assignedTo : <span className="text-orange-500 text-sm font-semibold">Unassigned</span>}
                </td>
                <td className="p-4 text-gray-600">
                  {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                </td>
                <td className="p-4 text-gray-600">{device.printSize}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${device.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {device.status}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  <button className="text-navy hover:text-blue-800 transition-colors" title="Generate QR for Provisioning">
                    <QrCode size={18} />
                  </button>
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
      </div>
    </div>
  );
};
