import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const STATUTS = ["actif", "inactif", "suspendu"];

const STATUT_LABELS = {
  actif: "active",
  inactif: "inactive",
  suspendu: "suspended",
};

function ClientModal({ client, coaches, onClose, onSaved }) {
  const [form, setForm] = useState({
    prenom: client?.prenom ?? "",
    nom: client?.nom ?? "",
    email: client?.user?.email ?? "",
    password: "",
    telephone: client?.telephone ?? "",
    date_naissance: client?.date_naissance ?? "",
    adresse: client?.adresse ?? "",
    coach_id: client?.coach_id ?? "",
    statut: client?.statut ?? "actif",
    montant_annuel: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (client) {
        await api.put(`/admin/clients/${client.id}`, form);
        toast.success("Client updated!");
      } else {
        await api.post("/admin/clients", form);
        toast.success("Client created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        Object.values(errors)
          .flat()
          .forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message ?? "Error");
      }
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            {client ? "Edit client" : "New client"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" name="prenom" placeholder="First name" />
            <Field label="Last name *" name="nom" placeholder="Last name" />
          </div>
          {!client && (
            <Field
              label="Email *"
              name="email"
              type="email"
              placeholder="email@example.com"
            />
          )}
          {!client && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Password *"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
              />
              <Field
                label="Annual amount (Price) *"
                name="montant_annuel"
                type="number"
                placeholder="e.g. 5000"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Phone"
              name="telephone"
              placeholder="06XXXXXXXX"
            />
            <Field
              label="Date of birth"
              name="date_naissance"
              type="date"
            />
          </div>
          <Field
            label="Address"
            name="adresse"
            placeholder="Full address"
          />

          {/* Coach */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned coach *
            </label>
            <select
              value={form.coach_id}
              onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            >
              <option value="">Select a coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom_complet}
                </option>
              ))}
            </select>
          </div>

          {/* Status (edit only) */}
          {client && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.statut}
                onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
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
            {loading ? "Saving..." : client ? "Update" : "Create client"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [modal, setModal] = useState(null); // null | 'create' | client
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchCoaches();
  }, []);
  useEffect(() => {
    fetchClients();
  }, [search, statut, coachFilter, page]);

  const fetchCoaches = async () => {
    const res = await api.get("/admin/coaches-list");
    setCoaches(res.data);
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/clients", {
        params: { search, statut, coach_id: coachFilter, page },
      });
      setClients(res.data.data);
      setMeta(res.data);
    } catch {
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDelete(id);
  };

  const executeDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/admin/clients/${id}`);
      toast.success("Client deleted.");
      fetchClients();
    } catch {
      toast.error("Error while deleting.");
    } finally {
      setDeleting(null);
    }
  };

  const statutBadge = (s) => {
    const map = {
      actif: "bg-green-100 text-green-700",
      inactif: "bg-gray-100 text-gray-600",
      suspendu: "bg-red-100 text-red-600",
    };
    return map[s] ?? "bg-gray-100 text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">
            Client management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {meta?.total ?? 0} clients in total
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          + New client
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Search by name or email..."
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
        <select
          value={coachFilter}
          onChange={(e) => {
            setCoachFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          <option value="">All coaches</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom_complet}
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
        ) : clients.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p>No clients found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs text-gray-400 uppercase">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Coach</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#EBF5FB] rounded-xl flex items-center justify-center text-sm font-bold text-[#1E3A5F]">
                          {client.prenom?.[0]}
                          {client.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {client.prenom} {client.nom}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {client.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {client.coach
                        ? `${client.coach.prenom} ${client.coach.nom}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {client.telephone ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(client.date_inscription).toLocaleDateString(
                        "en-GB",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${statutBadge(client.statut)}`}
                      >
                        {STATUT_LABELS[client.statut] ?? client.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(client)}
                          className="w-8 h-8 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteClick(client.id)}
                          disabled={deleting === client.id}
                          className="w-8 h-8 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition disabled:opacity-50 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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

      {/* Modal */}
      {modal && (
        <ClientModal
          client={modal === "create" ? null : modal}
          coaches={coaches}
          onClose={() => setModal(null)}
          onSaved={fetchClients}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h3 className="text-lg font-bold text-[#1E3A5F] mb-2">Confirm deletion</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { executeDelete(confirmDelete); setConfirmDelete(null); }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition cursor-pointer"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
