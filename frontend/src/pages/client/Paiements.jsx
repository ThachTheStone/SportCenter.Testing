import { useState, useEffect } from "react";
import api from "../../services/api";

export default function ClientPaiements() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaiements();
  }, []);

  const fetchPaiements = async () => {
    try {
      const res = await api.get("/client/paiements");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statutStyle = (e) => {
    if (e.statut === "paye") return "bg-green-50 border-green-200";
    if (e.est_en_retard) return "bg-red-50 border-red-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const statutBadge = (e) => {
    if (e.statut === "paye")
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
          ✅ Paid
        </span>
      );
    if (e.est_en_retard)
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
          ⚠️ Overdue
        </span>
      );
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
        ⏳ Pending
      </span>
    );
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#1E3A5F]">My payments</h2>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-[#1E3A5F]">
            {data?.montant_annuel ?? 0}
          </p>
          <p className="text-gray-400 text-sm mt-1">MAD / year</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-green-600">
            {data?.total_paye ?? 0}
          </p>
          <p className="text-gray-400 text-sm mt-1">MAD paid</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-black text-yellow-600">
            {data?.total_restant ?? 0}
          </p>
          <p className="text-gray-400 text-sm mt-1">MAD remaining</p>
        </div>
      </div>

      {/* Payment progress bar */}
      {data?.montant_annuel > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">
              Payment progress
            </span>
            <span className="text-sm font-bold text-[#1E3A5F]">
              {Math.round((data.total_paye / data.montant_annuel) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
              style={{
                width: `${Math.round((data.total_paye / data.montant_annuel) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Installments */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#1E3A5F]">Installment details</h3>
        {data?.echeances?.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <p className="text-4xl mb-2">💳</p>
            <p>No installments found</p>
          </div>
        ) : (
          data?.echeances?.map((e, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${statutStyle(e)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#1E3A5F] font-black text-lg shadow-sm">
                    {e.numero}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      Installment no. {e.numero}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due on{" "}
                      {new Date(e.date_echeance).toLocaleDateString("en-GB")}
                    </p>
                    {e.paiement && (
                      <p className="text-xs text-green-600 mt-1">
                        Paid on{" "}
                        {new Date(e.paiement.date).toLocaleDateString("en-GB")}{" "}
                        — {e.paiement.methode}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#1E3A5F]">
                    {e.montant} MAD
                  </p>
                  <div className="mt-1">{statutBadge(e)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
