// ============================================
// THP Home Tutor - Backend Server
// Razorpay Payment Integration
// ============================================

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Razorpay Instance - USING YOUR CREDENTIALS
const razorpay = new Razorpay({
    key_id: 'rzp_test_SurD5cvO25Zbxy',
    key_secret: 'OFTaQp3NmRJ46AvVP5CGxuUE'
});

// ============ CREATE ORDER API ============
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;
        
        if (!amount || amount < 100) {
            return res.status(400).json({ error: 'Minimum amount is ₹1 (100 paise)' });
        }
        
        const options = {
            amount: amount || 20000,
            currency: currency || 'INR',
            receipt: receipt || 'receipt_' + Date.now(),
            notes: notes || {}
        };
        
        const order = await razorpay.orders.create(options);
        console.log('✅ Order Created:', order.id);
        
        res.json({
            success: true,
            id: order.id,
            amount: order.amount,
            currency: order.currency
        });
        
    } catch (error) {
        console.error('❌ Order Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ VERIFY PAYMENT API ============
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }
        
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', 'OFTaQp3NmRJ46AvVP5CGxuUE')
            .update(sign)
            .digest('hex');
        
        if (expectedSign === razorpay_signature) {
            console.log('✅ Payment Verified:', razorpay_payment_id);
            res.json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log('============================================');
    console.log('🚀 THP Home Tutor Server Running!');
    console.log('📍 URL: http://localhost:' + PORT);
    console.log('📄 Open: http://localhost:' + PORT + '/teacher.html');
    console.log('💳 Razorpay: rzp_test_SurD5cvO25Zbxy');
    console.log('============================================');
});
