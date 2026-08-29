import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/attendance/student/${user.id}`);
        setRecords(res.data);
      } catch (err) {
        setError("Could not load your attendance records.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  const total = records.length;
  const presentCount = records.filter((r) => r.status === "present").length;
  const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(1) : null;

  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1));

  if (loading) return <p className="page-status">Loading...</p>;
  if (error) return <p className="page-status error-message">{error}</p>;

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>
      <p>Welcome, {user.name}.</p>

      <section className="summary-card">
        <h2>Attendance summary</h2>
        {total === 0 ? (
          <p>No attendance records yet.</p>
        ) : (
          <p>
            You've been present <strong>{presentCount}</strong> out of{" "}
            <strong>{total}</strong> sessions (<strong>{percentage}%</strong>).
          </p>
        )}
      </section>

      <section>
        <h2>History</h2>
        {sorted.length === 0 ? (
          <p>Nothing to show yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.className}</td>
                  <td>
                    <span className={`status-pill ${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
