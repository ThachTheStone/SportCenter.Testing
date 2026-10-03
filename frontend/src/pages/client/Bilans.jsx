import { useState, useEffect } from "react";
import api from "../../services/api";

const IMC_LABELS = {
  normal: "normal",
  surpoids: "overweight",
  insuffisant: "underweight",
  obesite: "obese",
};

export default function ClientBilans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilans();
  }, []);

  const fetchBilans = async () => {
    try {
      const res = await api.get("/client/bilans");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const imcColor = (statut) =>
    ({
      normal: "text-green-600 bg-green-50 border-green-200",
      surpoids: "text-yellow-600 bg-yellow-50 border-yellow-200",
      insuffisant: "text-blue-600 bg-blue-50 border-blue-200",
      obesite: "text-red-600 bg-red-50 border-red-200",
    })[statut] ?? "text-gray-600 bg-gray-50 border-gray-200";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#1E3A5F]">My assessments</h2>

      {/* Latest BMI, large */}
      {data?.dernier_bilan && (
        <div className="bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm mb-1">
              Latest assessment —{" "}
              {new Date(data.dernier_bilan.date).toLocaleDateString("en-GB")}
            </p>
            <p className="text-5xl font-black">{data.dernier_bilan.imc}</p>
            <p className="text-blue-300 mt-1 capitalize">
              {IMC_LABELS[data.dernier_bilan.imc_statut] ??
                data.dernier_bilan.imc_statut}
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-blue-200 text-xs">Weight</p>
              <p className="font-black text-lg">
                {data.dernier_bilan.poids_kg} kg
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-blue-200 text-xs">Height</p>
              <p className="font-black text-lg">
                {data.dernier_bilan.taille_cm} cm
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Physical assessment history */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-[#1E3A5F] mb-4">
          📊 Physical assessment history
        </h3>
        {!data?.bilans_physiques?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>No assessment recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.bilans_physiques.map((b, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${imcColor(b.imc_statut)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black">{b.imc}</p>
                      <p className="text-xs capitalize font-semibold">
                        {IMC_LABELS[b.imc_statut] ?? b.imc_statut}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">
                        {new Date(b.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex gap-4 text-xs opacity-75">
                        <span>⚖️ {b.poids_kg} kg</span>
                        <span>📏 {b.taille_cm} cm</span>
                        {b.masse_grasse_pct && (
                          <span>🔥 {b.masse_grasse_pct}% BF</span>
                        )}
                        {b.masse_musculaire_pct && (
                          <span>💪 {b.masse_musculaire_pct}% MM</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {i === 0 && (
                    <span className="text-xs bg-white/60 px-2 py-1 rounded-full font-bold">
                      Latest
                    </span>
                  )}
                </div>
                {b.notes && (
                  <p className="mt-2 text-xs italic opacity-70 border-t border-current/20 pt-2">
                    {b.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
