# Attendance Tracker

A role-based attendance tracking app with three roles: **Admin**, **Teacher**, and **Student**.

## Structure

- `backend/` — Node.js + Express API, JWT auth, in-memory data (resets on restart)
- `frontend/` — React (Vite) app

## Setup

### Backend
```
cd backend
npm install
npm start
```
Runs on `http://localhost:4000`.

### Frontend
```
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Demo accounts

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@school.com        | admin123    |
| Teacher | teacher@school.com      | teacher123  |
| Student | student1@school.com     | student123  |

(Students 2–5 also exist: `student2@school.com` through `student5@school.com`, same password pattern.)

## What each role can do

- **Admin** — view all classes, create new classes, assign a teacher and students to each class.
- **Teacher** — view their own assigned classes, mark attendance (present/absent) per student for a chosen date.
- **Student** — view their own attendance history and overall attendance percentage.

## Documentation

- `PROMPTS.md` — prompts used during AI-assisted development
- `AI-ASSISTANCE.md` — explanation of how AI helped throughout
- `IMPROVEMENTS.md` — specific manual fixes made after reviewing AI-generated code
