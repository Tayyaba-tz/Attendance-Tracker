# PROMPTS.md

This file logs the prompts used to build the Attendance Tracker app, in the order they were used.

> **Note:** Personalize this before submitting — add your own notes on what you changed after each prompt, and remove/adjust anything that doesn't match what you actually did.

---

## Backend: Seed data
**Prompt:** "Create a file data/store.js that exports in-memory arrays: users, classes, and attendanceRecords. Seed it with one admin user, one teacher user, and two student users — passwords should be hashed with bcryptjs at startup using an async IIFE. Seed one class taught by the teacher with both students enrolled."

**Notes:** Extended to 5 students instead of 2 for a more realistic class size.

---

## Backend: Auth routes
**Prompt:** "Create an Express router in routes/auth-routes.js with a POST /login route. It should accept email and password, find the user in data/store.js's users array, compare the password with bcryptjs, and if valid, sign a JWT (using process.env.JWT_SECRET) containing the user's id, name, and role, with a 1-day expiry. Return the token and basic user info (not the password) in the response. Return 401 with a clear error message on invalid credentials."

**Notes:** Verified the password hash is never included in the response — it wasn't, on the first try.

---

## Backend: Auth middleware
**Prompt:** "Create Express middleware in middleware/auth-middleware.js with two functions: requireAuth, which reads a Bearer token from the Authorization header, verifies it with jsonwebtoken and process.env.JWT_SECRET, and attaches the decoded user to req.user (or returns 401 if missing/invalid); and requireRole(role), which returns a middleware that checks req.user.role matches the given role (or an array of allowed roles), returning 403 if not."

---

## Backend: Class routes
**Prompt:** "In routes/class-routes.js, add: GET /classes (admin only, returns all classes), POST /classes (admin only, creates a class with a name, teacherId, and studentIds array), GET /classes/mine (teacher only, returns classes where teacherId matches req.user.id). Use requireAuth and requireRole from middleware/auth-middleware.js."

**Notes:** Later added a fourth route not in the original prompt — GET /classes/:id/roster — after discovering the Teacher dashboard had no way to display student names (see IMPROVEMENTS.md).

---

## Backend: Attendance routes
**Prompt:** "In routes/attendance-routes.js, add: POST /attendance (teacher only, accepts classId, date, and an array of {studentId, status}, saves one attendanceRecord per student), GET /attendance/student/:studentId (student can only view their own records — check req.user.id matches the param, or allow admin/teacher), GET /attendance/class/:classId (teacher/admin, returns all records for a class). Use requireAuth and requireRole from middleware/auth-middleware.js."

**Notes:** Manually verified the student-can-only-view-own-records check by testing as student ID 3 trying to view student ID 4's records — correctly got a 403.

---

## Backend: Entry point
**Prompt:** "Create index.js: set up Express, apply cors() and express.json() middleware, mount auth-routes at /api/auth, class-routes at /api/classes, and attendance-routes at /api/attendance, then listen on process.env.PORT with a console log."

**Notes:** Added a users-routes mount and made app.listen wait on the seedReady promise from store.js, so the server doesn't accept requests before password hashing finishes.

---

## Backend: Users route (added after a gap was found)
**Prompt:** "Create a GET /users route, admin only, that returns all users but strips out the password field before sending the response."

**Notes:** This route wasn't in the original plan — it was added once the Admin dashboard needed a way to list teachers and students for the "create class" form.

---

## Frontend: API helper
**Prompt:** "Create src/api.js exporting a configured axios instance with baseURL 'http://localhost:4000/api'. Add a request interceptor that reads a token from localStorage (key 'token') and attaches it as an Authorization: Bearer header if present."

---

## Frontend: Auth context
**Prompt:** "Create an AuthContext in src/context/AuthContext.jsx using React Context and useState. It should store user and token, load them from localStorage on mount, expose a login(email, password) function that calls POST /auth/login via src/api.js, stores the token and user in state and localStorage, and a logout() function that clears both. Export an AuthProvider component and a useAuth() hook."

---

## Frontend: Login page
**Prompt:** "Create a Login page component in src/pages/Login.jsx. It should have email and password inputs with proper <label> elements, a submit button, call the login function from useAuth() (src/context/AuthContext.jsx), show an inline error message (in an element with role='alert') if login fails, and redirect to '/' on success using useNavigate from react-router-dom."

---

## Frontend: Protected routes
**Prompt:** "Create a ProtectedRoute component in src/components/ProtectedRoute.jsx that takes an allowedRoles prop (array). It should use useAuth() to check if a user is logged in and their role is in allowedRoles — if not logged in, redirect to /login; if logged in but wrong role, show a simple 'Access denied' message. Otherwise render its children."

**Follow-up prompt:** "Set up react-router-dom routes in App.jsx: '/login' → Login page, '/' → role-based redirect (admin to /admin, teacher to /teacher, student to /student), '/admin' wrapped in ProtectedRoute allowedRoles=['admin'], '/teacher' wrapped in ProtectedRoute allowedRoles=['teacher'], '/student' wrapped in ProtectedRoute allowedRoles=['student']."

---

## Frontend: Admin dashboard
**Prompt:** "Create an Admin dashboard page. On load, fetch all classes via GET /classes using src/api.js. Show a table of classes with their teacher and student count. Add a simple form to create a new class: name input, and multi-select dropdowns for teacher and students (fetch a GET /users endpoint). On submit, POST to /classes and refresh the list."

**Notes:** GET /users didn't exist yet at this point — this prompt is what surfaced the need for it (see the Users route entry above).

---

## Frontend: Teacher dashboard
**Prompt:** "Create a Teacher dashboard. On load, fetch the teacher's classes via GET /classes/mine. Let the teacher pick a class and a date, then show a list of that class's students each with a Present/Absent toggle (default unset, not defaulting to present). On submit, POST to /attendance with the classId, date, and an array of {studentId, status} for every student, then show a success message."

**Notes:** First version showed "Student #id" instead of names, since teachers don't have access to the admin-only /users route. Fixed by adding the /classes/:id/roster endpoint and wiring the dashboard to use it — see IMPROVEMENTS.md.

---

## Frontend: Student dashboard
**Prompt:** "Create a Student dashboard. On load, fetch the logged-in student's attendance via GET /attendance/student/:studentId (use the id from useAuth()'s user). Show a table of date + status, and calculate + display an attendance percentage (present days / total days * 100, rounded to 1 decimal)."

---

## Frontend: Navbar
**Prompt:** "Create a simple Navbar component showing the logged-in user's name and role, and a Logout button that calls logout() from useAuth() and redirects to /login."
