import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function AdminAlertes() {
  const [dashboard, setDashboard] = useState(null);
  const [notifs, setNotifs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, n] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/alertes"),
      ]);
      setDashboard(d.data);
      setNotifs(n.data);
    } catch (err) {
      console.log(err);
      toast.error("Error while loading");
    } finally {
      setLoading(false);
    }
  };

  const marquerLu = async (id) => {
    try {
      await api.patch(`/admin/alertes/${id}/lu`);
      setNotifs((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, lu: true } : n,
        ),
        non_lues: prev.non_lues - 1,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  const marquerToutLu = async () => {
    try {
      await api.patch("/admin/alertes/tout-lu");
      setNotifs((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, lu: true })),
        non_lues: 0,
      }));
      toast.success("All notifications marked as read");
    } catch (err) {
      console.log(err);
    }
  };

  const copierLien = (lien) => {
    navigator.clipboard.writeText(lien);
    toast.success("Link copied! Send it to the client.");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#2E75B6] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#1E3A5F]">
          Alerts & Notifications
        </h2>
        {notifs?.non_lues > 0 && (
          <button
            onClick={marquerToutLu}
            className="px-4 py-2 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-sm font-semibold rounded-xl transition"
          >
            ✅ Mark all as read
          </button>
        )}
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-red-400 text-sm font-semibold">
            Overdue payments
          </p>
          <p className="text-3xl font-black text-red-600 mt-1">
            {dashboard?.clients_impayes ?? 0}
          </p>
          <p className="text-red-400 text-xs mt-1">clients affected</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-400 text-sm font-semibold">
            New this month
          </p>
          <p className="text-3xl font-black text-blue-600 mt-1">
            {dashboard?.nouveaux_ce_mois ?? 0}
          </p>
          <p className="text-blue-400 text-xs mt-1">new members</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <p className="text-orange-400 text-sm font-semibold">Notifications</p>
          <p className="text-3xl font-black text-orange-600 mt-1">
            {notifs?.non_lues ?? 0}
          </p>
          <p className="text-orange-400 text-xs mt-1">unread</p>
        </div>
      </div>

      {/* System alerts — alertes[] array from the dashboard */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-[#1E3A5F] mb-4">⚠️ System alerts</h3>
        <div className="space-y-3">
          {dashboard?.alertes?.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">
              No system alerts
            </p>
          )}
          {dashboard?.alertes?.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                a.type === "danger"
                  ? "bg-red-50 border-red-200"
                  : a.type === "warning"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  a.type === "danger"
                    ? "bg-red-500"
                    : a.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{a.titre}</p>
                <p className="text-gray-500 text-sm">{a.message}</p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-bold rounded-full ${
                  a.type === "danger"
                    ? "bg-red-100 text-red-600"
                    : a.type === "warning"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {a.type}
              </span>
            </div>
          ))}

          {/* Overdue clients */}
          {dashboard?.clients_retard?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-600 mb-3">
                Clients with overdue payments (
                {dashboard.clients_retard.length} shown)
              </p>
              <div className="space-y-2">
                {dashboard.clients_retard.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-bold text-sm">
                        {r.prenom?.[0]}
                        {r.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">
                          {r.prenom} {r.nom}
                        </p>
                        <p className="text-xs text-gray-400">
                          Coach · {r.coach}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-sm">
                        {r.montant_du} MAD
                      </p>
                      <p className="text-xs text-red-400">
                        {r.jours_retard} days overdue
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin notifications */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-[#1E3A5F] mb-4">🔔 Notifications</h3>
        {!notifs?.notifications?.length ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">🔔</p>
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 transition ${
                  !n.lu
                    ? "border-orange-200 bg-orange-50 ring-2 ring-orange-200"
                    : "border-gray-100 bg-gray-50 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm shrink-0">
                      🔑
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm text-gray-800">
                          {n.titre}
                        </p>
                        {!n.lu && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{n.message}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {n.lien && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
                          <p className="text-xs text-gray-500 mb-2 font-semibold">
                            🔗 Link to send to the client:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                              {n.lien}
                            </code>
                            <button
                              onClick={() => copierLien(n.lien)}
                              className="px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#2E75B6] text-white text-xs font-bold rounded-lg transition shrink-0"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {!n.lu && (
                    <button
                      onClick={() => marquerLu(n.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      ✓ Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
