// ============================================
// THP Home Tutor - Backend Server
// Razorpay Payment Gateway Integration
// ============================================

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ============ RAZORPAY INSTANCE ============
const razorpay = new Razorpay({
    key_id: 'rzp_test_SurD5cvO25Zbxy',
    key_secret: 'OFTaQp3NmRJ46AvVP5CGxuUE'
});

// ============ ROUTES ============

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'teacher.html'));
});

// ============ API: CREATE ORDER ============
app.post('/api/create-order', async (req, res) => {
    try {
        console.log('📥 Create Order Request:', req.body);
        
        const { amount, currency, receipt, notes } = req.body;
        
        // Validate amount
        if (!amount || amount < 100) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid amount. Minimum ₹1 (100 paise)' 
            });
        }
        
        // Create order options
        const options = {
            amount: amount,           // Amount in paise (20000 = ₹200)
            currency: currency || 'INR',
            receipt: receipt || 'receipt_' + Date.now(),
            notes: notes || {},
            payment_capture: 1        // Auto capture payment
        };
        
        console.log('🔄 Creating Razorpay order:', options);
        
        // Create order via Razorpay API
        const order = await razorpay.orders.create(options);
        
        console.log('✅ Order Created Successfully!');
        console.log('   Order ID:', order.id);
        console.log('   Amount:', order.amount / 100, '₹');
        console.log('   Currency:', order.currency);
        
        // Return order details to frontend
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            key_id: 'rzp_test_SurD5cvO25Zbxy'  // Send key to frontend
        });
        
    } catch (error) {
        console.error('❌ Order Creation Failed!');
        console.error('   Error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
});

// ============ API: VERIFY PAYMENT ============
app.post('/api/verify-payment', async (req, res) => {
    try {
        console.log('📥 Verify Payment Request:', req.body);
        
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: order_id, payment_id, signature'
            });
        }
        
        // Create signature string
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        
        // Generate expected signature using HMAC SHA256
        const expectedSign = crypto
            .createHmac('sha256', 'OFTaQp3NmRJ46AvVP5CGxuUE')
            .update(sign)
            .digest('hex');
        
        console.log('🔐 Signature Verification:');
        console.log('   Expected:', expectedSign);
        console.log('   Received:', razorpay_signature);
        
        // Compare signatures
        if (expectedSign === razorpay_signature) {
            console.log('✅ Payment Verified Successfully!');
            console.log('   Payment ID:', razorpay_payment_id);
            
            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id
            });
        } else {
            console.error('❌ Signature Mismatch! Payment may be fraudulent.');
            
            res.status(400).json({
                success: false,
                error: 'Invalid signature. Payment verification failed.'
            });
        }
        
    } catch (error) {
        console.error('❌ Verification Error:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message || 'Payment verification failed'
        });
    }
});

// ============ API: TEST ENDPOINT ============
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'THP Home Tutor Backend is Running!',
        razorpay_key: 'rzp_test_SurD5cvO25Zbxy',
        server_time: new Date().toISOString()
    });
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log('');
    console.log('============================================');
    console.log('🚀 THP HOME TUTOR SERVER STARTED!');
    console.log('============================================');
    console.log('📍 Local:    http://localhost:' + PORT);
    console.log('📄 Teacher:  http://localhost:' + PORT + '/teacher.html');
    console.log('🧪 Test API: http://localhost:' + PORT + '/api/test');
    console.log('============================================');
    console.log('💳 Razorpay Key:', 'rzp_test_SurD5cvO25Zbxy');
    console.log('🔐 Razorpay Secret:', 'OFTaQp3NmRJ46AvVP5CGxuUE');
    console.log('============================================');
    console.log('');
    console.log('👉 Open browser and go to:');
    console.log('   http://localhost:' + PORT + '/teacher.html');
    console.log('');
});
