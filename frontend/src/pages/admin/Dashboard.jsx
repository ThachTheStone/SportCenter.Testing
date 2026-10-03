import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import FadeIn from "../../components/ui/FadeIn";

const StatCard = ({ icon, label, value, sub, color, delay = 0 }) => (
  <FadeIn delay={delay}>
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all h-full">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl`}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-[#1E3A5F]">{value ?? "—"}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
      {sub && <p className="text-xs text-green-500 font-semibold mt-1">{sub}</p>}
    </div>
  </FadeIn>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/dashboard");
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <FadeIn delay={100}>
        <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2E75B6] rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-black">Hello, Administrator 👋</h2>
          <p className="text-blue-200 mt-1">
            Here is an overview of your sport center today.
          </p>
        </div>
      </FadeIn>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Active clients"
          value={stats?.total_clients}
          color="bg-blue-50"
          sub={`+${stats?.nouveaux_ce_mois ?? 0} this month`}
          delay={200}
        />
        <StatCard
          icon="🏋️"
          label="Coaches"
          value={stats?.total_coaches}
          color="bg-purple-50"
          delay={300}
        />
        <StatCard
          icon="💰"
          label="Revenue this month"
          value={`${stats?.revenus_mois ?? 0} MAD`}
          color="bg-green-50"
          sub="Confirmed payments"
          delay={400}
        />
        <StatCard
          icon="⚠️"
          label="Unpaid"
          value={stats?.clients_impayes}
          color="bg-red-50"
          sub="Overdue clients"
          delay={500}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions per coach */}
        <FadeIn delay={600} className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">
              Sessions completed this month — by coach
            </h3>
          {stats?.seances_par_coach?.length > 0 ? (
            <div className="space-y-3">
              {stats.seances_par_coach.map((coach, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#EBF5FB] rounded-xl flex items-center justify-center text-lg shrink-0">
                    🏋️
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">
                        {coach.nom_complet}
                      </span>
                      <span className="text-sm font-bold text-[#1E3A5F]">
                        {coach.seances} sessions
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#2E75B6] h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((coach.seances / (stats?.max_seances || 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              No sessions recorded this month.
            </p>
            )}
          </div>
        </FadeIn>

        {/* Alerts */}
        <FadeIn delay={700}>
          <div className="bg-white rounded-2xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-4">
              Recent alerts
            </h3>
          <div className="space-y-3">
            {stats?.alertes?.length > 0 ? (
              stats.alertes.map((alerte, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    alerte.type === "danger"
                      ? "bg-red-50"
                      : alerte.type === "warning"
                        ? "bg-yellow-50"
                        : "bg-blue-50"
                  }`}
                >
                  <span className="text-lg shrink-0">
                    {alerte.type === "danger"
                      ? "🔴"
                      : alerte.type === "warning"
                        ? "🟡"
                        : "🔵"}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      {alerte.titre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alerte.message}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-gray-400 text-sm">No active alerts</p>
              </div>
            )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Clients with overdue payments */}
      <FadeIn delay={800}>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#1E3A5F]">
            Clients with overdue payments
          </h3>
          <button
            onClick={() => navigate("/admin/paiements")}
            className="text-sm text-[#2E75B6] font-semibold hover:underline"
          >
            View all →
          </button>
        </div>
        {stats?.clients_retard?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 text-xs uppercase border-b border-gray-100">
                  <th className="pb-3 pr-4">Client</th>
                  <th className="pb-3 pr-4">Coach</th>
                  <th className="pb-3 pr-4">Amount due</th>
                  <th className="pb-3">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.clients_retard.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-xs font-bold text-red-600">
                          {c.prenom?.[0]}
                          {c.nom?.[0]}
                        </div>
                        <span className="font-medium">
                          {c.prenom} {c.nom}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {c.coach ?? "—"}
                    </td>
                    <td className="py-3 pr-4 font-bold text-red-600">
                      {c.montant_du} MAD
                    </td>
                    <td className="py-3">
                      <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                        {c.jours_retard}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-gray-400 text-sm">
              All clients are up to date with their payments!
            </p>
          </div>
        )}
        </div>
      </FadeIn>
    </div>
  );
}
