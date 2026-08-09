const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // New field to link the product to the Seller who created it
    sellerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller', 
        required: true // Ensures every product is tied to a registered seller
    },
    
    // Existing fields
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    
    // Update category to use enum for validation against your required pages
    category: { 
        type: String, 
        enum: ['saree', 'artifacts', 'lifestyle', 'other'], // Added 'other' for safety
        required: true 
    },
    
    imageUrl: String,
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);