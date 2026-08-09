const mongoose = require('mongoose');

const ResellProductSchema = new mongoose.Schema({
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  name: { type: String, required: true },
  description: String,

  category: {
    type: String,
    enum: ['Saree Collection', 'Artifacts Collection', 'Lifestyle Picks'],
    required: true
  },

  itemType: {
    type: String,
    enum: ['Second Hand', 'New'],
    required: true
  },

  price: { type: Number, required: true },
  imageUrl: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResellProduct', ResellProductSchema);
