import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { UserPlus, Lock, Unlock, Edit, Loader2 } from 'lucide-react';

export const Users = () => {
  const { token, role } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, API_URL]);

  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await axios.patch(`${API_URL}/admin/users/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

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
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  <button className="text-ashoka hover:text-navy transition-colors" title="Edit">
                    <Edit size={18} />
                  </button>
                  {(role === 'SUPER_ADMIN' || (role === 'ADMIN' && user.role !== 'SUPER_ADMIN')) && user.username !== 'superadmin' && (
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
