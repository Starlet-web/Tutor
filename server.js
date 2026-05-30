// .env file load karo
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Razorpay - .env se values lo
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SurD5cvO25Zbxy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'OFTaQp3NmRJ46AvVP5CGxuUE'
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || 'production'
    });
});

// ============ CREATE ORDER ============
app.post('/api/create-order', async (req, res) => {
    try {
        const options = {
            amount: 20000,
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        };
        const order = await razorpay.orders.create(options);
        console.log('✅ Order:', order.id);
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('❌ Order Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============ VERIFY PAYMENT ============
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'OFTaQp3NmRJ46AvVP5CGxuUE')
            .update(sign)
            .digest('hex');
        
        if (expectedSign === razorpay_signature) {
            console.log('✅ Payment Verified');
            res.json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log('🚀 Server running on port ' + PORT);
});
