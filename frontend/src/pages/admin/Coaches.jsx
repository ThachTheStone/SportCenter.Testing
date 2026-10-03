import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

function CoachModal({ coach, onClose, onSaved }) {
  const [form, setForm] = useState({
    prenom: coach?.prenom ?? "",
    nom: coach?.nom ?? "",
    email: coach?.email ?? "",
    password: "",
    specialite: coach?.specialite ?? "",
    telephone: coach?.telephone ?? "",
    date_embauche: coach?.date_embauche ?? "",
    bio: coach?.bio ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (coach) {
        await api.put(`/admin/coaches/${coach.id}`, form);
        toast.success("Coach updated!");
      } else {
        await api.post("/admin/coaches", form);
        toast.success("Coach created!");
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

  const Field = ({ label, name, type = "text", placeholder, textarea }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6] resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            {coach ? "Edit coach" : "New coach"}
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
          {!coach && (
            <Field
              label="Email *"
              name="email"
              type="email"
              placeholder="coach@sportcenter.ma"
            />
          )}
          {!coach && (
            <Field
              label="Password *"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
            />
          )}
          <Field
            label="Specialty"
            name="specialite"
            placeholder="e.g. Strength training, Cardio..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Phone"
              name="telephone"
              placeholder="06XXXXXXXX"
            />
            <Field label="Hire date" name="date_embauche" type="date" />
          </div>
          <Field
            label="Bio"
            name="bio"
            placeholder="Coach introduction..."
            textarea
          />
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
            {loading ? "Saving..." : coach ? "Update" : "Create coach"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/coaches");
      setCoaches(res.data);
    } catch {
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coach?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/coaches/${id}`);
      toast.success("Coach deleted.");
      fetchCoaches();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Error while deleting.");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (coach) => {
    try {
      await api.put(`/admin/coaches/${coach.id}`, { active: !coach.active });
      toast.success(coach.active ? "Coach deactivated." : "Coach activated.");
      fetchCoaches();
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">
            Coach management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {coaches.length} coaches in total
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="bg-[#1E3A5F] hover:bg-[#2E75B6] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          + New coach
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E3A5F] to-[#2E75B6] rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                    {coach.prenom?.[0]}
                    {coach.nom?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#1E3A5F]">
                      {coach.prenom} {coach.nom}
                    </p>
                    <p className="text-xs text-gray-400">{coach.code_coach}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${coach.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                >
                  {coach.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🏋️</span>
                  <span>{coach.specialite ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📧</span>
                  <span className="truncate">{coach.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📞</span>
                  <span>{coach.telephone ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>👥</span>
                  <span>{coach.clients_count} client(s) assigned</span>
                </div>
              </div>

              {coach.bio && (
                <p className="text-xs text-gray-400 italic mb-4 line-clamp-2">
                  {coach.bio}
                </p>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setModal(coach)}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => toggleActive(coach)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
                    coach.active
                      ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                      : "bg-green-50 hover:bg-green-100 text-green-600"
                  }`}
                >
                  {coach.active ? "🔒 Deactivate" : "✅ Activate"}
                </button>
                <button
                  onClick={() => handleDelete(coach.id)}
                  disabled={deleting === coach.id}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CoachModal
          coach={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchCoaches}
        />
      )}
    </div>
  );
}
