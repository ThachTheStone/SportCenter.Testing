import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const IMC_LABELS = {
  normal: "normal",
  surpoids: "overweight",
  insuffisant: "underweight",
  obesite: "obese",
};

function BilanModal({ type, client, onClose, onSaved }) {
  const isPhysique = type === "physique";
  const [form, setForm] = useState(
    isPhysique
      ? { poids_kg: "", taille_cm: "", masse_grasse_pct: "", notes: "" }
      : { tension_arterielle: "", frequence_cardiaque: "", allergies: "", pathologies: "", medicaments: "", notes: "" }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isPhysique) {
        if (!form.poids_kg || !form.taille_cm) return toast.error("Weight and height are required.");
        await api.post(`/coach/clients/${client.id}/bilan-physique`, form);
      } else {
        await api.post(`/coach/clients/${client.id}/bilan-sanitaire`, form);
      }
      toast.success("Assessment added successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error while adding");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === "textarea" ? (
        <textarea
          value={form[name] || ""}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
          rows="3"
        />
      ) : (
        <input
          type={type}
          value={form[name] || ""}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            New {isPhysique ? "Physical" : "Health"} Assessment
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {isPhysique ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg) *" name="poids_kg" type="number" />
                <Field label="Height (cm) *" name="taille_cm" type="number" />
              </div>
              <Field label="Body fat (%)" name="masse_grasse_pct" type="number" />
              <Field label="Notes" name="notes" type="textarea" />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Blood pressure" name="tension_arterielle" placeholder="e.g. 12/8" />
                <Field label="HR (bpm)" name="frequence_cardiaque" type="number" />
              </div>
              <Field label="Allergies" name="allergies" type="textarea" />
              <Field label="Medical conditions" name="pathologies" type="textarea" />
              <Field label="Medication" name="medicaments" type="textarea" />
              <Field label="Medical notes" name="notes" type="textarea" />
            </>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
           <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
             {loading ? "Loading..." : "Save"}
           </button>
        </div>
      </div>
    </div>
  );
}

export default function CoachBilans() {
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bilans, setBilans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBilans, setLoadingBilans] = useState(false);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("/coach/clients");
      setClients(res.data);
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBilans = async (client) => {
    setSelected(client);
    setLoadingBilans(true);
    try {
      const res = await api.get(`/coach/clients/${client.id}/bilans`);
      setBilans(res.data);
    } catch {
      toast.error("Error while loading assessments");
    } finally {
      setLoadingBilans(false);
    }
  };

  const imcColor = (statut) =>
    ({
      normal: "text-green-600 bg-green-50",
      surpoids: "text-yellow-600 bg-yellow-50",
      insuffisant: "text-blue-600 bg-blue-50",
      obesite: "text-red-600 bg-red-50",
    })[statut] ?? "text-gray-600 bg-gray-50";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-[#1E3A5F]">Client assessments</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Client list */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-[#1E3A5F] mb-3 text-sm uppercase tracking-wider">
            My clients
          </h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => fetchBilans(c)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    selected?.id === c.id
                      ? "bg-[#1E3A5F] text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      selected?.id === c.id
                        ? "bg-white/20 text-white"
                        : "bg-[#EBF5FB] text-[#1E3A5F]"
                    }`}
                  >
                    {c.prenom?.[0]}
                    {c.nom_famille?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${selected?.id === c.id ? "text-white" : "text-gray-800"}`}
                    >
                      {c.nom}
                    </p>
                    {c.dernier_imc && (
                      <p
                        className={`text-xs ${selected?.id === c.id ? "text-blue-200" : "text-gray-400"}`}
                      >
                        BMI: {c.dernier_imc} — {IMC_LABELS[c.imc_statut] ?? c.imc_statut}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assessment details */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-3">📋</p>
                <p>Select a client to view their assessments</p>
              </div>
            </div>
          ) : loadingBilans ? (
            <div className="bg-white rounded-2xl shadow-sm flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Physical assessments */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1E3A5F]">
                    📊 Physical assessments — {bilans?.client}
                  </h3>
                  <button onClick={() => setModalType("physique")} className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-semibold transition">
                    + Add
                  </button>
                </div>
                {bilans?.bilans_physiques?.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No physical assessment recorded.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs text-gray-400 uppercase">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Weight</th>
                          <th className="px-4 py-3">Height</th>
                          <th className="px-4 py-3">BMI</th>
                          <th className="px-4 py-3">Body fat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {bilans.bilans_physiques.map((b, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(b.date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {b.poids_kg} kg
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {b.taille_cm} cm
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-bold ${imcColor(b.imc_statut)}`}
                              >
                                {b.imc} — {IMC_LABELS[b.imc_statut] ?? b.imc_statut}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {b.masse_grasse_pct
                                ? `${b.masse_grasse_pct}%`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Health assessments */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center font-bold text-[#1E3A5F]">
                    🏥 Health assessments
                    <span className="ml-2 text-xs font-normal text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
                      Confidential
                    </span>
                  </h3>
                  <button onClick={() => setModalType("sanitaire")} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-semibold transition">
                    + Add
                  </button>
                </div>
                {bilans?.bilans_sanitaires?.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No health assessment recorded.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {bilans.bilans_sanitaires.map((b, i) => (
                      <div
                        key={i}
                        className="bg-red-50 border border-red-100 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-800 text-sm">
                            {new Date(b.date).toLocaleDateString("en-GB")}
                          </p>
                          <div className="flex gap-4 text-sm">
                            {b.tension_arterielle && (
                              <span className="text-gray-600">
                                🫀 {b.tension_arterielle}
                              </span>
                            )}
                            {b.frequence_cardiaque && (
                              <span className="text-gray-600">
                                💓 {b.frequence_cardiaque} bpm
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          {b.allergies && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                Allergies
                              </p>
                              <p className="text-gray-700">{b.allergies}</p>
                            </div>
                          )}
                          {b.pathologies && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                Medical conditions
                              </p>
                              <p className="text-gray-700">{b.pathologies}</p>
                            </div>
                          )}
                          {b.medicaments && (
                            <div>
                              <p className="text-gray-400 font-semibold mb-1">
                                Medication
                              </p>
                              <p className="text-gray-700">{b.medicaments}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {modalType && (
        <BilanModal
          type={modalType}
          client={selected}
          onClose={() => setModalType(null)}
          onSaved={() => fetchBilans(selected)}
        />
      )}
    </div>
  );
}
