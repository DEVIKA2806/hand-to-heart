// routes/resell.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const resellerAuth = require('../middleware/resellerAuth');

const uploadDir = 'uploads/resell';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// routes/resell.js

// Ensure this matches the HTML: <input type="file" name="image" ...>
router.post('/add', resellerAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file received' });
        }

        const { name, description, category, itemType, price } = req.body;
        const imageUrl = `/uploads/resell/${req.file.filename}`;

        // Return a proper JSON response so frontend doesn't get "undefined"
        res.status(200).json({
            success: true,
            message: 'Item uploaded successfully!',
            data: { name, imageUrl }
        });
    } catch (error) {
        console.error("Backend Upload Error:", error);
        res.status(500).json({ success: false, message: 'Server failed to process upload' });
    }
});

module.exports = router;