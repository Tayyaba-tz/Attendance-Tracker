const express = require("express");
const { attendanceRecords, classes } = require("../data/store");
const { requireAuth, requireRole } = require("../middleware/auth-middleware");

const router = express.Router();

let nextRecordId = 1;

// POST /attendance — teacher only, marks attendance for a class on a given date
router.post("/", requireAuth, requireRole("teacher"), (req, res) => {
  const { classId, date, records } = req.body;

  if (!classId || !date || !Array.isArray(records)) {
    return res
      .status(400)
      .json({ error: "classId, date, and records (array) are required" });
  }

  const classItem = classes.find((c) => c.id === Number(classId));
  if (!classItem || classItem.teacherId !== req.user.id) {
    return res.status(403).json({ error: "You do not teach this class" });
  }

  const validStudentIds = new Set(classItem.studentIds);
  const created = [];

  for (const record of records) {
    const studentId = Number(record.studentId);
    const status = record.status;

    if (!validStudentIds.has(studentId)) continue; // skip students not in this class
    if (status !== "present" && status !== "absent") continue; // skip invalid status

    const entry = {
      id: nextRecordId++,
      classId: Number(classId),
      date,
      studentId,
      status,
    };
    attendanceRecords.push(entry);
    created.push(entry);
  }

  res.status(201).json({ message: "Attendance recorded", records: created });
});

// GET /attendance/student/:studentId — student can view their own records only
// (teacher and admin can view any student's records)
router.get("/student/:studentId", requireAuth, (req, res) => {
  const requestedId = Number(req.params.studentId);

  const isSelf = req.user.id === requestedId;
  const isStaff = req.user.role === "teacher" || req.user.role === "admin";

  if (!isSelf && !isStaff) {
    return res.status(403).json({ error: "You can only view your own attendance" });
  }

  const records = attendanceRecords.filter((r) => r.studentId === requestedId);
  res.json(records);
});

// GET /attendance/class/:classId — teacher/admin, all records for a class
router.get("/class/:classId", requireAuth, requireRole(["teacher", "admin"]), (req, res) => {
  const classId = Number(req.params.classId);
  const classItem = classes.find((c) => c.id === classId);

  if (!classItem) {
    return res.status(404).json({ error: "Class not found" });
  }

  if (req.user.role === "teacher" && classItem.teacherId !== req.user.id) {
    return res.status(403).json({ error: "You do not teach this class" });
  }

  const records = attendanceRecords.filter((r) => r.classId === classId);
  res.json(records);
});

module.exports = router;
