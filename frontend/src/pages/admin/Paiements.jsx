import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUTS = ["en_attente", "paye", "retard", "annule"];
const METHODES = ["especes", "cheque", "virement", "carte"];

const STATUT_LABELS = {
  en_attente: "pending",
  paye: "paid",
  retard: "overdue",
  annule: "cancelled",
};

const METHODE_LABELS = {
  especes: "Cash",
  cheque: "Cheque",
  virement: "Bank transfer",
  carte: "Card",
};

const statutBadge = (s) =>
  ({
    paye: "bg-green-100 text-green-700",
    en_attente: "bg-yellow-100 text-yellow-700",
    retard: "bg-red-100 text-red-600",
    annule: "bg-gray-100 text-gray-500",
  })[s] ?? "bg-gray-100 text-gray-500";

function PaiementModal({ echeance, onClose, onSaved }) {
  const [form, setForm] = useState({
    echeance_id: echeance.id,
    montant: echeance.montant,
    methode: "especes",
    date_paiement: new Date().toISOString().split("T")[0],
    reference: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post("/admin/paiements", form);
      toast.success("Payment recorded!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const client = echeance.cotisation?.client;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            Record a payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="font-semibold text-[#1E3A5F]">
              {client?.prenom} {client?.nom}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Installment #{echeance.numero} — {echeance.montant} MAD
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Due on{" "}
              {new Date(echeance.date_echeance).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount received (MAD) *
            </label>
            <input
              type="number"
              value={form.montant}
              onChange={(e) => setForm({ ...form, montant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment method *
            </label>
            <select
              value={form.methode}
              onChange={(e) => setForm({ ...form, methode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            >
              {METHODES.map((m) => (
                <option key={m} value={m}>
                  {METHODE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment date *
            </label>
            <input
              type="date"
              value={form.date_paiement}
              onChange={(e) =>
                setForm({ ...form, date_paiement: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Cheque no.
            </label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6] resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "✅ Confirm payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPaiements() {
  const [echeances, setEcheances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [modal, setModal] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);
  useEffect(() => {
    fetchEcheances();
  }, [search, statut, page]);

  const fetchStats = async () => {
    const res = await api.get("/admin/paiements/stats");
    setStats(res.data);
  };

  const fetchEcheances = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/paiements", {
        params: { search, statut, page },
      });
      setEcheances(res.data.data);
      setMeta(res.data);
    } catch {
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const telechargerRecu = async (paiementId, clientNom) => {
    setDownloadingId(paiementId);
    try {
      const res = await api.get(`/admin/paiements/${paiementId}/recu`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-REC-${String(paiementId).padStart(5, "0")}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Receipt downloaded for ${clientNom}`);
    } catch (err) {
      console.log(err);
      toast.error("Error while downloading");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#1E3A5F]">
        Payment management
      </h2>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-400 text-sm">Collected this month</p>
            <p className="text-3xl font-black text-green-600 mt-1">
              {stats.total_encaisse} MAD
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-black text-yellow-600 mt-1">
              {stats.total_en_attente} MAD
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-gray-400 text-sm">Overdue</p>
            <p className="text-3xl font-black text-red-600 mt-1">
              {stats.total_en_retard} MAD
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Search for a client..."
          className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        />
        <select
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          <option value="">All statuses</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {STATUT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : echeances.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>No payments found for these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Coach</th>
                  <th className="px-6 py-4">Installment</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {echeances.map((e) => {
                  const client = e.cotisation?.client;
                  const isRetard =
                    e.statut === "en_attente" &&
                    new Date(e.date_echeance) < new Date();
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#EBF5FB] rounded-lg flex items-center justify-center text-xs font-bold text-[#1E3A5F]">
                            {client?.prenom?.[0]}
                            {client?.nom?.[0]}
                          </div>
                          <span className="font-medium">
                            {client?.prenom} {client?.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {client?.coach
                          ? `${client.coach.prenom} ${client.coach.nom}`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">#{e.numero}/3</td>
                      <td className="px-6 py-4 font-bold text-[#1E3A5F]">
                        {e.montant} MAD
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <span
                          className={
                            isRetard ? "text-red-600 font-semibold" : ""
                          }
                        >
                          {new Date(e.date_echeance).toLocaleDateString(
                            "en-GB",
                          )}
                        </span>
                        {isRetard && (
                          <span className="block text-xs text-red-400">
                            {Math.floor(
                              (new Date() - new Date(e.date_echeance)) /
                                86400000,
                            )}
                            d overdue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${statutBadge(isRetard ? "retard" : e.statut)}`}
                        >
                          {isRetard
                            ? STATUT_LABELS.retard
                            : (STATUT_LABELS[e.statut] ?? e.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {e.statut === "en_attente" ? (
                          <button
                            onClick={() => setModal(e)}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition"
                          >
                            💰 Pay
                          </button>
                        ) : e.statut === "paye" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-green-500 text-xs font-semibold">
                              ✅ Paid
                            </span>
                            <button
                              onClick={() =>
                                telechargerRecu(
                                  e.paiement?.id,
                                  `${client?.prenom} ${client?.nom}`,
                                )
                              }
                              disabled={downloadingId === e.paiement?.id}
                              className="px-2 py-1 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                            >
                              {downloadingId === e.paiement?.id
                                ? "⏳"
                                : "📄 Receipt"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <PaiementModal
          echeance={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            fetchEcheances();
            fetchStats();
          }}
        />
      )}
    </div>
  );
}
