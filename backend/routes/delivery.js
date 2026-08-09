const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// NOTE: Assuming you have an Order model imported here:
// const Order = require('../models/Order'); 

// Placeholder deliveryAuth. For production, restrict this role explicitly.
function deliveryAuth(req, res, next) {
    if (req.user && (req.user.role === 'admin')) { 
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Only authorized personnel can access this panel.' });
    }
}

// GET /api/delivery/orders/pending - Get new orders (Issue #2)
router.get('/orders/pending', auth, deliveryAuth, async (req, res) => {
    try {
        // NOTE: Replace this mock data with actual database query on your Order model
        const mockOrders = [
            { _id: 'ORDER-001', customerName: 'J. Doe', items: [{ name: 'Saree', qty: 1 }], status: 'pending', deliveryAddress: '123 Main St.', date: new Date().toISOString() },
            { _id: 'ORDER-002', customerName: 'A. Smith', items: [{ name: 'Artifact', qty: 2 }], status: 'pending', deliveryAddress: '456 Oak Ave.', date: new Date().toISOString() }
        ];

        // const pendingOrders = await Order.find({ status: 'pending' }).sort({ createdAt: 1 }).lean();
        
        res.json({ orders: mockOrders, message: 'Fetched pending orders successfully.' });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
});

// POST /api/delivery/orders/:orderId/delivered - Update order status (Issue #2)
router.post('/orders/:orderId/delivered', auth, deliveryAuth, async (req, res) => {
    const { orderId } = req.params;

    try {
        // Actual Database logic:
        // const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: { status: 'delivered' } }, { new: true });
        
        // MOCK LOGIC: Assuming successful update
        res.json({ message: `Order ${orderId} marked as delivered.`, orderId, status: 'delivered' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error updating order status.' });
    }
});

module.exports = router;