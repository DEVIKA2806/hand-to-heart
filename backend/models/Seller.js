const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    // Fields from the Join as Seller form
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    businessName: { type: String, required: true },
    productsDesc: { type: String }, // The "Products" text area from the form
    
    // Status for seller application review
    status: { 
        type: String, 
        enum: ['pending', 'active', 'rejected'], 
        default: 'pending' 
    },
    dateRegistered: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Seller', sellerSchema);