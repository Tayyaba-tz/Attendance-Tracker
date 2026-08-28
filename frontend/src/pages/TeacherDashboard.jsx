import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [statuses, setStatuses] = useState({}); // { studentId: "present" | "absent" }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/classes/mine");
        setClasses(res.data);
        if (res.data.length > 0) {
          setSelectedClassId(String(res.data[0].id));
        }
      } catch (err) {
        setError("Could not load your classes.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load the student roster (id + name only) for the selected class.
  useEffect(() => {
    async function loadRoster() {
      if (!selectedClassId) {
        setUsers([]);
        return;
      }
      try {
        const res = await api.get(`/classes/${selectedClassId}/roster`);
        setUsers(res.data);
      } catch (err) {
        setUsers([]); // fall back to showing "Student #id" if this fails
      }
    }
    loadRoster();
  }, [selectedClassId]);

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.id) === selectedClassId),
    [classes, selectedClassId]
  );

  function setStudentStatus(studentId, status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  function studentLabel(id) {
    const found = users.find((u) => u.id === id);
    return found ? found.name : `Student #${id}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!selectedClass) {
      setFormError("Please select a class.");
      return;
    }

    const records = selectedClass.studentIds
      .filter((id) => statuses[id]) // only include students that were marked
      .map((id) => ({ studentId: id, status: statuses[id] }));

    if (records.length === 0) {
      setFormError("Mark at least one student before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/attendance", {
        classId: selectedClass.id,
        date,
        records,
      });
      setSuccessMessage(`Attendance saved for ${selectedClass.name} on ${date}.`);
      setStatuses({});
    } catch (err) {
      setFormError(err.response?.data?.error || "Could not save attendance.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="page-status">Loading...</p>;
  if (error) return <p className="page-status error-message">{error}</p>;
  if (classes.length === 0) {
    return <p className="page-status">You have no assigned classes yet.</p>;
  }

  return (
    <div className="dashboard">
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {user.name}.</p>

      <form onSubmit={handleSubmit} className="attendance-form">
        <label htmlFor="class-select">Class</label>
        <select
          id="class-select"
          value={selectedClassId}
          onChange={(e) => {
            setSelectedClassId(e.target.value);
            setStatuses({});
          }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="date-input">Date</label>
        <input
          id="date-input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {selectedClass && (
          <fieldset>
            <legend>Mark attendance</legend>
            {selectedClass.studentIds.map((studentId) => (
              <div key={studentId} className="attendance-row">
                <span>{studentLabel(studentId)}</span>
                <div className="status-toggle">
                  <button
                    type="button"
                    className={statuses[studentId] === "present" ? "active present" : ""}
                    onClick={() => setStudentStatus(studentId, "present")}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    className={statuses[studentId] === "absent" ? "active absent" : ""}
                    onClick={() => setStudentStatus(studentId, "absent")}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </fieldset>
        )}

        {formError && (
          <p role="alert" className="error-message">
            {formError}
          </p>
        )}
        {successMessage && (
          <p role="status" className="success-message">
            {successMessage}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save attendance"}
        </button>
      </form>
    </div>
  );
}
