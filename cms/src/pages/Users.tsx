import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store';
import { UserPlus, Lock, Unlock, Edit, Loader2, X, Smartphone, Trash2, ShieldCheck } from 'lucide-react';

export const Users = () => {
  const { token, role: myRole } = useAuthStore();
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
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete user");
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '',
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
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-navy" size={48}/></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-3xl font-bold text-navy">Personnel Management</h1>
           <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Global User Hierarchy Control</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-saffron text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black uppercase text-xs tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus size={18} /> Register Personnel
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white text-[10px] uppercase tracking-[0.2em]">
              <th className="px-6 py-5 font-black">Full Name</th>
              <th className="px-6 py-5 font-black">Username</th>
              <th className="px-6 py-5 font-black">Authority Role</th>
              <th className="px-6 py-5 font-black">Hardware Bind</th>
              <th className="px-6 py-5 font-black">Status</th>
              <th className="px-6 py-5 font-black text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => {
              // SECURITY HIERARCHY LOGIC
              const isSuper = user.role === 'SUPER_ADMIN';
              const isAdmin = user.role === 'ADMIN';
              const isMe = user.username === 'superadmin'; // or store my ID

              // Can I edit this user?
              // 1. SuperAdmin can edit anyone except other SuperAdmins (if any)
              // 2. Admins can ONLY edit Surveyors
              const canEdit = (myRole === 'SUPER_ADMIN' && !isSuper) || (myRole === 'ADMIN' && user.role === 'SURVEYOR');
              const canDelete = canEdit;
              const canLock = canEdit && !isSuper;

              return (
                <tr key={user.id} className="hover:bg-navy/[0.01] transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isSuper ? 'bg-saffron' : (isAdmin ? 'bg-ashoka' : 'bg-green-400')}`} />
                        <span className="font-black text-navy text-sm">{user.name}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-bold text-xs uppercase tracking-tighter">{user.username}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-[8px] font-black uppercase rounded border ${isSuper ? 'bg-saffron/10 text-saffron border-saffron/20' : (isAdmin ? 'bg-ashoka/10 text-ashoka border-ashoka/20' : 'bg-gray-50 text-gray-400 border-gray-100')}`}>
                        {user.role}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'SURVEYOR' ? (
                      user.linked_device_id ? (
                        <span className="bg-gray-50 text-navy px-2 py-1 rounded text-[10px] font-mono border flex items-center gap-1 w-fit font-bold">
                          <Smartphone size={10}/> {user.linked_device_id}
                        </span>
                      ) : <span className="text-red-300 italic text-[10px] font-bold">UNBOUND</span>
                    ) : <span className="text-gray-300 text-[10px] font-black uppercase">No Link Required</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest border ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <button onClick={() => openEditModal(user)} className="p-2 text-ashoka hover:bg-ashoka/5 rounded-xl transition-colors" title="Edit Profile">
                          <Edit size={18} />
                        </button>
                      )}
                      {canLock && (
                        <button
                          onClick={() => toggleLock(user.id, user.status)}
                          className={`p-2 rounded-xl transition-colors ${user.status === 'ACTIVE' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {user.status === 'ACTIVE' ? <Lock size={18} /> : <Unlock size={18} />}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(user.id, user.username)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      )}
                      {!canEdit && <ShieldCheck size={18} className="text-gray-100 m-2" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-navy p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserPlus size={24} className="text-saffron"/>
                <h2 className="font-black uppercase tracking-[0.2em] text-xs">{editingUser ? 'Modify Personnel' : 'Enroll Personnel'}</h2>
              </div>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                <input required className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-ashoka font-bold text-navy"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <input required className={`w-full border-2 border-gray-100 rounded-2xl p-4 outline-none font-bold text-navy ${editingUser ? 'bg-gray-50' : 'focus:border-ashoka'}`}
                  disabled={!!editingUser}
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{editingUser ? 'New Password (Optional)' : 'Access Key'}</label>
                <input required={!editingUser} type="password" className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-ashoka"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Authority Level</label>
                  <select className="w-full border-2 border-gray-100 rounded-2xl p-4 outline-none focus:border-ashoka font-bold text-xs"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="SURVEYOR">Field Surveyor</option>
                    {myRole === 'SUPER_ADMIN' && <option value="ADMIN">Regional Admin</option>}
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${formData.role !== 'SURVEYOR' ? 'text-gray-200' : 'text-gray-400'}`}>Assign Hardware</label>
                  <select
                    disabled={formData.role !== 'SURVEYOR'}
                    className={`w-full border-2 border-gray-100 rounded-2xl p-4 outline-none font-bold text-xs ${formData.role !== 'SURVEYOR' ? 'bg-gray-50 text-gray-200' : 'focus:border-ashoka'}`}
                    value={formData.linked_device_id} onChange={e => setFormData({...formData, linked_device_id: e.target.value})}>
                    <option value="">No Hardware</option>
                    {devices.filter(d => d.status === 'ACTIVE').map(d => (
                      <option key={d.id} value={d.device_identifier}>{d.device_name || d.device_identifier}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button className={`w-full ${editingUser ? 'bg-ashoka' : 'bg-saffron'} text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4`}>
                {editingUser ? 'Update Personnel Record' : 'Commit Enrollment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
