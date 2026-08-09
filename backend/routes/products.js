// backend/routes/products.js
const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose'); 
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// NEW ROUTE: GET /api/product/:category - Fetch products by category (Request 5 Support)
router.get('/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const validCategories = ['saree', 'artifacts', 'lifestyle', 'other'];

        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid product category specified.' });
        }

        // Fetch products only for the specified category
        const products = await Product.find({ category: category }).sort({ createdAt: -1 });
        res.json({ products: products });
    } catch (err) {
        console.error('Fetch products by category error:', err);
        res.status(500).json({ message: 'Server error while fetching category products.' });
    }
});


// GET /api/product/ - Fetch ALL products (used by the shop page)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/product/ - Original Admin/Auth creation route (MODIFIED)
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, price, category, imageUrl, stock, sellerId } = req.body; 

        // Validation check for new required field
        if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) { 
            return res.status(400).json({ message: 'Missing or invalid sellerId is required for product creation.' });
        }

        const p = new Product({
            sellerId, 
            title,
            description,
            price,
            category,
            imageUrl,
            stock
        });
        await p.save();
        res.status(201).json(p);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// NEW ROUTE: POST /api/product/add - Dedicated route for the Seller Dashboard
// FIX 7: Price validation implemented. FIX 6: Success message refined.
router.post('/add', upload.single('productImage'), async (req, res) => {
    const { sellerId, productName, description, price, category } = req.body;
    const numericPrice = parseFloat(price);
    // Replace backslashes with forward slashes for URL compatibility
    const imageUrl = req.file ? req.file.path.replace(/\\/g, '/') : ''; 


    // 1. Basic Validation
    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(401).json({ message: 'Authentication required: Invalid Seller ID format.' });
    }
    if (!productName || !price || !category || isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'Missing or invalid product details (Name, Price, Category).' });
    }

    // 2. Price Range Validation (Request 7)
    let minPrice, maxPrice;
    switch (category) {
        case 'saree':
            minPrice = 1000;
            maxPrice = 8000;
            break;
        case 'artifacts':
            minPrice = 200;
            maxPrice = 5000;
            break;
        case 'lifestyle':
            minPrice = 10;
            maxPrice = 1000;
            break;
        case 'other':
        default:
            minPrice = 0;
            maxPrice = Number.MAX_SAFE_INTEGER;
    }

    if (category !== 'other' && (numericPrice < minPrice || numericPrice > maxPrice)) {
        // Custom error message as requested
        return res.status(400).json({
            message: `The price of ₹${numericPrice.toFixed(2)} is outside the allowed range for the "${category}" collection. Please set a price between ₹${minPrice} and ₹${maxPrice}.`
        });
    }

    try {
        // 3. Create new product entry
        const newProduct = new Product({
            sellerId,
            title: productName,
            description,
            price: numericPrice,
            category,
            imageUrl
        });

        const savedProduct = await newProduct.save();

        // FIX 6: Return success message as requested
        res.status(201).json({
            message: `Product "${productName}" successfully added!`, 
            product: savedProduct
        });

    } catch (error) {
        console.error('Seller product addition error:', error);
        res.status(500).json({ message: 'Server error: Failed to add product listing.' });
    }
});


// PUT /api/product/:id - Update existing product
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/product/:id - Delete product
router.delete('/:id', auth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;