const express = require("express");
const { classes, users } = require("../data/store");
const { requireAuth, requireRole } = require("../middleware/auth-middleware");

const router = express.Router();

let nextClassId = 2; // id 1 is already used by the seeded "Math 101" class

// GET /classes — admin only, returns all classes
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  res.json(classes);
});

// POST /classes — admin only, creates a class
router.post("/", requireAuth, requireRole("admin"), (req, res) => {
  const { name, teacherId, studentIds } = req.body;

  if (!name || !teacherId || !Array.isArray(studentIds)) {
    return res
      .status(400)
      .json({ error: "name, teacherId, and studentIds (array) are required" });
  }

  const teacher = users.find((u) => u.id === Number(teacherId) && u.role === "teacher");
  if (!teacher) {
    return res.status(400).json({ error: "teacherId does not match a teacher" });
  }

  const newClass = {
    id: nextClassId++,
    name,
    teacherId: Number(teacherId),
    studentIds: studentIds.map(Number),
  };

  classes.push(newClass);
  res.status(201).json(newClass);
});

// GET /classes/mine — teacher only, returns classes taught by the logged-in teacher
router.get("/mine", requireAuth, requireRole("teacher"), (req, res) => {
  const myClasses = classes.filter((c) => c.teacherId === req.user.id);
  res.json(myClasses);
});

// GET /classes/:id/roster — teacher (who owns the class) or admin,
// returns just {id, name} for each student in the class (no emails/passwords)
router.get("/:id/roster", requireAuth, requireRole(["teacher", "admin"]), (req, res) => {
  const classId = Number(req.params.id);
  const classItem = classes.find((c) => c.id === classId);

  if (!classItem) {
    return res.status(404).json({ error: "Class not found" });
  }

  if (req.user.role === "teacher" && classItem.teacherId !== req.user.id) {
    return res.status(403).json({ error: "You do not teach this class" });
  }

  const roster = classItem.studentIds.map((id) => {
    const student = users.find((u) => u.id === id);
    return { id, name: student ? student.name : `Student #${id}` };
  });

  res.json(roster);
});

module.exports = router;
