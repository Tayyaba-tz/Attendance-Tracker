# IMPROVEMENTS.md

## 1. Missing endpoint: Admin dashboard needed a way to list users

**Problem:** The Admin dashboard prompt assumed that a `GET /users` endpoint already existed, so it could fill teacher and student dropdowns when creating a class. But it did not exist. The original backend plan only covered auth, classes, and attendance.

**Before:** There was no `routes/user-routes.js` file at all. The Admin dashboard's "create class" form had no way to know which users were teachers and which were students.

**After:** I added a dedicated route:
```js
// routes/user-routes.js
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  const safeUsers = users.map(({ password, ...safe }) => safe);
  res.json(safeUsers);
});
```

**Why:** This route is admin-only, and it removes the password field before sending the response. Even though the password is already a bcrypt hash, there is no reason to ever send it to the client.

---

## 2. UX/data gap: Teacher dashboard showed student IDs instead of names

**Problem:** The Teacher dashboard fetches a class using `GET /classes/mine`, which only returns `studentIds` as an array of numbers, not names. Teachers do not have access to the admin-only `/users` route, so there was no way to turn an ID into a readable name.

**Before:**
```jsx
function studentLabel(id) {
  const found = users.find((u) => u.id === id);
  return found ? found.name : `Student #${id}`;
}
// `users` was always [] for teachers — every student showed as "Student #4", "Student #5", etc.
```

**After:** I added a scoped roster endpoint that only exposes name and ID, and only for a class the requesting teacher actually teaches (or for an admin):
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
I also updated the Teacher dashboard to fetch this roster whenever the selected class changes, instead of trying to call `/users`, which it never had permission to access.

**Why:** This is a better fix than just giving teachers access to `/users`. It follows the principle of least privilege. A teacher only sees names for students in their own class, not the entire user list, and they never see email addresses.

---

## 3. Access-control verification: confirmed students cannot view each other's records

**Problem:** The `GET /attendance/student/:studentId` route's rule that "students can only see their own records" is easy to get subtly wrong. For example, a mistake could be checking only that a valid token is present, without actually comparing the requested ID to the logged-in user's own ID.

**Verification performed:** I logged in as student ID 3, then manually requested `/api/attendance/student/4` using student 3's token.

**Result:** I correctly received `403 { "error": "You can only view your own attendance" }` instead of another student's data.

**Why this matters:** This is exactly the kind of check that can look correct when you read the code, but only manual testing confirms it actually works correctly at runtime. This is a good example of why testing matters, not just code review.

---

## 4. Bug: student list order broke after removing and re-adding a student

**Problem:** I found this through real use. After removing "Student Five" from the Computer Science class and then removing and re-adding "Student One," the Teacher dashboard's student list appeared in a random and confusing order, for example: Student Two, Student One, Student Four, Student Three. This happened because a re-added student's ID gets appended to the end of the `studentIds` array, so the display order followed insertion order rather than anything meaningful.

**Before:**
```js
const roster = classItem.studentIds.map((id) => {
  const student = users.find((u) => u.id === id);
  return { id, name: student ? student.name : `Student #${id}` };
});
```

**After:**
```js
const roster = classItem.studentIds
  .slice()
  .sort((a, b) => a - b)
  .map((id) => {
    const student = users.find((u) => u.id === id);
    return { id, name: student ? student.name : `Student #${id}` };
  });
```

**Why:** Sorting by ID before mapping guarantees a stable and predictable order, no matter what sequence students were added or removed in. I use `.slice()` first so that `.sort()` does not change the original array in memory.

**How I found and fixed it:** This bug appeared after Cursor's usage limit was reached, so I found it by actually using the app. I described the issue to Claude in chat, Claude gave me the fix, and I applied it manually by editing `backend/routes/class-routes.js`.

---

## 5. Bug: teacher could submit attendance twice for the same class and date

**Problem:** I found this through real use. Nothing stopped a teacher from marking attendance for a class on a specific date, and then doing it again for the same class and date, silently creating duplicate attendance records.

**Before:** `POST /attendance` went straight from validating that the teacher owns the class to creating new records, with no check for existing ones.

**After:**
```js
const alreadyMarked = attendanceRecords.some(
  (r) => r.classId === Number(classId) && r.date === date
);
if (alreadyMarked) {
  return res.status(409).json({
    error: "Attendance for this class on this date has already been recorded.",
  });
}
```

**Why:** A `409 Conflict` status is the correct HTTP code for "this request conflicts with existing state." The check also happens before any records are created, so a rejected request never partially succeeds.

**How I found and fixed it:** Also found after Cursor's usage limit was reached, through direct use of the app. I described the issue to Claude in chat, Claude gave me the fix, and I applied it manually by editing `backend/routes/attendance-routes.js`.

---

## 6. Bug: attendance history did not show which class a record belonged to

**Problem:** I found this through real use. Once more than one class existed, the Student dashboard's attendance table only showed a date and a status like "Absent," with no information about which class that record was for. This made the table useless for a student enrolled in more than one class.

**Before:**
```js
const records = attendanceRecords.filter((r) => r.studentId === requestedId);
res.json(records);
```

**After:**
```js
const records = attendanceRecords
  .filter((r) => r.studentId === requestedId)
  .map((r) => {
    const classItem = classes.find((c) => c.id === r.classId);
    return {
      ...r,
      className: classItem ? classItem.name : `Class #${r.classId}`,
    };
  });
res.json(records);
```

**Why:** Instead of making the frontend fetch class names separately in an extra request, the backend now resolves and attaches `className` directly to each record. This way the frontend can display it without any additional API calls.

**Note on manual editing risk:** While applying this fix to `backend/routes/attendance-routes.js`, I introduced a `ReferenceError: created is not defined` by pasting a Claude-provided snippet into the wrong position in the file. I reported the new error back to Claude, which identified the cause and gave me the entire corrected file to paste in full rather than another small patch. This turned out to be a safer approach when applying code manually, since there is no tool automatically checking that a partial paste fits correctly.