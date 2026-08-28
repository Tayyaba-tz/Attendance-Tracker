const bcrypt = require("bcryptjs");

const users = [];
const classes = [];
const attendanceRecords = [];

const seedReady = (async () => {
  const hash = (password) => bcrypt.hash(password, 10);

  users.push(
    {
      id: 1,
      name: "Admin User",
      email: "admin@school.com",
      password: await hash("admin123"),
      role: "admin",
    },
    {
      id: 2,
      name: "Jane Teacher",
      email: "teacher@school.com",
      password: await hash("teacher123"),
      role: "teacher",
    },
    {
      id: 3,
      name: "Student One",
      email: "student1@school.com",
      password: await hash("student123"),
      role: "student",
    },
    {
      id: 4,
      name: "Student Two",
      email: "student2@school.com",
      password: await hash("student123"),
      role: "student",
    },
    {
      id: 5,
      name: "Student Three",
      email: "student3@school.com",
      password: await hash("student123"),
      role: "student",
    },
    {
      id: 6,
      name: "Student Four",
      email: "student4@school.com",
      password: await hash("student123"),
      role: "student",
    },
    {
      id: 7,
      name: "Student Five",
      email: "student5@school.com",
      password: await hash("student123"),
      role: "student",
    }
  );

  classes.push({
    id: 1,
    name: "Math 101",
    teacherId: 2,
    studentIds: [3, 4, 5, 6, 7],
  });
})();

module.exports = { users, classes, attendanceRecords, seedReady };
