import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// Route protégée — redirige vers login si pas connecté
export function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

// Route selon le rôle — redirige si mauvais rôle
export function RoleRoute({ children, roles }) {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role))
    return <Navigate to="/unauthorized" replace />;

  return children;
}
