import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  CalendarCheck, 
  LogOut, 
  Activity,
  UserPlus,
  Users 
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Robust parsing of user info from localStorage
  let userInfo = {};
  try {
    const stored = localStorage.getItem('userInfo');
    if (stored && stored !== "undefined") {
      userInfo = JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error parsing user info:", error);
  }
  
  // Ensure userInfo is a valid object
  userInfo = userInfo && typeof userInfo === 'object' ? userInfo : {};
  const isAdmin = userInfo.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  // Storing pre-rendered elements avoids "Objects are not valid" or "Functions are not valid" rendering issues
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Profile', path: '/profile', icon: <UserCircle size={20} /> },
    { name: 'Attendance', path: '/attendance', icon: <CalendarCheck size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Add Employee', path: '/add-employee', icon: <UserPlus size={20} /> });
    // NEW LINK
    navItems.push({ name: 'Staff Attendance', path: '/admin-attendance', icon: <Users size={20} /> });
  }

  return (
    <div className="flex h-screen bg-background text-gray-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-primary text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Activity className="text-accent" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white">RUDRAKSHA</h1>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Hospital IMS</span>
          </div>
        </div>

        <div className="p-6 border-b border-white/5 bg-black/20">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Signed in as</p>
          {/* Safeguard: Ensure we render strings, not objects */}
          <p className="font-bold truncate text-white">
            {typeof userInfo.name === 'string' ? userInfo.name : 'User'}
          </p>
          <p className="text-xs text-accent truncate">
            {typeof userInfo.role === 'string' ? userInfo.role : 'Employee'}
          </p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-accent text-white shadow-lg font-medium' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {/* Render the pre-rendered element directly */}
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-100 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 justify-between shrink-0">
          <h2 className="text-xl font-bold text-primary capitalize tracking-tight">
            {location.pathname.replace('/', '').replace('-', ' ')}
          </h2>
          <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-primary font-bold text-sm">
            {userInfo.name && typeof userInfo.name === 'string' ? userInfo.name.charAt(0) : 'U'}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 text-gray-800">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;