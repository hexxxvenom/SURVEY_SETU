import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { UserPlus, Lock, Unlock, Edit, Loader2, X } from 'lucide-react';

export const Users = () => {
  const { token, role } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // New User Form State
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'SURVEYOR' });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Note: We need a POST /admin/users endpoint in backend
      await axios.post(`${API_URL}/admin/users`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setFormData({ name: '', username: '', password: '', role: 'SURVEYOR' });
      fetchUsers();
    } catch (err) {
      alert("Failed to create user. Ensure API supports this action.");
    }
  };

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
        <button
          onClick={() => setShowModal(true)}
          className="bg-saffron text-white px-4 py-2 rounded flex items-center gap-2 font-bold hover:bg-orange-500 transition-colors"
        >
          <UserPlus size={20} /> Register New User
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
        {users.length === 0 && <div className="p-10 text-center text-gray-400 italic">No users found in database.</div>}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-navy p-4 text-white flex justify-between items-center">
              <h2 className="font-bold">Register New System User</h2>
              <button onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required className="w-full border rounded p-2 outline-none focus:border-saffron"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input required className="w-full border rounded p-2 outline-none focus:border-saffron"
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                <input required type="password" className="w-full border rounded p-2 outline-none focus:border-saffron"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Access Role</label>
                <select className="w-full border rounded p-2 outline-none"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="SURVEYOR">Surveyor (App User)</option>
                  <option value="EDITOR">Editor (Survey Builder)</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <button className="w-full bg-saffron text-white py-3 rounded font-bold hover:bg-orange-500 mt-4 transition-colors">
                Create User Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
