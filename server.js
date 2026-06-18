const express = require('express');
const mysql = require('mysql2');
const app = express();

// Configure Express to use EJS and process form data
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// ==========================================
// DATABASE CONNECTION
// ==========================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',
    database: 'eduseria'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to Oracle Linux MySQL Database!');
});

// ==========================================
// MOCK USERS (Kept for prototype login)
// ==========================================
const users = [
    { username: 'educator@ump.edu.my', password: 'password123', role: 'Educator', name: 'Lecturer' },
    { username: 'learner@adab.umpsa.edu.my', password: 'password123', role: 'Learner', name: 'Student' }
];

let currentUser = null; 

// ==========================================
// ROUTES & LOGIC
// ==========================================

// 1. Show Login Page
app.get('/', (req, res) => {
    res.render('login', { error: null });
});

// 2. Process Login Form
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.username === email && u.password === password);
    
    if (user) {
        currentUser = user;
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid email credentials or password match.' });
    }
});

// 3. Show Dashboard (READ)
app.get('/dashboard', (req, res) => {
    if (!currentUser) return res.redirect('/'); 
    
    // Fetch courses from MySQL instead of the array
    db.query('SELECT * FROM courses', (err, results) => {
        if (err) throw err;
        res.render('dashboard', { 
            user: currentUser, 
            courses: results 
        });
    });
});

// 4. Create New Course (CREATE)
app.post('/create-course', (req, res) => {
    if (currentUser && currentUser.role === 'Educator') {
        const sql = 'INSERT INTO courses (title, description) VALUES (?, ?)';
        db.query(sql, [req.body.title, req.body.description], (err, result) => {
            if (err) throw err;
            res.redirect('/dashboard');
        });
    } else {
        res.redirect('/dashboard');
    }
});

// 5. Show the Edit Form (Educators Only)
app.get('/edit-course/:id', (req, res) => {
    if (!currentUser || currentUser.role !== 'Educator') return res.redirect('/dashboard');
    
    // Find the specific course in the database
    const sql = 'SELECT * FROM courses WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) throw err;
        
        // If the course exists, send it to the edit page
        if (results.length > 0) {
            res.render('edit', { user: currentUser, course: results[0] });
        } else {
            res.redirect('/dashboard');
        }
    });
});

// 6. Process the Update (UPDATE)
app.post('/update-course/:id', (req, res) => {
    if (currentUser && currentUser.role === 'Educator') {
        const sql = 'UPDATE courses SET title = ?, description = ? WHERE id = ?';
        db.query(sql, [req.body.title, req.body.description, req.params.id], (err, result) => {
            if (err) throw err;
            res.redirect('/dashboard');
        });
    } else {
        res.redirect('/dashboard');
    }
});

// 7. Delete Course (DELETE)
app.post('/delete-course/:id', (req, res) => {
    if (currentUser && currentUser.role === 'Educator') {
        const sql = 'DELETE FROM courses WHERE id = ?';
        db.query(sql, [req.params.id], (err, result) => {
            if (err) throw err;
            res.redirect('/dashboard');
        });
    } else {
        res.redirect('/dashboard');
    }
});

// 8. Logout
app.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/');
});

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Edu Seria visual portal running on port ${PORT}`);
});