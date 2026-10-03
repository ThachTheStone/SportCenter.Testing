import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedRoute, RoleRoute } from "./router/ProtectedRoute";

// Pages Auth
import LoginPage from "./pages/auth/LoginPage";

import RegisterPage from "./pages/auth/RegisterPage";

import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Pages Public
import PublicLayout from "./pages/public/PublicLayout";

// Pages Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";

import AdminClients from "./pages/admin/Clients";

import AdminCoaches from "./pages/admin/Coaches";

import AdminPaiements from "./pages/admin/Paiements";

import AdminRessources from "./pages/admin/Ressources";

import AdminAlertes from "./pages/admin/Alertes";

import AdminPlannings from "./pages/admin/Plannings";

// Pages Coach
import CoachLayout from "./pages/coach/CoachLayout";
import CoachDashboard from "./pages/coach/Dashboard";

import CoachClients from "./pages/coach/Clients";

import CoachPlanning from "./pages/coach/Planning";

import CoachBilans from "./pages/coach/Bilans";

// Pages Client
import ClientLayout from "./pages/client/ClientLayout";
import ClientDashboard from "./pages/client/Dashboard";

import ClientPlanning from "./pages/client/Planning";

import ClientPaiements from "./pages/client/Paiements";

import ClientBilans from "./pages/client/Bilans";

// Page 403
import Unauthorized from "./pages/Unauthorized";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleRoute roles={["admin"]}>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="coaches" element={<AdminCoaches />} />
          <Route path="paiements" element={<AdminPaiements />} />
          <Route path="ressources" element={<AdminRessources />} />
          <Route path="alertes" element={<AdminAlertes />} />
          <Route path="plannings" element={<AdminPlannings />} />
        </Route>

        {/* Coach */}
        <Route
          path="/coach"
          element={
            <RoleRoute roles={["coach", "admin"]}>
              <CoachLayout />
            </RoleRoute>
          }
        >
          <Route index element={<CoachDashboard />} />
          <Route path="clients" element={<CoachClients />} />
          <Route path="planning" element={<CoachPlanning />} />
          <Route path="bilans" element={<CoachBilans />} />
        </Route>

        {/* Client */}
        <Route
          path="/client"
          element={
            <RoleRoute roles={["client"]}>
              <ClientLayout />
            </RoleRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="planning" element={<ClientPlanning />} />
          <Route path="paiements" element={<ClientPaiements />} />
          <Route path="bilans" element={<ClientBilans />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
