# Mock Backend Documentation

## Overview

This Express.js-based mock backend serves as a simplified server with authentication, user, and work management capabilities. It uses the in-memory `@decaded/nyadb` database and
supports session management and CORS.

## Setup

### Prerequisites

- Node.js (v12+ recommended)

### Installation

```bash
npm install express express-session cors @decaded/nyadb bcryptjs jsonwebtoken body-parser
```

### Running the Server

```bash
node index.js
```

The server will run at `http://localhost:3001`.

## Middleware

- `cors`: Enables CORS for `http://localhost:5173`
- `express.json`: Parses JSON payloads
- `express-session`: Manages user sessions

## Database Initialization

The database creates two collections if they do not exist:

- `users`
- `works`

## Routes

### Authentication

#### POST `/login`

**Body:**

```json
{
	"username": "string",
	"password": "string"
}
```

**Responses:**

- `200`: Login successful, returns JWT token
- `401`: Wrong password
- `403`: Account pending approval
- `404`: User not found

#### POST `/register`

**Body:**

```json
{
  "username": "string",
  "password": "string",
  "shProfileURL": "string"
}
```

**Responses:**

- `201`: User registered
- `400`: Missing fields
- `409`: Username or SH profile URL already in use

#### POST `/logout`

Clears session and logs out user.

#### GET `/check`

Returns authentication status and user info.

---

### Users

#### GET `/users`

Returns all users as an array with numeric `id` fields.

#### PUT `/users/:id`

**Body:**

```json
{
	// Any user field to update
}
```

**Responses:**

- `200`: Updated user
- `404`: User not found

---

### Works

#### GET `/works`

Returns all works as an object.

#### POST `/works`

**Body:**

```json
{
	"title": "string",
	"url": "string",
	"reason": "string",
	"proofs": ["string"],
	"additionalInfo": "string"
}
```

Automatically adds:

- `id`: Auto-incremented
- `status`: `pending_review`
- `dateReported:` Current date
- `approved`: `false`
- `reporter`: `Anonymous` (if not logged in) or `username` (if logged in)

**Response:** New work object

#### DELETE `/works/:id`

Deletes a work.

**Response:**

- `200`: Success
- `404`: Work not found

#### PUT `/works/:id/status`

**Body:**

```json
{
	"status": "string"
}
```

Updates the status of a work.

#### PUT `/works/:id`

**Body:**

```json
{
	// Fields to update
}
```

Overwrites specified fields of a work.

#### PUT `/works/:id/approve`

Sets `approved` to `true` for a work.

---

## Authentication Notes

- JWT authentication is used for user login and sessions.

- JWT tokens should be passed in the `Authorization` header in the format `Bearer <token>` for authenticated routes.

- The `/works` route can be accessed by both authenticated and unauthenticated users. If authenticated, the logged-in user's username is used for the `reporter` field; otherwise,
  the default is `Anonymous`.
