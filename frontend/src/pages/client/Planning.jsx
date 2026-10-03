import { useState, useEffect } from "react";
import api from "../../services/api";

export default function ClientPlanning() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPlanning();
  }, [mois, annee]);

  const fetchPlanning = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/client/planning?mois=${mois}&annee=${annee}`);
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

  const statutStyle = (s) =>
    ({
      realisee: "bg-green-50 border-green-200 text-green-700",
      planifiee: "bg-blue-50 border-blue-200 text-blue-700",
      manquee: "bg-red-50 border-red-200 text-red-700",
    })[s] ?? "bg-gray-50 border-gray-200 text-gray-700";

  const statutIcon = (s) =>
    ({
      realisee: "✅",
      planifiee: "📅",
      manquee: "❌",
    })[s] ?? "📅";

  return (
    <div className="space-y-6">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">My schedule</h2>
          {data && (
            <p className="text-gray-400 text-sm mt-1">
              {data.seances_realisees}/{data.total_seances} sessions completed
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMois}
            className="w-9 h-9 bg-white rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-[#1E3A5F] transition"
          >
            ←
          </button>
          <span className="bg-[#1E3A5F] text-white px-5 py-2 rounded-xl font-bold text-sm min-w-36 text-center">
            {MOIS_NOMS[mois - 1]} {annee}
          </span>
          <button
            onClick={nextMois}
            className="w-9 h-9 bg-white rounded-xl shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-[#1E3A5F] transition"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.seances?.length ? (
        <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <p className="text-5xl mb-3">📭</p>
            <p className="font-semibold">No sessions this month</p>
            <p className="text-sm mt-1">Try another month</p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">
                Monthly progress
              </span>
              <span className="text-sm font-bold text-[#1E3A5F]">
                {data.taux_presence}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#1E3A5F] to-[#2E75B6] h-3 rounded-full transition-all"
                style={{ width: `${data.taux_presence}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{data.seances_realisees} completed</span>
              <span>
                {data.total_seances - data.seances_realisees} remaining
              </span>
            </div>
          </div>

          {/* Sessions grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.seances.map((s, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${statutStyle(s.statut)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm">
                    {new Date(s.date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="text-lg">{statutIcon(s.statut)}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    🕐 {s.heure_debut} — {s.heure_fin}
                  </p>
                  <p>📍 {s.lieu ?? "Main gym"}</p>
                  {s.type_exercice && <p>💪 {s.type_exercice}</p>}
                </div>
                {s.statut === "realisee" && s.effort && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-600">
                        Effort given
                      </span>
                      <span className="text-xs font-bold text-green-700">
                        {s.effort}/10
                      </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${s.effort * 10}%` }}
                      />
                    </div>
                  </div>
                )}
                {s.compte_rendu && (
                  <p className="mt-2 text-xs italic opacity-75">
                    "{s.compte_rendu}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
