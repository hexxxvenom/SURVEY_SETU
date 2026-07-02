import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { UserPlus, Lock, Unlock, Edit } from 'lucide-react';

export const Users = () => {
  const role = useAuthStore(state => state.role);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    // Mock user data
    setUsers([
      { id: '1', name: 'Admin One', username: 'admin1', role: 'ADMIN', status: 'ACTIVE' },
      { id: '2', name: 'Editor Alpha', username: 'editor_a', role: 'EDITOR', status: 'ACTIVE' },
      { id: '3', name: 'Surveyor Field A', username: 'surv_a', role: 'SURVEYOR', status: 'ACTIVE', linked_device_id: 'DEV-12345' },
      { id: '4', name: 'Surveyor Field B', username: 'surv_b', role: 'SURVEYOR', status: 'LOCKED', linked_device_id: 'DEV-67890' }
    ]);
  }, []);

  const toggleLock = (id: string, currentStatus: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : u));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-navy">User Management</h1>
        <button className="bg-saffron text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-orange-500 transition-colors">
          <UserPlus size={20} /> Create New User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Username</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Device Bound</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{user.name}</td>
                <td className="p-4 text-gray-600">{user.username}</td>
                <td className="p-4 text-gray-600">{user.role}</td>
                <td className="p-4 text-gray-600">
                  {user.linked_device_id ? (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">{user.linked_device_id}</span>
                  ) : (
                    <span className="text-gray-400 italic">None</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  <button className="text-ashoka hover:text-navy transition-colors" title="Edit">
                    <Edit size={18} />
                  </button>
                  {(role === 'SUPER_ADMIN' || (role === 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                    <button 
                      onClick={() => toggleLock(user.id, user.status)}
                      className={`${user.status === 'ACTIVE' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'} transition-colors`}
                      title={user.status === 'ACTIVE' ? 'Lock Account' : 'Unlock Account'}
                    >
                      {user.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
