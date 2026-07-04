import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { UserPlus, Lock, Unlock, Edit, Loader2, X, Smartphone, Trash2 } from 'lucide-react';

export const Users = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'SURVEYOR',
    linked_device_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, devicesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/devices`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data.data);
      setDevices(devicesRes.data.data);
    } catch (err) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, API_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`${API_URL}/admin/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      closeModal();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Operation failed.");
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === 'superadmin') return alert("Cannot delete root superadmin");
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Leave blank unless changing
      role: user.role,
      linked_device_id: user.linked_device_id || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'SURVEYOR', linked_device_id: '' });
  };

  const toggleLock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await axios.patch(`${API_URL}/admin/users/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
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
                <td className="p-4">
                  {user.linked_device_id ? (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono border flex items-center gap-1 w-fit">
                      <Smartphone size={10}/> {user.linked_device_id}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic text-xs">None</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  <button onClick={() => openEditModal(user)} className="text-ashoka hover:text-navy transition-colors" title="Edit">
                    <Edit size={18} />
                  </button>
                  {user.username !== 'superadmin' && (
                    <>
                      <button
                        onClick={() => toggleLock(user.id, user.status)}
                        className={`${user.status === 'ACTIVE' ? 'text-orange-500 hover:text-orange-700' : 'text-green-500 hover:text-green-700'} transition-colors`}
                        title="Lock/Unlock"
                      >
                        {user.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                      <button onClick={() => handleDelete(user.id, user.username)} className="text-red-500 hover:text-red-700" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-navy p-4 text-white flex justify-between items-center">
              <h2 className="font-bold">{editingUser ? 'Edit User' : 'Register New User'}</h2>
              <button onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input required className="w-full border rounded p-2 outline-none"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                <input required className="w-full border rounded p-2 outline-none bg-gray-50" disabled={!!editingUser}
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{editingUser ? 'New Password (Optional)' : 'Initial Password'}</label>
                <input type="password" className="w-full border rounded p-2 outline-none"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                  <select className="w-full border rounded p-2 outline-none"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="SURVEYOR">Surveyor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assign Device</label>
                  <select className="w-full border rounded p-2 outline-none"
                    value={formData.linked_device_id} onChange={e => setFormData({...formData, linked_device_id: e.target.value})}>
                    <option value="">No Device</option>
                    {devices.filter(d => d.status === 'ACTIVE').map(d => (
                      <option key={d.id} value={d.device_identifier}>{d.device_identifier}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button className="w-full bg-saffron text-white py-3 rounded font-bold hover:bg-orange-500 mt-4 transition-colors">
                {editingUser ? 'Update Account' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
