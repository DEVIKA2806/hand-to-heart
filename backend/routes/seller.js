const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); // Added JWT import

// POST /api/seller/register - Seller Registration (Creates User account + Seller application)
router.post('/register', async (req, res) => {
    // Pass fields from the frontend form. Phone and Products are optional per schema.
    const { name, email, phone, business, products, password } = req.body; 

    // 1. Basic validation - Checking essential fields
    if (!name || !email || !business || !password) {
        return res.status(400).json({ message: 'Missing required fields: Name, Email, Business Name, or Password.' });
    }

    try {
        // 2. Check for existing entries (User account first)
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const message = existingUser.role === 'seller'
                ? 'This email is already registered as a seller. Please log in.'
                : 'This email is already registered as a standard user. Please log out first to proceed with seller registration.' 
            return res.status(409).json({ message });
        }
        
        // 3. Create NEW User Account with 'seller' role
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, passwordHash, role: 'seller' });
        await newUser.save();

        // 4. Create new Seller application (status defaults to 'pending')
        const newSeller = new Seller({
            name, 
            email, 
            phone,
            businessName: business, 
            productsDesc: products 
        });

        const savedSeller = await newSeller.save();
        
        // 5. CRITICAL FIX: Generate JWT token AFTER newUser is created
        const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // 6. Return success message, user/seller data, and the JWT token
        // This payload triggers instant login and redirection on the frontend.
        res.status(201).json({ 
            message: 'Seller application submitted successfully! Redirecting to dashboard for review...', 
            token: token,
            user: { 
                id: newUser._id, 
                name: newUser.name, 
                email: newUser.email, 
                role: newUser.role,
                sellerId: savedSeller._id, // Crucial for client-side storage
                status: savedSeller.status // Return status (will be 'pending')
            }
        });

    } catch (error) {
        console.error('Seller registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

module.exports = router;