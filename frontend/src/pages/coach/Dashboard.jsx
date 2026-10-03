import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import FadeIn from "../../components/ui/FadeIn";

export default function CoachDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/coach/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <FadeIn delay={100}>
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2E75B6] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl">
          <div>
            <h2 className="text-3xl font-black">Strength and Honor! 🏋️</h2>
            <p className="text-blue-100 mt-2 opacity-80">
              You have {stats?.seances_aujourdhui?.length ?? 0} sessions scheduled today.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Daily Progress</p>
                <p className="text-xl font-bold">Target: 100%</p>
             </div>
             <div className="relative w-20 h-20">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path className="text-white/20" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" fill="none" />
                  <path className="text-white animate-progress" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black">75%</div>
             </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Clients", val: stats?.total_clients, icon: "👥", col: "text-blue-600", bg: "bg-blue-50" },
          { label: "Today's sessions", val: stats?.seances_aujourdhui?.length, icon: "📅", col: "text-purple-600", bg: "bg-purple-50" },
          { label: "Assessments due", val: stats?.bilans_attente, icon: "📋", col: "text-amber-600", bg: "bg-amber-50" },
          { label: "Average rating", val: "4.9", icon: "⭐", col: "text-green-600", bg: "bg-green-50" },
        ].map((item, i) => (
          <FadeIn key={i} delay={200 + i*100}>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center text-lg mb-3`}>
                {item.icon}
              </div>
              <p className={`text-2xl font-black ${item.col}`}>{item.val ?? "—"}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-tight mt-1">{item.label}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <FadeIn delay={600} className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 h-full">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Today's schedule
            </h3>
            {stats?.seances_aujourdhui?.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {stats.seances_aujourdhui.map((s, i) => (
                  <div key={i} className="flex items-center gap-6 relative group">
                    <div className="w-12 h-12 bg-white rounded-2xl border-2 border-blue-500 flex items-center justify-center text-[10px] font-black text-blue-600 z-10 shadow-sm group-hover:scale-110 transition-transform">
                      {s.heure}
                    </div>
                    <div className="flex-1 bg-gray-50 p-4 rounded-2xl group-hover:bg-blue-50 transition-colors border border-transparent group-hover:border-blue-100">
                       <p className="font-bold text-[#1E3A5F]">{s.client_nom}</p>
                       <p className="text-xs text-gray-500 mt-0.5">Focus: {s.objectif ?? "General training"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-4">☕</p>
                <p className="text-gray-400 text-sm italic">No sessions scheduled today. Take the chance to rest!</p>
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={700}>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 h-full">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-6">Recent Clients</h3>
            <div className="space-y-4">
               {stats?.clients_recents?.map((c, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-xs font-bold text-[#1E3A5F]">
                       {c.nom[0]}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-[#1E3A5F]">{c.nom}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{c.formule}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                 </div>
               ))}
               <button onClick={() => navigate('/coach/clients')} className="w-full mt-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-[#1E3A5F] transition-colors">
                  View all my clients
               </button>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
