import { useState, useEffect } from "react";
import api from "../../services/api";

export default function AdminPlannings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [coachFilter, setCoachFilter] = useState("");

  useEffect(() => {
    fetchPlannings();
  }, [mois, annee, coachFilter]);

  const fetchPlannings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ mois, annee });
      if (coachFilter) params.append("coach_id", coachFilter);
      const res = await api.get(`/admin/plannings?${params}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMois = () => {
    if (mois === 1) {
      setMois(12);
      setAnnee((a) => a - 1);
    } else setMois((m) => m - 1);
  };
  const nextMois = () => {
    if (mois === 12) {
      setMois(1);
      setAnnee((a) => a + 1);
    } else setMois((m) => m + 1);
  };

  const MOIS_NOMS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const tauxColor = (taux) => {
    if (taux >= 80) return "text-green-600";
    if (taux >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const tauxBg = (taux) => {
    if (taux >= 80) return "bg-green-500";
    if (taux >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-[#1E3A5F]">Schedules</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMois}
            className="w-9 h-9 bg-white rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-[#1E3A5F]"
          >
            ←
          </button>
          <span className="bg-[#1E3A5F] text-white px-5 py-2 rounded-xl font-bold text-sm min-w-40 text-center">
            {MOIS_NOMS[mois - 1]} {annee}
          </span>
          <button
            onClick={nextMois}
            className="w-9 h-9 bg-white rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-[#1E3A5F]"
          >
            →
          </button>
        </div>
      </div>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "📋",
              label: "Active schedules",
              value: data.stats.total_plannings,
              color: "bg-blue-50",
            },
            {
              icon: "📅",
              label: "Total sessions",
              value: data.stats.total_seances,
              color: "bg-purple-50",
            },
            {
              icon: "✅",
              label: "Completed sessions",
              value: data.stats.total_realisees,
              color: "bg-green-50",
            },
            {
              icon: "📈",
              label: "Overall rate",
              value: `${data.stats.taux_global}%`,
              color: "bg-orange-50",
            },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div
                className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-xl mb-3`}
              >
                {icon}
              </div>
              <p className="text-2xl font-black text-[#1E3A5F]">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coach filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <select
          value={coachFilter}
          onChange={(e) => setCoachFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          <option value="">All coaches</option>
          {data?.coaches?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Schedules table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.plannings?.length ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p>No schedule this month</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Coach</th>
                <th className="px-6 py-4">Sessions</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.plannings.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#EBF5FB] text-[#1E3A5F] rounded-xl flex items-center justify-center font-bold text-sm">
                        {p.client
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="font-semibold text-gray-800">
                        {p.client}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{p.coach}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {p.realisees}/{p.total_seances}
                  </td>
                  <td className="px-6 py-4 w-40">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${tauxBg(p.taux)} h-2 rounded-full transition-all`}
                        style={{ width: `${p.taux}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-sm ${tauxColor(p.taux)}`}>
                      {p.taux}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.statut === "actif"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.statut === "actif" ? "active" : p.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
