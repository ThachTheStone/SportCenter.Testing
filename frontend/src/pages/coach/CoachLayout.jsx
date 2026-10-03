import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const MENU = [
  { path: "/coach", icon: "📊", label: "Dashboard" },
  { path: "/coach/clients", icon: "👥", label: "My clients" },
  { path: "/coach/planning", icon: "📅", label: "Schedule" },
  { path: "/coach/bilans", icon: "📋", label: "Assessments" },
];

export default function CoachLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
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
    path === "/coach"
      ? location.pathname === "/coach"
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
          bg-gradient-to-b from-[#1E3A5F] to-[#2E75B6] text-white flex flex-col transition-all duration-300 shrink-0
        `}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {(sidebarOpen || mobileMenuOpen) && (
            <div className={`${!sidebarOpen && "lg:hidden"}`}>
              <p className="font-black text-lg leading-tight">Sport Center</p>
              <p className="text-blue-200 text-xs">Coach Area</p>
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

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white">
              {user?.name?.[0] ?? "C"}
            </div>
            {(sidebarOpen || mobileMenuOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                <p className="text-blue-200 text-xs truncate">Coach</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/30 text-white text-sm py-2 rounded-xl transition"
          >
            <span>🚪</span>
            {(sidebarOpen || mobileMenuOpen) && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 h-16 sm:h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl text-xl"
            >
              ☰
            </button>
            <div className="hidden xs:block">
              <h1 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">
                {MENU.find((m) => isActive(m.path))?.label ?? "Coach Area"}
              </h1>
              <p className="hidden sm:block text-gray-400 text-xs mt-0.5">
                VIP Sport Center — Coach Area
              </p>
            </div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#2E75B6] rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-200">
            {user?.name?.[0] ?? "C"}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
