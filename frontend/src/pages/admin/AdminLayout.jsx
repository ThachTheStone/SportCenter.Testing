import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const MENU = [
  { path: "/admin", icon: "📊", label: "Dashboard" },
  { path: "/admin/clients", icon: "👥", label: "Clients" },
  { path: "/admin/coaches", icon: "🏋️", label: "Coaches" },
  { path: "/admin/paiements", icon: "💳", label: "Payments" },
  { path: "/admin/plannings", icon: "📅", label: "Schedules" },
  { path: "/admin/ressources", icon: "📚", label: "Resources" },
  { path: "/admin/alertes", icon: "🔔", label: "Alerts" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/logout");
    } catch (error) {
      console.log(error);
    }
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const isActive = (path) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:block
          ${sidebarOpen ? "w-64" : "w-20"} 
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          bg-[#1E3A5F] text-white flex flex-col transition-all duration-300 shrink-0
        `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {(sidebarOpen || mobileMenuOpen) && (
            <div className={`${!sidebarOpen && "lg:hidden"}`}>
              <p className="font-black text-lg leading-tight">Sport Center</p>
              <p className="text-blue-300 text-xs">Administration</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-8 h-8 bg-white/10 rounded-lg items-center justify-center hover:bg-white/20 transition"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {MENU.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive(path)
                  ? "bg-white/20 text-white font-semibold"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-xl shrink-0">{icon}</span>
              {(sidebarOpen || mobileMenuOpen) && <span className="text-sm truncate">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2E75B6] rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white">
              {user?.name?.[0] ?? "A"}
            </div>
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                <p className="text-blue-300 text-xs truncate">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/30 text-white text-sm py-2 rounded-xl transition group"
          >
            <span className="group-hover:scale-110 transition">🚪</span>
            {(sidebarOpen || mobileMenuOpen) && <span>{loggingOut ? "..." : "Sign out"}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 h-16 sm:h-20">
          <div className="flex items-center gap-4">
            {/* Hamburger (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-xl"
            >
              ☰
            </button>
            
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-xl font-bold text-[#1E3A5F] truncate max-w-[150px] sm:max-w-none">
                {MENU.find((m) => isActive(m.path))?.label ?? "Administration"}
              </h1>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">
                VIP Sport Center — Admin Area
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="relative w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition cursor-pointer"
              >
                🔔
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <p className="text-sm font-bold text-[#1E3A5F]">Notifications</p>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">3 new</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    <p className="text-xs text-gray-500 text-center py-8 px-4 font-medium italic">
                      No new notifications right now.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:shadow-lg hover:shadow-blue-900/20 transition-all border-2 border-transparent hover:border-blue-400"
              >
                {user?.name?.[0] ?? "A"}
              </button>
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden py-1">
                  <div className="px-4 py-4 border-b border-gray-50 bg-gray-50/30">
                    <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer flex items-center gap-3"
                    >
                      <span>🚪</span>
                      <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
