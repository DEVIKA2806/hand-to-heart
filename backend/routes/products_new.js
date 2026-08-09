const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Price range definitions for server-side validation (Issue #6)
const PRICE_RANGES = {
    saree: { min: 1000, max: 8000 },
    artifacts: { min: 200, max: 5000 },
    lifestyle: { min: 10, max: 1000 },
    other: { min: 1, max: 100000 } // Default fallback range
};

// --- MULTER CONFIGURATION (Issue #7) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Creates 'assets/products' directory if it doesn't exist (relative to project root)
        const dir = path.join(__dirname, '../../assets/products');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use sellerId + timestamp + original extension for unique filename
        const ext = path.extname(file.originalname);
        cb(null, req.body.sellerId + '-' + Date.now() + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'), false);
        }
    }
});

// POST /api/product/add - Add New Product (Protected by auth)
router.post('/add', auth, (req, res, next) => {
    // Check if the user is a seller or admin
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden. Only sellers can add products.' });
    }

    // Use multer middleware for image upload (Issue #7)
    upload.single('productImage')(req, res, async (err) => {
        const { sellerId, productName, description, price, category } = req.body;
        
        // Handle multer errors
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Product image is required.' });
        }
        if (!sellerId || !productName || !description || !price || !category) {
            if (req.file) fs.unlinkSync(req.file.path); 
            return res.status(400).json({ message: 'Missing required product fields.' });
        }
        
        // --- Price Range Validation (Issue #6) ---
        const numericPrice = parseFloat(price);
        const range = PRICE_RANGES[category] || PRICE_RANGES.other;
        
        if (numericPrice < range.min || numericPrice > range.max) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                message: `Price (₹${numericPrice}) is outside the acceptable range for ${category}: ₹${range.min}-₹${range.max}.` 
            });
        }
        
        // --- Create new Product ---
        try {
            const newProduct = new Product({
                sellerId: sellerId,
                title: productName,
                description: description,
                price: numericPrice,
                category: category,
                // Store the relative URL for frontend use (This path is correct)
                imageUrl: '/assets/products/' + req.file.filename, 
            });

            const savedProduct = await newProduct.save();

            // Success response (Issue #1, #8)
            res.status(201).json({
                message: 'Item added successfully! Redirecting to the ' + category + ' page.',
                product: savedProduct
            });

        } catch (error) {
            console.error('Product addition error:', error);
            if (req.file) fs.unlinkSync(req.file.path); // Delete file on DB error
            res.status(500).json({ message: 'Server error during product listing.' });
        }
    });
});

// GET /api/product/:category - Get products by category (for dynamic rendering - Issue #3, #8)
router.get('/:category', async (req, res) => {
    try {
        const category = req.params.category.toLowerCase();
        
        // Allows filtering by the categories used in your schema
        const validCategories = ['saree', 'artifacts', 'lifestyle']; 
        if (!validCategories.includes(category)) {
            // Include a fallback to prevent arbitrary DB queries
             if(category !== 'other') { // Allow 'other' to fetch products not categorized for display pages.
                return res.status(404).json({ message: 'Invalid category specified.' });
            }
        }
        
        // Fetch products, sorting by creation date to show new items first
        const products = await Product.find({ category: category }).sort({ createdAt: -1 });

        res.json({ products });
    } catch (error) {
        console.error('Fetch products error:', error);
        res.status(500).json({ message: 'Server error retrieving products.' });
    }
});

module.exports = router;