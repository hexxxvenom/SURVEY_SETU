import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import { LogOut, LayoutDashboard, FileText, Users, Smartphone, Settings } from 'lucide-react';

export const Layout = () => {
  const { token, role, logout } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" />;
  }

  const isActive = (path: string) => location.pathname === path;
  const linkClass = (path: string) => 
    `flex items-center gap-3 p-3 rounded transition-colors ${isActive(path) ? 'bg-white/20 text-saffron' : 'hover:bg-white/10'}`;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-navy text-white flex flex-col fixed h-full">
        <div className="p-6 text-2xl font-bold border-b border-white/20 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-saffron border-t-transparent ashoka-spinner" />
          SurveySetu
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link to="/" className={linkClass('/')}>
            <LayoutDashboard size={20} className="text-saffron" /> Dashboard
          </Link>
          {(role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR') && (
            <Link to="/surveys" className={linkClass('/surveys')}>
              <FileText size={20} className="text-saffron" /> Surveys
            </Link>
          )}
          {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
            <>
              <Link to="/users" className={linkClass('/users')}>
                <Users size={20} className="text-saffron" /> Users
              </Link>
              <Link to="/devices" className={linkClass('/devices')}>
                <Smartphone size={20} className="text-saffron" /> Devices
              </Link>
            </>
          )}
          {role === 'SUPER_ADMIN' && (
            <Link to="/settings" className={linkClass('/settings')}>
              <Settings size={20} className="text-saffron" /> Settings
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-white/20">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 rounded hover:bg-white/10 transition-colors text-left"
          >
            <LogOut size={20} className="text-saffron" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content — offset by sidebar width */}
      <main className="flex-1 ml-64 p-8 bg-ivory min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
