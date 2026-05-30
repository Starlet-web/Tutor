const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: CORS & JSON
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Razorpay
const razorpay = new Razorpay({
    key_id: 'rzp_test_SurD5cvO25Zbxy',
    key_secret: 'OFTaQp3NmRJ46AvVP5CGxuUE'
});

// ============ HTML PAGES ============
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============ CREATE ORDER API ============
app.post('/api/create-order', async (req, res) => {
    console.log('📥 Create Order Request Received');
    
    try {
        const options = {
            amount: 20000,
            currency: 'INR',
            receipt: 'receipt_' + Date.now()
        };
        
        const order = await razorpay.orders.create(options);
        console.log('✅ Order Created:', order.id);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency
        });
    } catch (error) {
        console.error('❌ Order Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============ VERIFY PAYMENT API ============
app.post('/api/verify-payment', async (req, res) => {
    console.log('📥 Verify Payment Request');
    
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', 'OFTaQp3NmRJ46AvVP5CGxuUE')
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

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

// ============ START ============
app.listen(PORT, () => {
    console.log('🚀 Server running on port ' + PORT);
});