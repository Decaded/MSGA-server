const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const NyaDB = require('@decaded/nyadb');

const app = express();
const PORT = 3001;
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_jwt_key';

// Initialize NyaDB
const db = new NyaDB();
const initializeDatabase = () => {
	const requiredDatabases = ['users', 'works'];
	requiredDatabases.forEach(dbName => {
		if (!db.getList().includes(dbName)) db.create(dbName);
	});
};

initializeDatabase();

// Middleware
const allowedOrigins = ['http://localhost:5173']; // List of allowed origins

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'), false);
			}
		},
		credentials: false,
	}),
);

app.use(express.json({ strict: false }));
app.use(
	session({
		secret: 'supersecret',
		resave: false,
		saveUninitialized: true,
	}),
);

// Utility functions
const getDatabase = dbName => db.get(dbName);
const setDatabase = (dbName, data) => db.set(dbName, data);

// JWT middleware to verify token

const verifyToken = (req, res, next) => {
	const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer <token>"

	if (!token) return res.status(403).json({ error: 'No token provided' });

	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) return res.status(403).json({ error: 'Invalid or expired token' });

		req.user = decoded;
		next();
	});
};

// Auth routes
app.post('/login', (req, res) => {
	const { username, password } = req.body;
	const users = getDatabase('users');
	const user = Object.values(users).find(u => u.username === username);

	if (!user) return res.status(404).json({ error: 'User not found' });

	if (!bcrypt.compareSync(password, user.password)) {
		return res.status(401).json({ error: 'Wrong password' });
	}

	if (!user.approved) return res.status(403).json({ error: 'Account pending approval' });

	// req.session.user = { id: user.id, username: user.username, role: user.role };
	// res.json(req.session.user);

	const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
	res.json({ token });
});

app.post('/register', (req, res) => {
	const { username, shProfileURL, password } = req.body;

	if (!username || !shProfileURL || !password) {
		return res.status(400).json({ error: 'Username, SH profile URL and password are required' });
	}

	const shProfilePattern = /^https:\/\/www\.scribblehub\.com\/profile\/\d+\/[a-zA-Z0-9-_]+\/?$/;
	if (!shProfilePattern.test(shProfileURL)) {
		return res.status(400).json({ error: 'Invalid SH profile URL format' });
	}

	const users = getDatabase('users');
	const existingUser = Object.values(users).find(u => u.username === username || u.shProfileURL === shProfileURL);
	if (existingUser) {
		return res.status(409).json({ error: 'Username or SH profile URL already in use' });
	}

	const newId = Object.keys(users).length.toString();

	const hashedPassword = bcrypt.hashSync(password, 10);

	users[newId] = {
		username,
		shProfileURL,
		password: hashedPassword,
		role: 'user',
		approved: false,
	};

	setDatabase('users', users);
	res.status(201).json({ id: newId, ...users[newId] });
});

app.post('/logout', verifyToken, (req, res) => {
	req.session.destroy(() => res.json({ success: true }));
});

app.get('/check', verifyToken, (req, res) => {
	res.json({
		authenticated: true,
		user: req.user,
	});
});

// User routes
app.get('/users', verifyToken, (_, res) => {
	const users = getDatabase('users');
	const usersArray = Object.entries(users).map(([key, user]) => {
		const { username, shProfileURL, role, approved } = user;
		return {
			id: parseInt(key),
			username,
			shProfileURL,
			role,
			approved,
		};
	});
	res.json(usersArray);
});

app.put('/users/:id', verifyToken, (req, res) => {
	const id = req.params.id;
	const users = getDatabase('users');
	const user = users[id];

	if (!user) return res.status(404).json({ error: 'User not found' });

	const { approved } = req.body;
	if (approved === undefined) {
		return res.status(400).json({ error: 'Approval status must be provided.' });
	}

	users[id].approved = approved;

	setDatabase('users', users);
	res.json({ id, ...users[id] });
});

// Work routes
app.get('/works', (_, res) => {
	res.json(getDatabase('works'));
});

app.post('/works', (req, res) => {
	const works = getDatabase('works');
	const existingIds = Object.keys(works).map(Number);
	const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

	if (!req.body.url) {
		return res.status(400).json({ error: 'Work URL is required' });
	}

	const scribbleHubPattern = /^https:\/\/www\.scribblehub\.com\/series\/\d+/;
	if (!scribbleHubPattern.test(req.body.url)) {
		return res.status(400).json({ error: 'Invalid ScribbleHub URL format' });
	}

	const newWork = {
		id: nextId,
		title: req.body.title || `Reported Work ${nextId}`,
		url: req.body.url,
		status: 'pending_review',
		reporter: req.user ? req.user.username : 'Anonymous', // Use the username from the JWT token if available
		reason: req.body.reason || '',
		proofs: req.body.proofs?.filter(p => p) || [],
		additionalInfo: req.body.additionalInfo || '',
		dateReported: new Date().toISOString().split('T')[0],
		approved: false,
	};

	works[nextId] = newWork;
	setDatabase('works', works);
	res.status(201).json(newWork);
});

app.put('/works/:id', verifyToken, (req, res) => {
	const id = parseInt(req.params.id);
	const works = getDatabase('works');
	const workEntry = Object.entries(works).find(([_, work]) => work.id === id);

	if (!workEntry) return res.status(404).json({ error: 'Work not found' });

	const [dbKey, work] = workEntry;
	Object.assign(work, req.body);
	works[dbKey] = work;

	setDatabase('works', works);
	res.json(work);
});

app.put('/works/:id/status', verifyToken, (req, res) => {
	console.log('1');
	const id = req.params.id;
	const { status } = req.body;
	const works = getDatabase('works');
	if (!works[id]) return res.status(404).json({ error: 'Work not found' });

	works[id].status = status;

	const work = works[id];

	if (!work) {
		return res.status(404).json({ error: 'Work not found' });
	}

	works[id].status = status;

	setDatabase('works', works);
	res.json(works[id]);
});

app.put('/works/:id', verifyToken, (req, res) => {
	console.log('2');
	const id = req.params.id;
	const works = getDatabase('works');
	if (!works[id]) return res.status(404).json({ error: 'Work not found' });

	Object.assign(works[id], req.body);
	setDatabase('works', works);
	res.json(works[id]);
});

app.put('/works/:id/approve', verifyToken, (req, res) => {
	console.log('3');
	const id = req.params.id;
	const works = getDatabase('works');
	const work = works[id];

	if (!work) {
		return res.status(404).json({ error: 'Work not found' });
	}

	works[id].approved = true;
	works[id].status = 'in_progress';

	setDatabase('works', works);

	res.json(works[id]);
});

app.delete('/works/:id', verifyToken, (req, res) => {
	const id = parseInt(req.params.id);
	const works = getDatabase('works');

	const workEntry = Object.entries(works).find(([_, work]) => work.id === id);

	if (!workEntry) {
		return res.status(404).json({ error: 'Work not found' });
	}

	const [dbKey] = workEntry;

	delete works[dbKey];
	setDatabase('works', works);

	res.json({ success: true, deletedId: id });
});

// Start server
app.listen(PORT, () => {
	console.log(`Mock backend running on http://localhost:${PORT}`);
});
