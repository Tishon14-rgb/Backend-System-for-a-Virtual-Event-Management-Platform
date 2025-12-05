// middleware/auth.js
const jwt = require("jsonwebtoken");

const SECRET = "SUPER_SECRET_KEY"; // Ideally from env variable

module.exports = {
  authenticate: (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access token missing" });

    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(403).json({ message: "Invalid token" });
    }
  },

  authorizeOrganizer: (req, res, next) => {
    if (req.user.role !== "organizer") {
      return res.status(403).json({ message: "Organizer access only" });
    }
    next();
  },

  SECRET,
};

//Mock Email Utility (utils/sendEmail.js)
// utils/sendEmail.js
module.exports = async function sendEmail(to, subject, message) {
  return new Promise((resolve) => {
    console.log(`📨 Sending email to ${to}...`);
    setTimeout(() => {
      console.log(`✅ Email sent: ${subject}`);
      resolve(true);
    }, 1000);
  });
};

//Authentication Routes (routes/auth.js)
// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const { SECRET } = require("../middleware/auth");

const router = express.Router();

// In-memory stores
const users = []; // exported later

// User Registration
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role)
    return res.status(400).json({ message: "Missing fields" });

  if (!["organizer", "attendee"].includes(role))
    return res.status(400).json({ message: "Invalid role" });

  // Check if email exists
  const existing = users.find((u) => u.email === email);
  if (existing) return res.status(409).json({ message: "Email already exists" });

  const hash = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    name,
    email,
    role,
    passwordHash: hash,
  };

  users.push(newUser);

  // Send email async
  await sendEmail(email, "Welcome to Virtual Events", `Hello ${name}, welcome!`);

  res.json({ message: "User registered successfully" });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(403).json({ message: "Incorrect password" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: "2h" }
  );

  res.json({ message: "Login successful", token });
});

module.exports = { authRouter: router, users };

//Event Routes (routes/events.js)
// routes/events.js
const express = require("express");
const { authenticate, authorizeOrganizer } = require("../middleware/auth");

const router = express.Router();

// In-memory events
const events = [];

// Create Event (Organizer only)
router.post("/", authenticate, authorizeOrganizer, (req, res) => {
  const { title, date, time, description } = req.body;

  if (!title || !date || !time || !description)
    return res.status(400).json({ message: "Missing fields" });

  const newEvent = {
    id: events.length + 1,
    title,
    date,
    time,
    description,
    organizerId: req.user.id,
    participants: [],
  };

  events.push(newEvent);

  res.json({ message: "Event created", event: newEvent });
});

// Get all events
router.get("/", authenticate, (req, res) => {
  res.json(events);
});

// Update Event (Organizer only)
router.put("/:id", authenticate, authorizeOrganizer, (req, res) => {
  const event = events.find((e) => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ message: "Event not found" });

  if (event.organizerId !== req.user.id)
    return res.status(403).json({ message: "Not your event" });

  const { title, date, time, description } = req.body;

  if (title) event.title = title;
  if (date) event.date = date;
  if (time) event.time = time;
  if (description) event.description = description;

  res.json({ message: "Event updated", event });
});

// Delete Event (Organizer only)
router.delete("/:id", authenticate, authorizeOrganizer, (req, res) => {
  const index = events.findIndex((e) => e.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Event not found" });

  const event = events[index];
  if (event.organizerId !== req.user.id)
    return res.status(403).json({ message: "Not your event" });

  events.splice(index, 1);

  res.json({ message: "Event deleted" });
});

// Register for Event (Attendee)
router.post("/:id/register", authenticate, (req, res) => {
  const event = events.find((e) => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ message: "Event not found" });

  if (event.participants.includes(req.user.id))
    return res.status(400).json({ message: "Already registered" });

  event.participants.push(req.user.id);

  res.json({ message: "Registration successful", event });
});

module.exports = { eventRouter: router, events };

//Main Server File (server.js)
// server.js
const express = require("express");
const cors = require("cors");
const { authRouter } = require("./routes/auth");
const { eventRouter } = require("./routes/events");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/register", authRouter);     // POST /register
app.use("/login", authRouter);        // POST /login
app.use("/events", eventRouter);      // GET/POST/PUT/DELETE /events

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

//Test Endpoints Using cURL or Postman
//Register Organizer
POST /register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "pass123",
  "role": "organizer"
}

//Login
POST /login
{
  "email": "alice@example.com",
  "password": "pass123"
}

//Create Event

Header:

Authorization: Bearer <token>


//Body:

POST /events
{
  "title": "Tech Summit",
  "date": "2025-01-20",
  "time": "14:00",
  "description": "Tech event"
}

//Register for Event
POST /events/1/register
Authorization: Bearer <attendee-token>