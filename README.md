# Issue Tracker System

## Features

- User registration and login with JWT authentication
- Create, edit, and delete issues
- Assign issues to team members
- Status tracking: Open, In Progress, Closed
- Comments on issues
- Activity log per issue
- Dashboard with issue counts by status
- Team member management with email invite support
- Avatar upload support

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, React Router, Axios, Vite |
| Backend  | Node.js, Express 5                  |
| Database | MongoDB (Mongoose)                  |
| Auth     | JWT, bcryptjs                       |
| Email    | Nodemailer (optional SMTP)          |
| Deploy   | Vercel (client), Render (server)    |

---

## Project Structure

```
Issue-Tracker-System/
├── client/        # React frontend (Vite)
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   └── vercel.json
└── server/        # Express backend
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    └── server.js
```

---

## API Overview

All routes are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Auth - `/api/auth`

| Method | Endpoint    | Description         | Auth |
| ------ | ----------- | ------------------- | ---- |
| POST   | `/register` | Register a new user | No   |
| POST   | `/login`    | Login and get token | No   |
| GET    | `/me`       | Get current user    | Yes  |

### Issues - `/api/issues`

| Method | Endpoint          | Description              | Auth |
| ------ | ----------------- | ------------------------ | ---- |
| GET    | `/`               | List all issues          | Yes  |
| POST   | `/`               | Create an issue          | Yes  |
| GET    | `/:id`            | Get issue by ID          | Yes  |
| PUT    | `/:id`            | Update an issue          | Yes  |
| DELETE | `/:id`            | Delete an issue          | Yes  |
| GET    | `/:id/comments`   | Get comments on an issue | Yes  |
| POST   | `/:id/comments`   | Add a comment            | Yes  |
| GET    | `/:id/activities` | Get activity log         | Yes  |

### Dashboard - `/api/dashboard`

| Method | Endpoint | Description                | Auth |
| ------ | -------- | -------------------------- | ---- |
| GET    | `/`      | Get issue counts by status | Yes  |

### Users - `/api/users`

| Method | Endpoint     | Description           | Auth |
| ------ | ------------ | --------------------- | ---- |
| GET    | `/`          | List all users        | Yes  |
| PUT    | `/me/avatar` | Update avatar         | Yes  |
| POST   | `/invite`    | Invite users by email | Yes  |
| DELETE | `/:id`       | Remove a team member  | Yes  |

### Projects - `/api/projects`

| Method | Endpoint | Description      | Auth |
| ------ | -------- | ---------------- | ---- |
| GET    | `/`      | List projects    | Yes  |
| POST   | `/`      | Create a project | Yes  |
| PUT    | `/:id`   | Update a project | Yes  |
| DELETE | `/:id`   | Delete a project | Yes  |

---

## Environment Variables

### Server (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb_connection_string
JWT_SECRET=jwt_secret
CLIENT_URL= https://issue-tracker-system-psi.vercel.app

# Optional - email invites
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=@email.com
SMTP_PASS=smtp_password
INVITE_FROM=no-reply@example.com
```

---

## Setup

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/oscarrego789/issue-tracker-system.git
cd issue-tracker-system
```

### 2. Install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Configure environment variables

Copy the examples above into `server/.env` and `client/.env` with your own values.

### 4. Run locally

```bash
# Terminal 1 - backend
cd server
npm run dev

# Terminal 2 - frontend
cd client
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## Deployment

### Frontend - Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add `VITE_API_URL` in Vercel environment variables pointing to your deployed backend.
5. Deploy. The `vercel.json` in the client handles SPA routing rewrites automatically.

### Backend - Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Point it to the `server` directory.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add all server environment variables in the Render dashboard.
5. Deploy. Render provides a public URL to use as `VITE_API_URL` on Vercel.

### Live URL

Frontend:
https://issue-tracker-system-psi.vercel.app

Backend:
https://issue-tracker-system-2yc0.onrender.com

---


