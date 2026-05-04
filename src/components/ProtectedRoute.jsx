import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  // agency only access
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <Navigate to="/login" />;
  }

  return children;
}