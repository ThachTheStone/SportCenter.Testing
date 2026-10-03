import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const IMC_LABELS = {
  normal: "normal",
  surpoids: "overweight",
  insuffisant: "underweight",
  obesite: "obese",
};

function BilanPhysiqueModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    taille_cm: "",
    poids_kg: "",
    tour_taille: "",
    tour_hanches: "",
    tour_poitrine: "",
    masse_grasse_pct: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/coach/clients/${client.id}/bilan-physique`, form);
      toast.success("Physical assessment saved!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, unit }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6] pr-10"
        />
        {unit && (
          <span className="absolute right-3 top-2 text-xs text-gray-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-bold text-[#1E3A5F]">
            Physical assessment — {client.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <Field label="Height *" name="taille_cm" unit="cm" />
          <Field label="Weight *" name="poids_kg" unit="kg" />
          <Field label="Waist circumference" name="tour_taille" unit="cm" />
          <Field label="Hip circumference" name="tour_hanches" unit="cm" />
          <Field label="Chest circumference" name="tour_poitrine" unit="cm" />
          <Field label="Body fat" name="masse_grasse_pct" unit="%" />
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

function BilanSanitaireModal({ client, onClose, onSaved }) {
  const [form, setForm] = useState({
    tension_arterielle: "",
    frequence_cardiaque: "",
    allergies: "",
    pathologies: "",
    medicaments: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/coach/clients/${client.id}/bilan-sanitaire`, form);
      toast.success("Health assessment saved!");
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
          <h2 className="font-bold text-[#1E3A5F]">
            Health assessment — {client.nom}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Blood pressure
              </label>
              <input
                value={form.tension_arterielle}
                onChange={(e) =>
                  setForm({ ...form, tension_arterielle: e.target.value })
                }
                placeholder="e.g. 120/80"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Heart rate
              </label>
              <input
                type="number"
                value={form.frequence_cardiaque}
                onChange={(e) =>
                  setForm({ ...form, frequence_cardiaque: e.target.value })
                }
                placeholder="bpm"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
              />
            </div>
          </div>
          {[
            ["allergies", "Allergies"],
            ["pathologies", "Medical conditions"],
            ["medicaments", "Medication"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {label} <span className="text-red-400">(confidential)</span>
              </label>
              <textarea
                rows={2}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={`${label}...`}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6] resize-none"
              />
            </div>
          ))}
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

export default function CoachClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'physique'|'sanitaire', client }

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/coach/clients");
      setClients(res.data);
    } catch {
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const imcColor = (statut) =>
    ({
      normal: "bg-green-100 text-green-700",
      surpoids: "bg-yellow-100 text-yellow-700",
      insuffisant: "bg-blue-100 text-blue-700",
      obesite: "bg-red-100 text-red-600",
    })[statut] ?? "bg-gray-100 text-gray-500";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#1E3A5F]">My clients</h2>
        <p className="text-gray-400 text-sm mt-1">
          {clients.length} clients assigned
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#EBF5FB] rounded-2xl flex items-center justify-center font-bold text-[#1E3A5F] text-lg">
                    {client.prenom?.[0]}
                    {client.nom_famille?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#1E3A5F]">{client.nom}</p>
                    <p className="text-gray-400 text-xs">{client.email}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                  {client.statut === "actif" ? "active" : client.statut}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="font-medium">{client.telephone ?? "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">Latest BMI</p>
                  {client.dernier_imc ? (
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{client.dernier_imc}</p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${imcColor(client.imc_statut)}`}
                      >
                        {IMC_LABELS[client.imc_statut] ?? client.imc_statut}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">Not yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setModal({ type: "physique", client })}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition"
                >
                  📊 Physical assessment
                </button>
                <button
                  onClick={() => setModal({ type: "sanitaire", client })}
                  className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl transition"
                >
                  🏥 Health assessment
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === "physique" && (
        <BilanPhysiqueModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSaved={fetchClients}
        />
      )}
      {modal?.type === "sanitaire" && (
        <BilanSanitaireModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSaved={fetchClients}
        />
      )}
    </div>
  );
}
