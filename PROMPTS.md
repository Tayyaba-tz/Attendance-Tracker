# PROMPTS.md

This file logs all the prompts I used to build the Attendance Tracker app, in the order I used them.

---

## Backend: Seed data
**Prompt:** "Create a file data/store.js that exports in-memory arrays: users, classes, and attendanceRecords. Seed it with one admin user, one teacher user, and two student users. Passwords should be hashed with bcryptjs at startup using an async IIFE. Seed one class taught by the teacher with both students enrolled."

**Notes:** I extended this to 5 students instead of 2 to make the class size more realistic.

---

## Backend: Auth routes
**Prompt:** "Create an Express router in routes/auth-routes.js with a POST /login route. It should accept email and password, find the user in data/store.js's users array, compare the password with bcryptjs, and if valid, sign a JWT using process.env.JWT_SECRET containing the user's id, name, and role, with a 1-day expiry. Return the token and basic user info (not the password) in the response. Return 401 with a clear error message on invalid credentials."

**Notes:** I verified that the password hash is never included in the response. It was not, on the first try.

---

## Backend: Auth middleware
**Prompt:** "Create Express middleware in middleware/auth-middleware.js with two functions: requireAuth, which reads a Bearer token from the Authorization header, verifies it with jsonwebtoken and process.env.JWT_SECRET, and attaches the decoded user to req.user (or returns 401 if missing or invalid); and requireRole(role), which returns a middleware that checks req.user.role matches the given role (or an array of allowed roles), returning 403 if not."

---

## Backend: Class routes
**Prompt:** "In routes/class-routes.js, add: GET /classes (admin only, returns all classes), POST /classes (admin only, creates a class with a name, teacherId, and studentIds array), GET /classes/mine (teacher only, returns classes where teacherId matches req.user.id). Use requireAuth and requireRole from middleware/auth-middleware.js."

**Notes:** I extended this twice later, both times after finding real gaps during review:
1. Added `GET /classes/:id/roster` after discovering the Teacher dashboard had no way to display student names (see IMPROVEMENTS.md).
2. Added `.sort((a, b) => a - b)` to the roster's student list after noticing that removing and re-adding a student to a class broke the display order (see IMPROVEMENTS.md).

---

## Backend: Attendance routes
**Prompt:** "In routes/attendance-routes.js, add: POST /attendance (teacher only, accepts classId, date, and an array of {studentId, status}, saves one attendanceRecord per student), GET /attendance/student/:studentId (student can only view their own records — check req.user.id matches the param, or allow admin/teacher), GET /attendance/class/:classId (teacher/admin, returns all records for a class). Use requireAuth and requireRole from middleware/auth-middleware.js."

**Notes:** I manually verified the student-can-only-view-own-records check by testing as student ID 3 trying to view student ID 4's records. I correctly got a 403.

I also extended this twice later, both times after finding issues in real use:
1. `GET /attendance/student/:studentId` now resolves and attaches a `className` to each record. The original version only returned a `classId`, which was not useful once more than one class existed (see IMPROVEMENTS.md).
2. `POST /attendance` now rejects a second submission for the same class and date with a `409` error, instead of silently creating duplicate records (see IMPROVEMENTS.md).

---

## Backend: Entry point
**Prompt:** "Create index.js: set up Express, apply cors() and express.json() middleware, mount auth-routes at /api/auth, class-routes at /api/classes, and attendance-routes at /api/attendance, then listen on process.env.PORT with a console log."

**Notes:** I added a users-routes mount and made app.listen wait on the seedReady promise from store.js, so the server does not accept requests before password hashing is finished.

---

## Backend: Users route (added after a gap was found)
**Prompt:** "Create a GET /users route, admin only, that returns all users but strips out the password field before sending the response."

**Notes:** This route was not in the original plan. I added it once the Admin dashboard needed a way to list teachers and students for the "create class" form.

---

## Frontend: API helper
**Prompt:** "Create src/api.js exporting a configured axios instance with baseURL 'http://localhost:4000/api'. Add a request interceptor that reads a token from localStorage (key 'token') and attaches it as an Authorization: Bearer header if present."

---

## Frontend: Auth context
**Prompt:** "Create an AuthContext in src/context/AuthContext.jsx using React Context and useState. It should store user and token, load them from localStorage on mount, expose a login(email, password) function that calls POST /auth/login via src/api.js, stores the token and user in state and localStorage, and a logout() function that clears both. Export an AuthProvider component and a useAuth() hook."

---

## Frontend: Login page
**Prompt:** "Create a Login page component in src/pages/Login.jsx. It should have email and password inputs with proper label elements, a submit button, call the login function from useAuth() (src/context/AuthContext.jsx), show an inline error message (in an element with role='alert') if login fails, and redirect to '/' on success using useNavigate from react-router-dom."

---

## Frontend: Protected routes
**Prompt:** "Create a ProtectedRoute component in src/components/ProtectedRoute.jsx that takes an allowedRoles prop (array). It should use useAuth() to check if a user is logged in and their role is in allowedRoles. If not logged in, redirect to /login. If logged in but wrong role, show a simple 'Access denied' message. Otherwise render its children."

**Follow-up prompt:** "Set up react-router-dom routes in App.jsx: '/login' goes to Login page, '/' does a role-based redirect (admin to /admin, teacher to /teacher, student to /student), '/admin' wrapped in ProtectedRoute allowedRoles=['admin'], '/teacher' wrapped in ProtectedRoute allowedRoles=['teacher'], '/student' wrapped in ProtectedRoute allowedRoles=['student']."

---

## Frontend: Admin dashboard
**Prompt:** "Create an Admin dashboard page. On load, fetch all classes via GET /classes using src/api.js. Show a table of classes with their teacher and student count. Add a simple form to create a new class: name input, and multi-select dropdowns for teacher and students (fetch a GET /users endpoint). On submit, POST to /classes and refresh the list."

**Notes:** GET /users did not exist yet at this point. This prompt is what showed me that I needed it (see the Users route entry above).

---

## Frontend: Teacher dashboard
**Prompt:** "Create a Teacher dashboard. On load, fetch the teacher's classes via GET /classes/mine. Let the teacher pick a class and a date, then show a list of that class's students, each with a Present/Absent toggle (default unset, not defaulting to present). On submit, POST to /attendance with the classId, date, and an array of {studentId, status} for every student, then show a success message."

**Notes:** The first version showed "Student #id" instead of names, since teachers do not have access to the admin-only /users route. I fixed this by adding the /classes/:id/roster endpoint and updating the dashboard to use it. See IMPROVEMENTS.md.

---

## Frontend: Student dashboard
**Prompt:** "Create a Student dashboard. On load, fetch the logged-in student's attendance via GET /attendance/student/:studentId (use the id from useAuth()'s user). Show a table of date and status, and calculate and display an attendance percentage (present days divided by total days multiplied by 100, rounded to 1 decimal)."

**Notes:** The original table only had Date and Status columns. Once more than one class existed, seeing "Absent" with no class name was not useful. I added a Class column, backed by the className field added to the backend response. See IMPROVEMENTS.md.

---

## Frontend: Navbar
**Prompt:** "Create a simple Navbar component showing the logged-in user's name and role, and a Logout button that calls logout() from useAuth() and redirects to /login."

---

## A note on how later prompts were used

Partway through the project, I reached Cursor's usage limit (it will be available again next month). From that point on, I switched to Claude's chat interface instead. The difference was that Claude gave me the exact code and told me which file to edit, but I had to manually copy-paste and apply every change ourselves. Nothing was applied automatically. The prompts below are what I actually typed to Claude, written in a conversational way since I were describing bugs rather than writing formal prompts.

---

## Claude chat: fix missing Class column on student dashboard

**Prompt:** "I found an issue. There is no column showing in which class the student was absent or present. I created two more classes and then took the attendance."

**What Claude did:** Claude explained that `attendanceRecords` stored a `classId` but the `/attendance/student/:studentId` route never resolved it to a name, and the frontend table had no column for it either. Claude gave me the updated backend route code to paste in ourselves. I had already made the matching frontend table change on my own.

---

## Claude chat: fix student ordering and add duplicate-attendance prevention

**Prompt:** "2 things to fix: 1. I removed student five from the computer science course, removed student1 and added it later, and now the list of students is not in order. Fix it. 2. I need to show an error if the teacher has already taken the attendance and then tries to take it again."

**What Claude did:** Claude gave me two separate code changes. One for `backend/routes/class-routes.js` to sort the roster by student ID before returning it, and one for `backend/routes/attendance-routes.js` to check for an existing record with the same classId and date before creating new ones, returning a 409 error if found. I applied both manually.

---

## Claude chat: fix a bug introduced by my own manual edit

**Prompt:** (I pasted a screenshot of a terminal error) "Why are these errors occurring? When I take attendance for the first time it says: 'Couldn't save attendance'. When I take it again, it says 'The attendance is already taken'."

**What Claude did:** Claude identified this as a `ReferenceError: created is not defined`, caused by me pasting the duplicate-check snippet into the wrong position in the file, which separated the `const created = []` declaration from where it was used. Instead of giving me another small patch (which risked the same kind of mistake again), Claude gave me the entire corrected file to paste in full.