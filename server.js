const express = require('express');
const session = require('express-session');
const cors = require('cors');
const NyaDB = require('@decaded/nyadb');

const app = express();
const PORT = 3001;

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
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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

// Auth routes
app.post('/login', (req, res) => {
	const { username, password } = req.body;
	const users = getDatabase('users');
	const user = Object.values(users).find(u => u.username === username);

	if (!user) return res.status(404).json({ error: 'User not found' });
	if (user.password !== password) return res.status(401).json({ error: 'Wrong password' });
	if (!user.approved) return res.status(403).json({ error: 'Account pending approval' });

	req.session.user = { id: user.id, username: user.username, role: user.role };
	res.json(req.session.user);
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

	users[newId] = {
		username,
		shProfileURL,
		password,
		role: 'user',
		approved: false,
	};

	setDatabase('users', users);
	res.status(201).json({ id: newId, ...users[newId] });
});

app.post('/logout', (req, res) => {
	req.session.destroy(() => res.json({ success: true }));
});

app.get('/check', (req, res) => {
	res.json({
		authenticated: !!req.session.user,
		user: req.session.user || null,
	});
});

// User routes
app.get('/users', (_, res) => {
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

app.put('/users/:id', (req, res) => {
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
	const existingIds = Object.keys(works).map(id => parseInt(id, 10));
	const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

	const newWork = {
		id: nextId,
		...req.body,
		status: 'pending_review',
		dateReported: new Date().toISOString().split('T')[0],
		approved: false,
	};

	works[newWork.id] = newWork;
	setDatabase('works', works);
	res.json(newWork);
});

app.put('/works/:id', (req, res) => {
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

app.put('/works/:id/status', (req, res) => {
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

app.put('/works/:id', (req, res) => {
	console.log('2');
	const id = req.params.id;
	const works = getDatabase('works');
	if (!works[id]) return res.status(404).json({ error: 'Work not found' });

	Object.assign(works[id], req.body);
	setDatabase('works', works);
	res.json(works[id]);
});

app.put('/works/:id/approve', (req, res) => {
	console.log('3');
	const id = req.params.id;
	const works = getDatabase('works');
	const work = works[id];

	if (!work) {
		return res.status(404).json({ error: 'Work not found' });
	}

	works[id].approved = true;

	setDatabase('works', works);

	res.json(works[id]);
});

// Start server
app.listen(PORT, () => {
	console.log(`Mock backend running on http://localhost:${PORT}`);
});
