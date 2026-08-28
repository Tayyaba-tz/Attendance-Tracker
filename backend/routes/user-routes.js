const express = require("express");
const { users } = require("../data/store");
const { requireAuth, requireRole } = require("../middleware/auth-middleware");

const router = express.Router();

// GET /users — admin only, returns all users WITHOUT password hashes
router.get("/", requireAuth, requireRole("admin"), (req, res) => {
  const safeUsers = users.map(({ password, ...safe }) => safe);
  res.json(safeUsers);
});

module.exports = router;
