import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import FadeIn from "../../components/ui/FadeIn";

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/client/dashboard");
      setData(res.data);
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

  const imcColor = (statut) =>
    ({
      normal: "text-green-600",
      surpoids: "text-yellow-600",
      insuffisant: "text-blue-600",
      obesite: "text-red-600",
    })[statut] ?? "text-gray-600";

  return (
    <div className="space-y-6">
      {/* Welcome & VIP Pass Toggle */}
      <FadeIn delay={100}>
        <div className="bg-gradient-to-r from-[#0D1B2A] via-[#1E3A5F] to-[#2E75B6] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-yellow-400/30">
                  Gold Member
                </span>
                <span className="text-blue-200 text-xs font-medium">ID: SC-{data?.client?.id?.toString().padStart(4, '0')}</span>
              </div>
              <h2 className="text-3xl font-black">Hello, {data?.client?.nom} 👋</h2>
              <p className="text-blue-100/80 mt-1 max-w-md">
                Ready for today's session? Your coach is waiting to help you push past your limits.
              </p>
            </div>
            
            <button 
              onClick={() => setShowPass(true)}
              className="bg-white text-[#1E3A5F] px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 group"
            >
              <span className="text-lg">🪪</span> My VIP Pass
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>
      </FadeIn>

      {/* UNIQUE FEATURE: PERFORMANCE RADAR / GROWTH CHART (Visual Only) */}
      <div className="grid lg:grid-cols-3 gap-6">
        <FadeIn delay={200} className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1E3A5F]">📈 Fitness Progress</h3>
              <select className="text-xs bg-gray-50 border-none rounded-lg px-2 py-1 outline-none font-semibold text-gray-500">
                <option>Last 6 months</option>
                <option>This year</option>
              </select>
            </div>
            
            {/* Custom SVG Performance Chart */}
            <div className="relative h-48 w-full group">
              <svg viewBox="0 0 400 100" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#2E75B6', stopOpacity: 0.3}} />
                    <stop offset="100%" style={{stopColor: '#2E75B6', stopOpacity: 0}} />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,80 Q50,70 100,40 T200,50 T300,20 T400,30 L400,100 L0,100 Z" 
                  fill="url(#grad)" 
                />
                <path 
                  d="M0,80 Q50,70 100,40 T200,50 T300,20 T400,30" 
                  fill="none" 
                  stroke="#2E75B6" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-draw"
                />
                {[0, 100, 200, 300, 400].map((x, i) => (
                   <circle key={i} cx={x} cy={x===0?80 : x===100?40 : x===200?50 : x===300?20 : 30} r="4" fill="white" stroke="#2E75B6" strokeWidth="2" />
                ))}
              </svg>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Alerts (Notifications) */}
        <FadeIn delay={300}>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 h-full flex flex-col">
            <h3 className="font-bold text-[#1E3A5F] mb-4 flex items-center justify-between">
              <span>🔔 Alerts</span>
              {data?.alertes?.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />}
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-2 scrollbar-thin">
              {data?.alertes?.length > 0 ? (
                data.alertes.map((alerte) => (
                  <div key={alerte.id} className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <p className="font-bold text-xs text-[#1E3A5F]">{alerte.titre}</p>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{alerte.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 opacity-40">
                  <p className="text-2xl">🌟</p>
                  <p className="text-xs font-semibold mt-2">Everything is in order</p>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Sessions", val: data?.seances_planifiees, icon: "🔥", col: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", val: data?.seances_realisees, icon: "🎯", col: "text-green-600", bg: "bg-green-50" },
          { label: "Attendance", val: `${data?.taux_presence}%`, icon: "🏆", col: "text-amber-600", bg: "bg-amber-50" },
          { label: "Membership", val: data?.cotisation?.statut === 'active' ? 'OK' : '!', icon: "💎", col: "text-purple-600", bg: "bg-purple-50" },
        ].map((item, i) => (
          <FadeIn key={i} delay={400 + i*100}>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 hover:border-blue-100 transition-colors">
              <div className={`w-10 h-10 ${item.bg} rounded-2xl flex items-center justify-center text-lg mb-3`}>
                {item.icon}
              </div>
              <p className={`text-2xl font-black ${item.col}`}>{item.val ?? "—"}</p>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-tight mt-1">{item.label}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Grid bottom */}
      <div className="grid lg:grid-cols-3 gap-6">
        <FadeIn delay={600} className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 shadow-sm h-full border border-gray-50">
            <h3 className="font-bold text-[#1E3A5F] mb-4">🏆 My Personal Coach</h3>
            {data?.coach ? (
              <div className="bg-[#F8FAFC] rounded-2xl p-4 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-[#2E75B6] rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-3 shadow-lg shadow-blue-900/20">
                  {data.coach.nom.split(" ").map(n => n[0]).join("")}
                </div>
                <p className="font-bold text-[#1E3A5F]">{data.coach.nom}</p>
                <p className="text-[#2E75B6] text-xs font-semibold mt-1 uppercase tracking-widest">{data.coach.specialite}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center gap-4">
                   <button className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 hover:scale-110 transition">📞</button>
                   <button className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-green-500 hover:scale-110 transition">💬</button>
                </div>
              </div>
            ) : <p className="text-gray-400 text-sm italic">No coach assigned.</p>}
          </div>
        </FadeIn>

        <FadeIn delay={700} className="lg:col-span-2">
           <div className="bg-white rounded-3xl p-6 shadow-sm h-full border border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1E3A5F]">📅 Upcoming Sessions</h3>
                <button onClick={() => navigate('/client/planning')} className="text-xs font-bold text-blue-500 hover:underline">View the whole month</button>
              </div>
              <div className="space-y-3">
                 {data?.prochaines_seances?.length > 0 ? data.prochaines_seances.map((s, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all cursor-default">
                      <div className="flex items-center gap-4">
                        <div className="bg-white w-12 h-12 rounded-xl shadow-sm flex flex-col items-center justify-center border border-gray-100">
                          <span className="text-[10px] font-black text-blue-500 uppercase">{new Date(s.date).toLocaleDateString('en-GB', {month: 'short'})}</span>
                          <span className="text-lg font-black text-[#1E3A5F] leading-none">{new Date(s.date).getDate()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1E3A5F]">{s.heure}</p>
                          <p className="text-xs text-gray-400 font-medium">✨ {s.lieu ?? "VIP Cardio Zone"}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-200">#0{i+1}</span>
                   </div>
                 )) : <p className="text-center py-8 text-gray-400 italic">Book an appointment with your coach!</p>}
              </div>
           </div>
        </FadeIn>
      </div>

      {/* PASS VIP MODAL */}
      {showPass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0D1B2A]/80 backdrop-blur-md" onClick={() => setShowPass(false)} />
          <FadeIn className="relative w-full max-w-sm">
            <div className="bg-gradient-to-b from-[#1E3A5F] to-[#0D1B2A] rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/10 text-center">
              <div className="mb-6">
                <p className="text-yellow-400 text-xs font-black tracking-[0.3em] uppercase mb-2">Member Pass</p>
                <h3 className="text-2xl font-black">SPORTCENTER VIP</h3>
              </div>
              
              {/* QR CODE Container */}
              <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SPORTCENTER-CLIENT-${data?.client?.id}`} 
                  alt="QR Access" 
                  className="w-40 h-40"
                />
              </div>

              <div className="space-y-1 mb-8">
                <p className="text-lg font-bold">{data?.client?.prenom} {data?.client?.nom}</p>
                <p className="text-blue-300 text-xs font-medium opacity-70">Scan to enter the gym</p>
              </div>

              <button 
                onClick={() => setShowPass(false)}
                className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-sm transition-colors border border-white/5"
              >
                Close
              </button>
            </div>
          </FadeIn>
        </div>
      )}
    </div>
  );
}
