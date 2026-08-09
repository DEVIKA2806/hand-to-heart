require('dotenv').config({ path: '../.env' });

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// ROUTES (only require here — DO NOT use yet)
const authRoutes = require('./routes/auth');
const customerProductRoutes = require('./routes/products');
const productCreationRoutes = require('./routes/products_new');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const sellerRoutes = require('./routes/seller');
const deliveryRoutes = require('./routes/delivery');
const resellRoutes = require('./routes/resell');

// create app AFTER imports
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5000;


// --- CRITICAL ENV CHECK ---
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_here') {
    console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing or using the placeholder value.");
    console.error("Server cannot start securely. Please set a unique secret on Render.");
    process.exit(1);
}

// --- MIDDLEWARE ---
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

// // server.js - Update this specific block
// app.post('/api/auth/reseller-login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ email });

//         if (!user) return res.status(404).json({ message: "Account not found" });
//         if (user.role !== 'reseller') return res.status(403).json({ message: "Unauthorized role." });

//         // FIX: Change user.password to user.passwordHash to match your schema
//         const isMatch = await bcrypt.compare(password, user.passwordHash); 
//         if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//         // Generate token with role included for the middleware
//         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
//         res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/products', customerProductRoutes);
app.use('/api/product', productCreationRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/resell', resellRoutes);

// Serve assets (images, etc.) - IMPORTANT for uploaded images
const ASSETS_DIR = path.join(__dirname, '../assets');
app.use('/assets', express.static(ASSETS_DIR)); 

// Serve static frontend files
const FRONTEND_DIR = path.join(__dirname, '../frontend');
// app.use(express.static(FRONTEND_DIR));
// app.get('*', (req, res) => {
//     res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
// });

// --- WEBRTC SIGNALING LOGIC ---
io.on('connection', (socket) => {
    console.log('A user connected for signaling:', socket.id);

    // Handle a user joining a room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        // Notify other user in the room that a peer has joined
        socket.to(roomId).emit('peer-joined', { peerId: socket.id });
    });

    // Handle WebRTC offer
    socket.on('webrtc-offer', ({ offer, roomId }) => {
        console.log(`Broadcasting offer from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-offer', { offer, fromId: socket.id });
    });

    // Handle WebRTC answer
    socket.on('webrtc-answer', ({ answer, roomId }) => {
        console.log(`Broadcasting answer from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-answer', { answer, fromId: socket.id });
    });

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', ({ candidate, roomId }) => {
        console.log(`Broadcasting ICE candidate from ${socket.id} in room ${roomId}`);
        // Send to all others in the room
        socket.to(roomId).emit('webrtc-ice-candidate', { candidate, fromId: socket.id });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('Signaling user disconnected:', socket.id);
    });
});

app.use(express.static(FRONTEND_DIR));
app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

server.listen(PORT, () => { // Use server.listen instead of app.listen
    console.log(`Server running on port ${PORT}`);
});