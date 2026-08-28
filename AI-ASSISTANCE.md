# AI-ASSISTANCE.md

> **Note:** This is a starting draft based on how the project was actually built. Read it over and rewrite it in your own words before submitting — you should be able to explain and defend everything in here.

## Overview

This project (a role-based Attendance Tracker with a React frontend and a small Node/Express backend) was built with AI as a development assistant throughout, following a "prompt → review → fix" loop rather than accepting generated code without checking it.

## Where AI helped most

**Boilerplate and repetitive structure.** Things like Express router setup, JWT middleware, and React component scaffolding (Login form, Navbar, ProtectedRoute) followed well-known patterns. AI produced correct, working versions of these on the first or second prompt, which saved significant time versus writing them from scratch.

**Connecting frontend to backend.** Wiring `axios` interceptors to attach a JWT token automatically, and structuring the `AuthContext` to keep login state in sync with `localStorage`, is easy to get subtly wrong (e.g. forgetting to clear storage on logout, or not reading it back on page refresh). AI got this right when given a specific, detailed prompt.

## Where AI needed correction or follow-up

**A missing endpoint the first prompt didn't anticipate.** The Admin dashboard prompt asked for a "GET /users endpoint" assuming it existed — it didn't. This surfaced a real gap in planning: the original backend prompts (auth, classes, attendance) never accounted for a general user-listing route. Fixing this required going back to the backend and adding `routes/user-routes.js` before the Admin dashboard could actually work.

**A UX gap that wasn't obvious until reviewing the Teacher dashboard.** The first version of the Teacher dashboard showed student IDs (e.g. "Student #4") instead of names, because teachers don't have access to the admin-only `/users` route. This wasn't caught by the AI automatically — it required manually clicking through the dashboard (mentally, by reading the code and tracing what data was actually available) to notice the gap. The fix was a new backend endpoint (`/classes/:id/roster`) scoped so a teacher can only see the roster for a class they actually teach.

**Access-control checks needed manual verification, not just trust.** For routes like `GET /attendance/student/:studentId`, the prompt asked for "student can only view their own records" — but the only way to be confident this was actually enforced was to test it directly: log in as one student, then try requesting a different student's ID, and confirm a 403 comes back rather than data. This was tested manually and did work correctly, but it wasn't something to assume just because the code "looked right."

## Parts written without heavy AI involvement

Small fixes and glue code — like adjusting the Teacher dashboard's data-fetching `useEffect` to depend on the selected class ID, or tweaking CSS for the status toggle buttons — were done directly rather than re-prompting for a small change.

## Overall takeaway

AI was most useful for producing correct, conventional code quickly when given specific constraints (exact routes, exact validation rules, exact response shapes). It was least reliable at anticipating cross-cutting gaps — like a dashboard needing data from a route that didn't exist yet, or a role not having access to information another role's route depended on. Those gaps only surfaced through actually reading the generated code end-to-end and, where possible, running it.
