const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) {
        let message = 'User already exists';
        if (existing.role !== 'user') {
            message = 'This email is already registered under a different portal. Please log in through the correct portal or use a different email.';
        }
        return res.status(409).json({ message });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default role for standard registration is 'user'
    const user = new User({ name, email, passwordHash, role: 'user' });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Ensures role is included in the returned user object for correct client-side storage
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 1. STANDARD USER LOGIN (Restricted to 'user' role)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });

    // Enforces separation: blocks non-'user' roles from this endpoint
    if (user.role !== 'user') return res.status(401).json({ message: 'Invalid credentials or incorrect login portal. Please use the seller login if applicable.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Ensures role is consistently returned
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. DEDICATED SELLER LOGIN
router.post('/seller-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials. Seller not registered.' });

        // Ensure the user has the 'seller' or 'admin' role
        if (user.role !== 'seller' && user.role !== 'admin') {
            return res.status(401).json({ message: 'Invalid credentials or you are not registered as a seller. Please use the customer login.' });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
        
        // After user authentication, fetch seller application status
        const sellerInfo = await Seller.findOne({ email });
        
        // **FIX**: The status check that blocked access is commented out below.
        // All sellers (pending or active) are now granted access to the dashboard.
        
        // All good: generate token and return user/seller data including sellerId
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Send the current status so the dashboard can display the message
        const currentStatus = sellerInfo ? sellerInfo.status : 'pending'; 

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                sellerId: sellerInfo ? sellerInfo._id : null,
                status: currentStatus // Include the current status
            } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

//3. DEDICATED RESELLER LOGIN
router.post('/reseller-register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, passwordHash, role: 'reseller' });
    await user.save();
    
    // Add success: true so the frontend knows it worked
    res.status(201).json({ success: true, message: "Reseller created successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// RESELLER LOGIN
router.post('/reseller-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'reseller') {
      return res.status(403).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash); // Must match your schema
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;