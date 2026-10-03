import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const MOIS_NOMS = [
  "",
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

function SeanceModal({ seance, client, onClose, onSaved }) {
  const [form, setForm] = useState({
    present: true,
    effort_percu: seance.seance_realisee?.effort_percu ?? 7,
    remarques_coach: seance.seance_realisee?.remarques_coach ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/coach/seances/${seance.id}/realiser`, form);
      toast.success(
        form.present ? "Session completed!" : "Absence recorded.",
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-[#1E3A5F]">Session report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="font-semibold text-[#1E3A5F]">{client}</p>
            <p className="text-gray-400">
              {new Date(seance.date).toLocaleDateString("en-GB")} at{" "}
              {seance.heure_debut}
            </p>
          </div>

          {/* Attendance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, present: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${form.present ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                ✅ Present
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, present: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${!form.present ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                ❌ Absent
              </button>
            </div>
          </div>

          {/* Perceived effort */}
          {form.present && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Perceived effort:{" "}
                <span className="text-[#2E75B6] font-bold">
                  {form.effort_percu}/10
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.effort_percu}
                onChange={(e) =>
                  setForm({ ...form, effort_percu: parseInt(e.target.value) })
                }
                className="w-full accent-[#2E75B6]"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Easy</span>
                <span>Moderate</span>
                <span>Intense</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coach notes
            </label>
            <textarea
              rows={3}
              value={form.remarques_coach}
              onChange={(e) =>
                setForm({ ...form, remarques_coach: e.target.value })
              }
              placeholder="Observations, progress, areas to improve..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6] resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateSeanceModal({ onClose, onSaved }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    client_id: "",
    date: "",
    heure_debut: "08:00",
    heure_fin: "09:00",
    lieu: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/coach/clients").then(res => setClients(res.data)).catch(() => toast.error("Error loading clients"));
  }, []);

  const handleSubmit = async () => {
    if (!form.client_id || !form.date || !form.heure_debut) return toast.error("Required fields are missing.");
    setLoading(true);
    try {
      await api.post("/coach/planning/seances", form);
      toast.success("Session scheduled successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-[#1E3A5F]">Schedule a session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            >
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
              <input type="time" value={form.heure_debut} onChange={e => setForm({...form, heure_debut: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="col-start-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input type="time" value={form.heure_fin} onChange={e => setForm({...form, heure_fin: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]" />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.lieu} onChange={e => setForm({...form, lieu: e.target.value})} placeholder="Gym, Outdoor..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]" />
          </div>
        </div>
        <div className="p-5 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-sm font-semibold rounded-xl disabled:opacity-50">
            {loading ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoachPlanning() {
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPlanning();
  }, [mois, annee]);

  const fetchPlanning = async () => {
    setLoading(true);
    try {
      const res = await api.get("/coach/planning", { params: { mois, annee } });
      setData(res.data);
    } catch {
      toast.error("Error while loading");
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

  const totalSeances =
    data?.plannings?.reduce((acc, p) => acc + (p.seances?.length ?? 0), 0) ?? 0;
  const totalRealisees =
    data?.plannings?.reduce(
      (acc, p) =>
        acc +
        (p.seances?.filter((s) => s.seance_realisee?.present).length ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Month navigation header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">Schedule</h2>
          <p className="text-gray-400 text-sm">
            {totalRealisees}/{totalSeances} sessions completed this month
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowCreateModal(true)} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-100 transition shadow-sm">
            + Schedule
          </button>
          <div className="flex items-center gap-1">
          <button
            onClick={prevMois}
            className="w-9 h-9 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
          >
            ←
          </button>
          <div className="bg-[#1E3A5F] text-white px-5 py-2 rounded-xl font-bold text-sm min-w-36 text-center">
            {MOIS_NOMS[mois]} {annee}
          </div>
          <button
            onClick={nextMois}
            className="w-9 h-9 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center justify-center"
          >
            →
          </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.plannings?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>
            No schedule for {MOIS_NOMS[mois]} {annee}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.plannings?.map((planning) => {
            const realisees =
              planning.seances?.filter((s) => s.seance_realisee?.present)
                .length ?? 0;
            const total = planning.seances?.length ?? 0;
            const pct = total > 0 ? Math.round((realisees / total) * 100) : 0;

            return (
              <div
                key={planning.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Client header */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                      {planning.client?.prenom?.[0]}
                      {planning.client?.nom?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[#1E3A5F]">
                        {planning.client?.prenom} {planning.client?.nom}
                      </p>
                      <p className="text-xs text-gray-400">
                        {realisees}/{total} sessions completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2E75B6] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#1E3A5F]">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Sessions */}
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {planning.seances?.map((seance) => {
                    const realisee = seance.seance_realisee;
                    const isPast = new Date(seance.date) < new Date();
                    const isToday =
                      new Date(seance.date).toDateString() ===
                      new Date().toDateString();

                    return (
                      <div
                        key={seance.id}
                        onClick={() =>
                          isPast || isToday
                            ? setModal({
                                seance,
                                client: `${planning.client?.prenom} ${planning.client?.nom}`,
                              })
                            : null
                        }
                        className={`p-3 rounded-xl border-2 transition-all ${
                          realisee?.present === true
                            ? "border-green-200 bg-green-50 cursor-pointer"
                            : realisee?.present === false
                              ? "border-red-200 bg-red-50 cursor-pointer"
                              : isPast || isToday
                                ? "border-blue-200 bg-blue-50 cursor-pointer hover:border-blue-400"
                                : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-gray-600">
                            {new Date(seance.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                          <span className="text-sm">
                            {realisee?.present === true
                              ? "✅"
                              : realisee?.present === false
                                ? "❌"
                                : isPast || isToday
                                  ? "⏳"
                                  : "📅"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {seance.heure_debut}
                        </p>
                        {realisee?.effort_percu && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            Effort: {realisee.effort_percu}/10
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <SeanceModal
          seance={modal.seance}
          client={modal.client}
          onClose={() => setModal(null)}
          onSaved={fetchPlanning}
        />
      )}
      {showCreateModal && (
        <CreateSeanceModal
          onClose={() => setShowCreateModal(false)}
          onSaved={fetchPlanning}
        />
      )}
    </div>
  );
}
