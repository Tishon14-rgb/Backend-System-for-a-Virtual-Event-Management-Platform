# Backend-System-for-a-Virtual-Event-Management-Platform
Virtual Event Management Backend

A lightweight Node.js + Express backend for managing virtual events, user authentication, and event registrations — all using in-memory data storage.
Ideal for prototypes, learning, and demonstration purposes.

🚀 Features
🔐 User Authentication

Register and log in using bcrypt password hashing

JWT-based authentication

Supports two roles:

Organizer

Attendee

📅 Event Management

Organizers can create, update, and delete events

Events contain:

Title

Date & time

Description

Participants list (in-memory)

👥 Participant Management

Attendees can register for events

Participant lists stored in memory

Prevents duplicate registrations

📬 Email Notification

On successful registration, a mock asynchronous email is sent

🧱 Tech Stack

Node.js

Express.js

bcryptjs

jsonwebtoken

cors

nodemon (optional, for development)

📦 Installation
git clone <repository-url>
cd virtual-event-platform
npm install

▶️ Running the Server

Development mode (with Nodemon):

npm run dev


Production mode:

npm start


Server runs by default at:

http://localhost:3000

📚 API Endpoints
🔑 Authentication
Method	Endpoint	Description
POST	/register	User registration
POST	/login	User login (returns JWT token)
📅 Events
Method	Endpoint	Description
GET	/events	Get all events
POST	/events	Create event (organizers only)
PUT	/events/:id	Update event (organizers only)
DELETE	/events/:id	Delete event (organizers only)
POST	/events/:id/register	Register attendee for event

Note: All event routes require a valid Authorization: Bearer <token> header.

🔐 Authentication Model

After logging in, users receive a JWT token containing:

{
  "id": 1,
  "email": "user@example.com",
  "role": "organizer"
}


Use this token in all authenticated requests.

📂 In-Memory Data Structure
Users
{
  id,
  name,
  email,
  role, // organizer | attendee
  passwordHash
}

Events
{
  id,
  title,
  date,
  time,
  description,
  organizerId,
  participants: []
}


Restarting the server clears all in-memory data.
