import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied">
        <h2>Access denied</h2>
        <p>Your role ({user.role}) doesn't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
