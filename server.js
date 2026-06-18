const express = require('express');
const app = express();

// Configure Express to use EJS for visuals and process HTML forms
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

// ==========================================
// MOCK DATABASE 
// ==========================================
const users = [
    { username: 'educator@ump.edu.my', password: 'password123', role: 'Educator', name: 'Lecture' },
    { username: 'learner@ump.edu.my', password: 'password123', role: 'Learner', name: 'Student' }
];

let courses = [
    { id: 1, title: 'Cloud Computing Technology', description: 'Learn AWS and Azure architecture deployment models.' },
    { id: 2, title: 'Web Development', description: 'Students learn data access from database to web application.' }
];

// Simple memory variable to track who is currently logged in
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

// 3. Show Dashboard (The main interface)
app.get('/dashboard', (req, res) => {
    if (!currentUser) return res.redirect('/'); // Protect route
    
    res.render('dashboard', { 
        user: currentUser, 
        courses: courses 
    });
});

// 4. Create New Course (Educators Only)
app.post('/create-course', (req, res) => {
    if (currentUser && currentUser.role === 'Educator') {
        const newCourse = {
            id: courses.length > 0 ? courses[courses.length - 1].id + 1 : 1,
            title: req.body.title,
            description: req.body.description
        };
        courses.push(newCourse);
    }
    res.redirect('/dashboard');
});

// 5. Delete Course (Educators Only)
app.post('/delete-course/:id', (req, res) => {
    if (currentUser && currentUser.role === 'Educator') {
        const courseId = parseInt(req.params.id);
        courses = courses.filter(c => c.id !== courseId);
    }
    res.redirect('/dashboard');
});

// 6. Logout
app.get('/logout', (req, res) => {
    currentUser = null;
    res.redirect('/');
});

// 7. Show the Edit Form (Educators Only)
app.get('/edit-course/:id', (req, res) => {
    // Block unauthorized access
    if (!currentUser || currentUser.role !== 'Educator') return res.redirect('/dashboard');
    
    // Find the specific course the user wants to edit
    const courseId = parseInt(req.params.id);
    const courseToEdit = courses.find(c => c.id === courseId);
    
    if (courseToEdit) {
        // Send the course data to a new visual page
        res.render('edit', { user: currentUser, course: courseToEdit });
    } else {
        res.redirect('/dashboard');
    }
});

// 8. Process the Update
app.post('/update-course/:id', (req, res) => {
    // Verify it is still an Educator making the change
    if (currentUser && currentUser.role === 'Educator') {
        const courseId = parseInt(req.params.id);
        const courseIndex = courses.findIndex(c => c.id === courseId);
        
        // If the course exists, update its title and description
        if (courseIndex > -1) {
            courses[courseIndex].title = req.body.title;
            courses[courseIndex].description = req.body.description;
        }
    }
    // Send them back to the dashboard to see the changes
    res.redirect('/dashboard');
});

// ==========================================
// SERVER START
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Edu Seria visual portal running on http://localhost:${PORT}`);
});