# IMPROVEMENTS.md

> **Note:** This is a starting draft. Add your own before/after examples if you make further changes, and rewrite the "why" explanations in your own words.

## 1. Missing endpoint: Admin dashboard needed a way to list users

**Problem:** The Admin dashboard prompt assumed a `GET /users` endpoint existed so it could populate teacher/student dropdowns when creating a class. It didn't exist — the original backend plan only covered auth, classes, and attendance.

**Before:** No `routes/user-routes.js` file at all; the Admin dashboard's "create class" form had no way to know which users were teachers vs. students.

**After:** Added a dedicated route:
```js
// routes/user-routes.js
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  const safeUsers = users.map(({ password, ...safe }) => safe);
  res.json(safeUsers);
});
```

**Why:** Admin-only, and explicitly strips the password field before responding — even though the field is already a bcrypt hash, there's no reason to ever send it to the client.

---

## 2. UX/data gap: Teacher dashboard showed student IDs instead of names

**Problem:** The Teacher dashboard fetches a class via `GET /classes/mine`, which only returns `studentIds` (an array of numbers) — not names. Teachers don't have access to the admin-only `/users` route, so there was no way to resolve an ID to a readable name.

**Before:**
```jsx
function studentLabel(id) {
  const found = users.find((u) => u.id === id);
  return found ? found.name : `Student #${id}`;
}
// `users` was always [] for teachers — every student showed as "Student #4", "Student #5", etc.
```

**After:** Added a scoped roster endpoint that only exposes name + id, and only for a class the requesting teacher actually teaches (or for an admin):
```js
// routes/class-routes.js
router.get("/:id/roster", requireAuth, requireRole(["teacher", "admin"]), (req, res) => {
  const classItem = classes.find((c) => c.id === Number(req.params.id));
  if (!classItem) return res.status(404).json({ error: "Class not found" });
  if (req.user.role === "teacher" && classItem.teacherId !== req.user.id) {
    return res.status(403).json({ error: "You do not teach this class" });
  }
  const roster = classItem.studentIds.map((id) => {
    const student = users.find((u) => u.id === id);
    return { id, name: student ? student.name : `Student #${id}` };
  });
  res.json(roster);
});
```
And updated the Teacher dashboard to fetch this whenever the selected class changes, instead of relying on a `/users` call it never had permission for.

**Why:** This is a better fix than just giving teachers access to `/users` — it follows the principle of least privilege (a teacher only sees names for students in their own class, not the entire user list, and never sees emails).

---

## 3. Access-control verification: confirmed students can't view each other's records

**Problem:** The `GET /attendance/student/:studentId` route's access rule ("students can only see their own records") is easy to get subtly wrong — e.g. only checking that *a* valid token was present, without actually comparing the requested ID to the logged-in user's own ID.

**Verification performed:** Logged in as student ID 3, then manually requested `/api/attendance/student/4` with student 3's token.

**Result:** Correctly received `403 { "error": "You can only view your own attendance" }` rather than another student's data.

**Why this matters:** This is exactly the kind of check that can look correct by reading the code, but only manual testing confirms it actually behaves correctly at runtime — a good example of verification catching what code review alone might miss.
