import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">Attendance Tracker</span>
      <span className="navbar-user">
        {user.name} <span className="role-badge">{user.role}</span>
      </span>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}
