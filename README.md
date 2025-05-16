# MSGA Server

**Make Scribble Hub Great Again (MSGA)** is a community-driven initiative aimed at identifying, tracking, and reporting unauthorized translations on
[Scribble Hub](https://scribblehub.com). Our goal is to help administrators identify and remove translations.

## Table of Contents

- [MSGA Server](#msga-server)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Middleware & Protections](#middleware--protections)
- [API Routes](#api-routes)
  - [Auth](#auth)
  - [Users (Admin only)](#users-admin-only)
  - [Works](#works)
- [File Structure](#file-structure)
- [License](#license)
- [Like what I do?](#like-what-i-do)
- [Disclaimer](#disclaimer)

---

This repository contains the backend server for MSGA. If you are looking for the front-end client, please visit [MSGA-client](https://github.com/Decaded/MSGA-client).

- **JWT Authentication** – Secure login with JSON Web Tokens only
- **Rate Limiting** – Brute‑force protection on login and registration
- **Role-based Access Control** – Admin-only user management endpoints
- **Anonymous and Authenticated Work Reporting** – Both guests and registered users can report works
- **CORS Configuration** – Secure cross-origin requests
- **In-memory JSON DB (NyaDB)** – Lightweight file-based storage
- **Centralized Error Handling** – JSON-formatted responses for unexpected errors
- **Custom Logging** – Safe request and error logging with sensitive data redaction

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Decaded/MSGA-server.git
cd MSGA-server
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following configuration:

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET=yourSuperSecretKey
JWT_EXPIRATION=1h
```

---

## Scripts

```bash
npm start      # Starts the server
```

---

## Middleware & Protections

- **CORS** using allowed origins from `.env`
- **JSON Body Parsing**
- **Rate Limiter** (express-rate-limit) on `/MSGA/login` and `/MSGA/register`: 5 requests/minute per IP
- **Safe Logging** – only logs `Authorization` and `Content-Type` headers, masks passwords/tokens in bodies
- **Centralized Error Handler** – returns `{ error: 'Internal server error' }` on uncaught exceptions

---

## API Routes

### Auth

| Method | Endpoint         | Description                              | Response                                                                                     |
| ------ | ---------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| POST   | `/MSGA/login`    | Log in with credentials (rate limited)   | `200` JWT and user info, `401` wrong creds, `403` not approved, `429` too many requests      |
| POST   | `/MSGA/register` | Register new user (rate limited)         | `201` created user, `400` missing/invalid fields, `409` user exists, `429` too many requests |
| POST   | `/MSGA/logout`   | Placeholder (removes session—deprecated) | `200` `{ success: true }`, `403` no token                                                    |

### Users (Admin only)

| Method | Endpoint          | Description                        | Response                                                                                           |
| ------ | ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| GET    | `/MSGA/users`     | Get list of all users              | `200` array of users, `403` not admin, `403/400` malformed token                                   |
| PUT    | `/MSGA/users/:id` | Approve or reject user             | `200` updated user, `400` missing approved, `403` not admin, `404` user not found                  |
| DELETE | `/MSGA/users/:id` | Delete a user (cannot delete self) | `200` `{ success: true }`, `400` delete self, `403` not admin or other admin, `404` user not found |

> All `/users` endpoints require a valid JWT token with admin role.

### Works

| Method | Endpoint                  | Description                                     | Response                                                                  |
| ------ | ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| GET    | `/MSGA/works`             | Retrieve all reported works                     | `200` array of works                                                      |
| POST   | `/MSGA/works`             | Report a new work (anonymous or authenticated)  | `201` new work, `400` missing/invalid URL, `409` duplicate                |
| PUT    | `/MSGA/works/:id`         | Update work fields (user or admin)              | `200` updated work, `403` unauthorized field, `404` not found             |
| PUT    | `/MSGA/works/:id/status`  | Change status (admin or user)                   | `200` updated work, `400` invalid status, `404` not found, `403` no token |
| PUT    | `/MSGA/works/:id/approve` | Approve and move to in_progress (admin or user) | `200` updated work, `404` not found, `403` no token                       |
| DELETE | `/MSGA/works/:id`         | Delete a work (admin only)                      | `200` `{ success: true }`, `403` not admin, `404` not found               |

> All `/users` endpoints require a valid JWT token with admin role.

---

## File Structure

```bash
src/
├── config/           # Environment and error message definitions
|   └── index.js      # Environment variables and error messages
├── middleware/       # CORS and JWT verification
|  ├── corsConfig.js  # CORS configuration
|  └── verifyToken.js # JWT verification middleware
├── routes/           # auth, users, and works routers
│   ├── auth.js       # Authentication routes
│   ├── users.js      # User management routes
│   └── works.js      # Work reporting routes
├── utils/            # Utility functions
│   ├── db.js         # NyaDB helper (init, get, set)
│   └── logger.js     # winston logger with redaction
├── server.js         # Express app setup, middleware, and routes
└── .env.example      # Example environment variables
```

---

## License

See [LICENSE](LICENSE) for details.

---

## Like what I do?

If you find this project helpful or fun to use, consider supporting me on Ko-fi! Your support helps me keep creating and improving.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/L3L02XV6J)

## Disclaimer

This project is not affiliated with Scribble Hub. It is a community-driven initiative to help identify and report unauthorized translations. Please respect the original authors and
their works.

---

NOTE: This README file was (mostly) generated using ChatGPT because I was too lazy to write it myself. I deem it acceptable to use AI for this purpose, as it saves time and effort.
However, I take full responsibility for the content and accuracy of the information provided. If you find any errors or inaccuracies, please let me know, and I will correct them.

If you have any suggestions or improvements, feel free to contribute!
