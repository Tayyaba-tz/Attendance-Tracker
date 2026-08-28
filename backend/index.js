require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth-routes");
const classRoutes = require("./routes/class-routes");
const attendanceRoutes = require("./routes/attendance-routes");
const userRoutes = require("./routes/user-routes");
const { seedReady } = require("./data/store");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 4000;

// Wait for seed data (password hashing) to finish before accepting requests
seedReady.then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
