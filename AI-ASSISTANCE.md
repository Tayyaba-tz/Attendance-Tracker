# AI-ASSISTANCE.md

## Overview

This project is a role-based Attendance Tracker. It has a React frontend and a small Node/Express backend. I built most of it with the help of AI, but I did not just accept whatever the AI gave me. I followed a "prompt, review, and fix" loop, which means I checked the code every time before using it. During the project, I reached Cursor's usage limit, so I switched to Claude (chat interface) for the remaining backend fixes. Claude gave me the exact code I needed, and I applied it ourselves by copying and pasting it into the files, since Cursor could no longer apply changes automatically. I have documented this below because it is an honest part of how the project was actually built.

## Where AI helped the most

**Boilerplate and repetitive structure.** Things like Express router setup, JWT middleware, and React component scaffolding such as the Login form, Navbar, and ProtectedRoute all follow well-known patterns. AI produced correct and working versions of these on the first or second try, which saved me a lot of time compared to writing them from scratch.

**Connecting frontend to backend.** Wiring axios interceptors to attach a JWT token automatically, and setting up the AuthContext to keep login state in sync with localStorage, is easy to get wrong in small ways. For example, forgetting to clear storage on logout, or not reading it back when the page refreshes. AI got this right when I gave it a specific and detailed prompt.

## Where AI needed correction or follow-up

**A missing endpoint the first prompt did not think about.** The Admin dashboard prompt asked for a "GET /users endpoint" assuming it already existed, but it did not. This showed a real gap in my planning. The original backend prompts only covered auth, classes, and attendance, and never included a general user-listing route. To fix this, I had to go back to the backend and add `routes/user-routes.js` before the Admin dashboard could actually work.

**A UX problem that was not obvious until I reviewed the Teacher dashboard.** The first version of the Teacher dashboard showed student IDs like "Student #4" instead of names. This happened because teachers do not have access to the admin-only `/users` route. The AI did not catch this on its own. I had to manually read through the code and trace what data was actually available to notice the problem. The fix was a new backend endpoint called `/classes/:id/roster`, which is scoped so a teacher can only see the roster for a class they actually teach.

**Access-control checks needed manual testing, not just trust.** For routes like `GET /attendance/student/:studentId`, the prompt asked for "student can only view their own records." But the only way to be sure this actually worked was to test it directly. I logged in as one student, then tried to request a different student's ID, and confirmed that I got a 403 error instead of actual data. This worked correctly, but it was not something I could just assume by looking at the code.

## Bugs I only found through real use (after switching from Cursor to Claude chat)

Once Cursor could no longer generate and apply changes directly, I found the remaining bugs by actually using the app with real data. I reported each issue to Claude in chat, and Claude told me what was wrong and gave me the fix to apply manually.

- **Student ordering broke after removing and re-adding a student to a class.** When a student is re-added to a class, their ID gets added to the end of the `studentIds` array instead of going back to their original position. Because of this, the Teacher dashboard showed students in a confusing and seemingly random order. I only noticed this by actually managing class membership through the app.
- **The attendance history table did not show which class a record belonged to.** Once a student had more than one class, seeing "Absent" with only a date and no class name was confusing and not useful.
- **Nothing stopped a teacher from submitting attendance for the same class and date twice.** This would have silently created duplicate records without any warning.

For each bug, I described the problem to Claude, and Claude gave me the exact code change to make along with an explanation of the cause. I then manually opened the file, made the edit, saved it, and restarted the backend to test it. One of these manual edits created a new bug of its own, which was a `ReferenceError: created is not defined`. This happened because I pasted a code snippet into the wrong position in the file instead of replacing the whole function. I reported this new error to Claude, which identified the cause and gave me the complete corrected file to paste in full. This turned out to be a more reliable approach when applying AI-provided code manually, since there is no tool automatically checking that the change is placed correctly.

## Parts written without heavy AI involvement

Small fixes and connecting code, like adjusting the Teacher dashboard's data-fetching `useEffect` to depend on the selected class ID, or tweaking CSS for the status toggle buttons, were done directly without re-prompting the AI.

## Overall takeaway

AI was most useful for producing correct and conventional code quickly, especially when I gave it specific constraints like exact routes, exact validation rules, and exact response shapes. It was least reliable at noticing cross-cutting gaps, such as a dashboard needing data from a route that did not exist yet, or a role not having access to information that another role's route depended on. Those gaps only appeared when I actually read the generated code from start to finish and ran it ourselves. Switching from Cursor, which applies its own changes automatically, to Claude chat, where I had to apply changes manually, was slower and more error-prone in a small but real way. The misplaced-snippet bug above is a good example of this. It showed me that a meaningful part of what a tool like Cursor contributes is not just generating correct code, but also applying it correctly.