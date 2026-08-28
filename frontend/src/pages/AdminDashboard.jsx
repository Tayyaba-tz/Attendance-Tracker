import { useEffect, useState } from "react";
import api from "../api";

export default function AdminDashboard() {
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [studentIds, setStudentIds] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [classesRes, usersRes] = await Promise.all([
        api.get("/classes"),
        api.get("/users"),
      ]);
      setClasses(classesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError("Could not load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "student");

  function handleStudentToggle(id) {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleCreateClass(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !teacherId || studentIds.length === 0) {
      setFormError("Please provide a class name, a teacher, and at least one student.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/classes", {
        name: name.trim(),
        teacherId: Number(teacherId),
        studentIds,
      });
      setName("");
      setTeacherId("");
      setStudentIds([]);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.error || "Could not create class.");
    } finally {
      setSubmitting(false);
    }
  }

  function userName(id) {
    return users.find((u) => u.id === id)?.name || `#${id}`;
  }

  if (loading) return <p className="page-status">Loading...</p>;
  if (error) return <p className="page-status error-message">{error}</p>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>

      <section>
        <h2>Classes</h2>
        {classes.length === 0 ? (
          <p>No classes yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Teacher</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{userName(c.teacherId)}</td>
                  <td>{c.studentIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Create a class</h2>
        <form onSubmit={handleCreateClass} className="create-class-form">
          <label htmlFor="class-name">Class name</label>
          <input
            id="class-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="teacher-select">Teacher</label>
          <select
            id="teacher-select"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">-- Select a teacher --</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <fieldset>
            <legend>Students</legend>
            {students.map((s) => (
              <label key={s.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={studentIds.includes(s.id)}
                  onChange={() => handleStudentToggle(s.id)}
                />
                {s.name}
              </label>
            ))}
          </fieldset>

          {formError && (
            <p role="alert" className="error-message">
              {formError}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create class"}
          </button>
        </form>
      </section>
    </div>
  );
}
