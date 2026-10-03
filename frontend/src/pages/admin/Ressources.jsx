import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const CATEGORIES = ["sport", "nutrition", "recuperation", "motivation"];

const CATEGORIE_LABELS = {
  sport: "Sport",
  nutrition: "Nutrition",
  recuperation: "Recovery",
  motivation: "Motivation",
};

const catBadge = (c) =>
  ({
    sport: "bg-blue-100 text-blue-700",
    nutrition: "bg-green-100 text-green-700",
    recuperation: "bg-purple-100 text-purple-700",
    motivation: "bg-orange-100 text-orange-700",
  })[c] ?? "bg-gray-100 text-gray-600";

function RessourceModal({ ressource, onClose, onSaved }) {
  const [form, setForm] = useState({
    titre: ressource?.titre ?? "",
    contenu: ressource?.contenu ?? "",
    categorie: ressource?.categorie ?? "sport",
    publie: ressource?.publie ?? false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (ressource) {
        await api.put(`/admin/ressources/${ressource.id}`, form);
        toast.success("Resource updated!");
      } else {
        await api.post("/admin/ressources", form);
        toast.success("Resource created!");
      }
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1E3A5F]">
            {ressource ? "Edit resource" : "New resource"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              placeholder="Article title"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.categorie}
                onChange={(e) =>
                  setForm({ ...form, categorie: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, publie: !form.publie })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.publie ? "bg-green-500" : "bg-gray-300"} relative`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.publie ? "left-6" : "left-0.5"}`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {form.publie ? "Published" : "Draft"}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content *
            </label>
            <textarea
              rows={8}
              value={form.contenu}
              onChange={(e) => setForm({ ...form, contenu: e.target.value })}
              placeholder="Write your article here..."
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
            {loading ? "Saving..." : ressource ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRessources() {
  const [ressources, setRessources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("");
  const [publie, setPublie] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    fetchRessources();
  }, [search, categorie, publie, page]);

  const fetchRessources = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/ressources", {
        params: { search, categorie, publie, page },
      });
      setRessources(res.data.data);
      setMeta(res.data);
    } catch {
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await api.delete(`/admin/ressources/${id}`);
      toast.success("Resource deleted.");
      fetchRessources();
    } catch {
      toast.error("Error");
    }
  };

  const togglePublie = async (ressource) => {
    try {
      await api.put(`/admin/ressources/${ressource.id}`, {
        publie: !ressource.publie,
      });
      toast.success(ressource.publie ? "Unpublished." : "Published!");
      fetchRessources();
    } catch {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1E3A5F]">
            Resources & Articles
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {meta?.total ?? 0} articles in total
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="bg-[#1E3A5F] hover:bg-[#2E75B6] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          + New article
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="🔍 Search for an article..."
          className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        />
        <select
          value={categorie}
          onChange={(e) => {
            setCategorie(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORIE_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={publie}
          onChange={(e) => {
            setPublie(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          <option value="">All</option>
          <option value="1">Published</option>
          <option value="0">Drafts</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ressources.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl text-gray-400">
          <p className="text-4xl mb-3">📚</p>
          <p>No articles found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ressources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${catBadge(r.categorie)}`}
                  >
                    {CATEGORIE_LABELS[r.categorie] ?? r.categorie}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${r.publie ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {r.publie ? "✅ Published" : "📝 Draft"}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-[#1E3A5F] mb-2 line-clamp-2">
                {r.titre}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                {r.contenu}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("en-GB")}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePublie(r)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      r.publie
                        ? "bg-yellow-50 hover:bg-yellow-100 text-yellow-600"
                        : "bg-green-50 hover:bg-green-100 text-green-600"
                    }`}
                  >
                    {r.publie ? "🔒 Unpublish" : "🌐 Publish"}
                  </button>
                  <button
                    onClick={() => setModal(r)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
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

      {modal && (
        <RessourceModal
          ressource={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchRessources}
        />
      )}
    </div>
  );
}
