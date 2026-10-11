const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();
const db = require('./database/db');

// Password security helpers
function hashPassword(password) {
  return crypto.createHash('sha256').update((password || '').toString().trim()).digest('hex');
}

function verifyPassword(password, hash) {
  if (!hash) return false;
  return hashPassword(password) === hash;
}

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const rawAdmin = process.env.ADMIN_PHONE || '8368074009';
const ADMIN_PHONES = rawAdmin.split(',').map(p => p.replace(/[^0-9]/g, '').slice(-10)).filter(Boolean);
if (!ADMIN_PHONES.includes('8368074009')) ADMIN_PHONES.push('8368074009');

const { dispatchCloudOtp, getCloudConfigStatus } = require('./services/cloudOtp');
const { sendWhatsAppMessage, pollPendingMessages, recordWorkerPing, getWorkerStatus } = require('./whatsapp');

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Flenko Backend Server is alive and running!' });
});

// WhatsApp Bot Worker Routes (Option B - Local Windows Bot)
const BOT_SECRET = 'flenko_bot_secret_2026';

app.get('/api/whatsapp/poll', (req, res) => {
  if (req.headers['x-bot-token'] !== BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized bot' });
  }
  const messages = pollPendingMessages();
  res.json({ success: true, messages });
});

app.post('/api/whatsapp/ping', (req, res) => {
  if (req.headers['x-bot-token'] !== BOT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized bot' });
  }
  recordWorkerPing();
  res.json({ success: true, status: 'online' });
});

app.get('/api/whatsapp/status', (req, res) => {
  res.json({ success: true, worker: getWorkerStatus() });
});

app.get('/qr', (req, res) => {
  const status = getWorkerStatus();
  if (status.isOnline) {
    return res.send(`
      <div style="font-family:sans-serif; text-align:center; padding:40px;">
        <h2 style="color:#16856b;">✅ Local WhatsApp Bot is ONLINE and Connected!</h2>
        <p>Pending messages will be sent automatically from your phone.</p>
      </div>
    `);
  } else {
    return res.send(`
      <div style="font-family:sans-serif; text-align:center; padding:40px;">
        <h2 style="color:#f59e0b;">⏳ Local WhatsApp Bot is currently OFFLINE</h2>
        <p>Double-click <b>start_bot.bat</b> on your laptop to start sending WhatsApp OTPs.</p>
      </div>
    `);
  }
});

// Route: Check Cloud OTP Gateways Status
app.get('/api/auth/otp-status', (req, res) => {
  res.json({
    success: true,
    cloudGateways: getCloudConfigStatus(),
    worker: getWorkerStatus()
  });
});

// Route: Password-based User Registration
app.post('/api/auth/register', async (req, res) => {
  const { phone, password, name, email, city, isSellerRegistration } = req.body;
  const cleanPhone = (phone || '').toString().replace(/[^0-9]/g, '').slice(-10);
  const cleanPass = (password || '').toString().trim();

  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }
  if (!cleanPass || cleanPass.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }

  try {
    // Check if phone number is already registered
    const existing = await db.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(400).json({ error: 'Mobile number already registered. Please sign in.' });
    }

    const isAdmin = ADMIN_PHONES.includes(cleanPhone);
    let role = 'buyer';
    if (isAdmin) {
      role = 'admin';
    } else if (isSellerRegistration) {
      role = 'supplier';
    }

    const hashedPassword = hashPassword(cleanPass);
    const insertRes = await db.query(
      'INSERT INTO users (phone, password, name, email, city, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [cleanPhone, hashedPassword, name || (role === 'admin' ? 'Master Admin' : 'New User'), email || null, city || null, role]
    );
    const user = insertRes.rows[0];

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        subscription: user.subscription || 'free'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Route: Password-based User Login
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const cleanPhone = (phone || '').toString().replace(/[^0-9]/g, '').slice(-10);
  const cleanPass = (password || '').toString().trim();

  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required' });
  }
  if (!cleanPass) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const isAdmin = ADMIN_PHONES.includes(cleanPhone);
  const isMasterOverride = isAdmin && (cleanPass === '123456');

  try {
    let userRes = await db.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    let user;

    if (!userRes.rows || userRes.rows.length === 0) {
      // Auto-provision Super Admin on first login with master pin or password
      if (isAdmin) {
        const hashedPassword = hashPassword(cleanPass);
        const insertAdmin = await db.query(
          'INSERT INTO users (phone, password, name, email, city, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [cleanPhone, hashedPassword, 'Master Admin', null, null, 'admin']
        );
        user = insertAdmin.rows[0];
      } else {
        return res.status(404).json({ error: 'Account not found with this mobile number. Please register first.' });
      }
    } else {
      user = userRes.rows[0];

      // Password verification
      let passwordMatches = false;
      if (isMasterOverride) {
        passwordMatches = true;
      } else if (user.password) {
        passwordMatches = verifyPassword(cleanPass, user.password);
      } else if (cleanPass === '123456') {
        // Fallback for legacy account: set initial password
        passwordMatches = true;
        await db.query('UPDATE users SET password = $1 WHERE phone = $2', [hashPassword(cleanPass), cleanPhone]);
      }

      if (!passwordMatches) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }

      // Promote to admin if matches admin list
      if (isAdmin && user.role !== 'admin') {
        await db.query("UPDATE users SET role = 'admin' WHERE phone = $1", [cleanPhone]);
        user.role = 'admin';
      }
    }

    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        subscription: user.subscription || 'free'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Route: Request OTP (Legacy fallback)
app.post('/api/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  const cleanPhone = (phone || '').toString().replace(/[^0-9]/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
  }

  const otp = generateOTP();
  // Expire in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    // Save OTP to database
    await db.query('DELETE FROM otp_requests WHERE phone = $1', [cleanPhone]);
    await db.query(
      'INSERT INTO otp_requests (phone, otp, expires_at) VALUES ($1, $2, $3)',
      [cleanPhone, otp, expiresAt]
    );

    // 1. Send via 24/7 Cloud OTP Dispatcher (Fast2SMS, Twilio, Meta WhatsApp Cloud, UltraMsg)
    const cloudRes = await dispatchCloudOtp(cleanPhone, otp);

    // 2. Also enqueue to local bot if worker happens to be connected (optional fallback)
    try {
      const otpMsg = `*Flenko.com - B2B Marketplace*\n\nYour Login OTP is: *${otp}*\n\nPlease do not share this code with anyone.`;
      sendWhatsAppMessage(cleanPhone, otpMsg);
    } catch (e) {}

    const isLiveDelivered = cloudRes && cloudRes.success && cloudRes.sent;
    const providerName = isLiveDelivered ? cloudRes.provider : 'Free Test Mode';

    res.json({
      success: true,
      message: isLiveDelivered 
        ? `OTP sent successfully to your mobile via ${providerName}!`
        : `Free Test Mode Active. (Test PIN: 123456)`,
      deliveryChannel: providerName,
      testOtp: isLiveDelivered ? undefined : '123456',
      isFreeTest: !isLiveDelivered
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Internal server error while requesting OTP' });
  }
});

// Route: Verify OTP & Login/Register
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, otp, name, email, city, isSellerRegistration } = req.body;
  const cleanPhone = (phone || '').toString().replace(/[^0-9]/g, '').slice(-10);
  const cleanOtp = (otp || '').toString().trim();
  
  if (!cleanPhone || !cleanOtp) {
    return res.status(400).json({ error: 'Valid phone and OTP are required' });
  }

  const isAdmin = ADMIN_PHONES.includes(cleanPhone);
  // Universal test PIN 123456 works for all accounts during free testing
  const isTestPin = (cleanOtp === '123456' || cleanOtp === '000000');

  try {
    let otpValid = isTestPin;
    if (!otpValid) {
      // Find valid OTP in database
      const otpRes = await db.query(
        'SELECT * FROM otp_requests WHERE phone = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [cleanPhone, cleanOtp]
      );
      if (otpRes.rows && otpRes.rows.length > 0) {
        otpValid = true;
      }
    }

    if (!otpValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
    }

    // Check if user exists
    let userRes = await db.query('SELECT * FROM users WHERE phone = $1', [cleanPhone]);
    let user;

    if (!userRes.rows || userRes.rows.length === 0) {
      // User doesn't exist, create them
      let role = 'buyer';
      if (isAdmin) {
        role = 'admin';
      } else if (isSellerRegistration) {
        role = 'supplier';
      }
      const insertUser = await db.query(
        'INSERT INTO users (phone, name, email, city, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [cleanPhone, name || (role === 'admin' ? 'Master Admin' : 'New User'), email || null, city || null, role]
      );
      user = insertUser.rows[0];
    } else {
      user = userRes.rows[0];
      // If user phone matches admin, automatically promote to admin
      if (isAdmin && user.role !== 'admin') {
        await db.query("UPDATE users SET role = 'admin' WHERE phone = $1", [cleanPhone]);
        user.role = 'admin';
      }
      // Update name/email if provided during a new registration flow but user already existed
      if (name && user.name === 'New User') {
         await db.query('UPDATE users SET name = $1, email = $2, city = $3 WHERE phone = $4', [name, email, city, cleanPhone]);
         user.name = name;
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Clean up used OTP
    await db.query('DELETE FROM otp_requests WHERE phone = $1', [cleanPhone]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        subscription: user.subscription || 'free'
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to verify Admin role
const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Administrator rights required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Route: Get Current User Profile
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, name, phone, email, city, role FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = userRes.rows[0];

    // fetch business details
    const bizRes = await db.query('SELECT * FROM businesses WHERE user_id = $1', [user.id]);
    if (bizRes.rows.length > 0) {
      user.business = bizRes.rows[0];
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Create/Update Business Profile
app.post('/api/businesses', authMiddleware, async (req, res) => {
  const { company_name, gst_number, business_type, address, city, category } = req.body;
  
  try {
    // Check if business exists
    const existing = await db.query('SELECT id FROM businesses WHERE user_id = $1', [req.user.id]);
    
    if (existing.rows.length > 0) {
      await db.query(
        'UPDATE businesses SET company_name = $1, gst_number = $2, business_type = $3, address = $4, city = $5, category = $6 WHERE user_id = $7',
        [company_name, gst_number, business_type, address, city, category, req.user.id]
      );
      res.json({ success: true, message: 'Business updated' });
    } else {
      await db.query(
        'INSERT INTO businesses (user_id, company_name, gst_number, business_type, address, city, category) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [req.user.id, company_name, gst_number, business_type, address, city, category]
      );
      res.json({ success: true, message: 'Business created' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Get Public Businesses / Supplier Directory
app.get('/api/public/businesses', async (req, res) => {
  try {
    const { category, q } = req.query;
    let query = 'SELECT b.id, b.user_id, b.company_name, b.business_type, b.city, b.category, b.is_verified, b.created_at, u.name as owner_name FROM businesses b LEFT JOIN users u ON b.user_id = u.id';
    const params = [];

    if (category) {
      query += ' WHERE LOWER(b.category) = LOWER($1)';
      params.push(category);
    }

    query += ' ORDER BY b.id DESC';
    const result = await db.query(query, params);
    res.json({ businesses: result.rows });
  } catch (err) {
    console.error('Error fetching public businesses:', err);
    res.status(500).json({ error: 'Failed to fetch businesses' });
  }
});

// Route: Get Supplier Leads
app.get('/api/leads', authMiddleware, async (req, res) => {
  try {
    const leadsRes = await db.query('SELECT * FROM leads WHERE supplier_id = $1 ORDER BY created_at ASC', [req.user.id]);
    
    // Check User Subscription Status (Default to free if null)
    const userRes = await db.query('SELECT subscription FROM users WHERE id = $1', [req.user.id]);
    const plan = (userRes.rows[0] && userRes.rows[0].subscription) ? userRes.rows[0].subscription : 'free';
    
    let processedLeads = leadsRes.rows.map((lead, index) => {
      // Bonus/Shared leads cost 50 Rs to unlock contact details
      if (lead.is_direct === false && !lead.is_paid) {
        return {
          ...lead,
          buyer_phone: '********** (Locked - Pay ₹50)',
          locked: true,
          unlock_fee: 50
        };
      }
      
      // Free users get 50 direct leads free. After that, they are locked unless individually paid for
      if (plan === 'free' && index >= 50 && !lead.is_paid && lead.is_direct !== false) {
        return {
          ...lead,
          buyer_phone: '********** (Locked)',
          locked: true
        };
      }
      return lead;
    });

    // Return descending (newest first)
    res.json({ leads: processedLeads.reverse(), plan });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Pay for a specific lead (10 INR deduction/payment mock)
app.post('/api/leads/:id/pay', authMiddleware, async (req, res) => {
  try {
    // In production, integrate Razorpay/Stripe here. For now, mark as paid.
    await db.query('UPDATE leads SET is_paid = true WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'Payment of ₹10 successful. Lead unlocked!' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Upgrade Subscription Plan
app.post('/api/subscriptions/upgrade', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    // plan could be 'basic' (10k), 'pro' (20k), 'enterprise' (30k)
    await db.query('UPDATE users SET subscription = $1 WHERE id = $2', [plan, req.user.id]);
    res.json({ success: true, message: `Successfully upgraded to ${plan.toUpperCase()} plan via No Cost EMI!` });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Update Lead Status (Supplier)
app.put('/api/leads/:id/status', authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE leads SET status = $1 WHERE id = $2 AND supplier_id = $3', [req.body.status, parseInt(req.params.id), req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Reply to Lead (Supplier -> Buyer via WhatsApp)
app.post('/api/leads/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { buyer_phone, message, product_needed } = req.body;
    
    // Save the reply to database
    await db.query('INSERT INTO lead_replies (lead_id, message) VALUES ($1, $2)', [parseInt(req.params.id), message]);

    const waMessage = `*Flenko B2B Update*\n\nYou have a reply from the supplier regarding your RFQ for *${product_needed}*:\n\n💬 "${message}"\n\nLogin to Flenko.com to continue the conversation.`;
    const sent = await sendWhatsAppMessage(buyer_phone, waMessage); // Reusing WhatsApp sender
    
    res.json({ success: true, sent_via_wa: sent });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Get Buyer's own leads (Inquiries they made)
app.get('/api/buyer/leads', authMiddleware, async (req, res) => {
  try {
    // Buyers identify their leads by their phone number for now (since guest leads are possible)
    const phone = req.user.phone;
    const leadsRes = await db.query('SELECT * FROM leads WHERE buyer_phone = $1 ORDER BY created_at DESC', [phone]);
    res.json({ leads: leadsRes.rows });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Submit an Inquiry/Lead (Public / Guest Buyer)
app.post('/api/public/leads', async (req, res) => {
  const { supplier_id, product_needed, buyer_phone, details } = req.body;
  
  try {
    // Save to DB (buyer_id is null for guest) - Target Supplier
    if (supplier_id && supplier_id !== 0 && supplier_id !== '0') {
      await db.query(
        'INSERT INTO leads (supplier_id, buyer_id, product_needed, buyer_phone, details, is_direct) VALUES ($1, $2, $3, $4, $5, $6)',
        [supplier_id, null, product_needed, buyer_phone, details, true]
      );
      
      // Find Supplier Phone to send them a WhatsApp alert
      const supplierRes = await db.query('SELECT phone, name FROM users WHERE id = $1', [supplier_id]);
      if (supplierRes.rows.length > 0) {
        const supplier = supplierRes.rows[0];
        const waMsg = `🚨 *New B2B Lead Received!*\n\n*Product:* ${product_needed}\n*Buyer Contact:* +91-${buyer_phone}\n*Details:* ${details}\n\nLogin to Flenko Seller Panel to reply and win this deal!`;
        await sendWhatsAppMessage(supplier.phone, waMsg); 
      }
    }

    // Distribute lead to up to 5 premium suppliers (excluding the original target supplier)
    // Filter by relevance: they must have a product that matches the lead's product_needed
    const premiumSuppliers = await db.query("SELECT id, phone, name FROM users WHERE subscription != 'free' AND subscription IS NOT NULL AND role = 'supplier' AND id != $1 AND phone != $2", [supplier_id, buyer_phone]);
    const allProducts = await db.query("SELECT supplier_id, name, category FROM products");
    
    const searchTerms = product_needed.toLowerCase().split(' ').filter(w => w.length > 2);
    
    let matchedSuppliers = (premiumSuppliers.rows || []).filter(supp => {
       return (allProducts.rows || []).some(p => {
         if (p.supplier_id !== supp.id) return false;
         const pName = (p.name || '').toLowerCase();
         const pCat = (p.category || '').toLowerCase();
         // If any significant word matches, or category matches
         return searchTerms.some(term => pName.includes(term) || pCat.includes(term));
       });
    });
    
    matchedSuppliers = matchedSuppliers.slice(0, 5); // Limit to 5

    // Fallback: If no strict category match, just give it to any 5 premium suppliers so the lead isn't lost
    if (matchedSuppliers.length === 0 && premiumSuppliers.rows.length > 0) {
      matchedSuppliers = premiumSuppliers.rows.slice(0, 5);
    }
    
    if (matchedSuppliers.length > 0) {
      for (const premSupp of matchedSuppliers) {
        // Insert lead for premium supplier
        await db.query(
          'INSERT INTO leads (supplier_id, buyer_id, product_needed, buyer_phone, details, is_direct) VALUES ($1, $2, $3, $4, $5, $6)',
          [premSupp.id, null, product_needed, buyer_phone, details, false]
        );
        // Send WhatsApp alert to premium supplier
        const waMsgPrem = `🌟 *Premium Bonus Lead!*\n\n*Product:* ${product_needed}\n*Buyer Contact:* +91-${buyer_phone}\n*Details:* ${details}\n\nAs a Premium Flenko Supplier, we are sharing this lead with you!`;
        await sendWhatsAppMessage(premSupp.phone, waMsgPrem);
      }
    }

    res.json({ success: true, message: 'Inquiry sent successfully' });
  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Get Single Product (Public)
app.get('/api/public/products/:id', async (req, res) => {
  try {
    const prods = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (prods.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const product = prods.rows[0];
    const supplierRes = await db.query('SELECT company_name, city FROM businesses WHERE user_id = $1', [product.supplier_id]);
    if (supplierRes.rows.length > 0) {
       product.supplier = supplierRes.rows[0];
    }
    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../assets/images/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Route: Get Products for a Supplier
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const prods = await db.query('SELECT * FROM products WHERE supplier_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ products: prods.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve uploaded images statically
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Route: Add a Product
app.post('/api/products', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, price, category, moq, unit } = req.body;
  
  // Create an absolute URL for the image so it loads correctly when HTML is opened via file://
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const image_url = req.file ? `${baseUrl}/assets/images/products/${req.file.filename}` : 'https://via.placeholder.com/400x300?text=No+Image';
  
  // Auto-SEO Generator
  const autoSeoTags = `buy ${name} wholesale, best ${name} supplier, ${name} manufacturers, top quality ${category}`;

  try {
    const newProd = await db.query(
      'INSERT INTO products (supplier_id, name, price, category, moq, unit, image_url, seo_tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, name, price || 0, category || 'Uncategorized', moq || 1, unit || 'Pieces', image_url, autoSeoTags]
    );
    res.json({ success: true, product: newProd.rows[0], seo_generated: autoSeoTags });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Route: Update Product
app.put('/api/products/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { name, price, category, moq, unit } = req.body;
  
  try {
    let updateQuery = 'UPDATE products SET name = $1, price = $2, category = $3, moq = $4, unit = $5 WHERE id = $6 AND supplier_id = $7 RETURNING *';
    let params = [name, price, category || 'Uncategorized', moq, unit || 'Pieces', parseInt(req.params.id), req.user.id];

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const image_url = `${baseUrl}/assets/images/products/${req.file.filename}`;
      updateQuery = 'UPDATE products SET name = $1, price = $2, category = $3, moq = $4, unit = $5, image_url = $6 WHERE id = $7 AND supplier_id = $8 RETURNING *';
      params = [name, price, category || 'Uncategorized', moq, unit || 'Pieces', image_url, parseInt(req.params.id), req.user.id];
    }
    
    const updatedProd = await db.query(updateQuery, params);
    if (updatedProd.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    res.json({ success: true, product: updatedProd.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Route: Delete Product
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await db.query('DELETE FROM products WHERE id = $1 AND supplier_id = $2 RETURNING *', [parseInt(req.params.id), req.user.id]);
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Route: Get ALL Products (Public)
app.get('/api/public/products', async (req, res) => {
  try {
    const prods = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: prods.rows });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================
// RFQ & Quotation APIs (Module 3 & 4)
// ==========================

// Buyer: Post RFQ
app.post('/api/buyer/rfqs', authMiddleware, async (req, res) => {
  const { product, qty, target_price, details } = req.body;
  try {
    const newRfq = await db.query(
      'INSERT INTO rfqs (buyer_id, product, qty, target_price, details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, product, qty, target_price, details]
    );
    res.json({ success: true, rfq: newRfq.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post RFQ' });
  }
});

// Buyer: Get My RFQs and their Quotes
app.get('/api/buyer/rfqs', authMiddleware, async (req, res) => {
  try {
    const rfqs = await db.query('SELECT * FROM rfqs WHERE buyer_id = $1 ORDER BY created_at DESC', [req.user.id]);
    const rfqsWithQuotes = await Promise.all(rfqs.rows.map(async (r) => {
      const quotes = await db.query(
        'SELECT q.*, u.name as supplier_name FROM quotations q JOIN users u ON q.supplier_id = u.id WHERE q.rfq_id = $1',
        [r.id]
      );
      return { ...r, quotes: quotes.rows };
    }));
    res.json({ success: true, rfqs: rfqsWithQuotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RFQs' });
  }
});

// Supplier: Get Open RFQs
app.get('/api/supplier/rfqs', authMiddleware, async (req, res) => {
  try {
    const allRfqs = await db.query('SELECT * FROM rfqs ORDER BY created_at DESC');
    const myProducts = await db.query('SELECT name, category FROM products WHERE supplier_id = $1', [req.user.id]);
    
    // Filter RFQs: only show if the RFQ product loosely matches the supplier's products or categories
    let relevantRfqs = allRfqs.rows.filter(rfq => {
      const searchTerms = rfq.product.toLowerCase().split(' ').filter(w => w.length > 2);
      return myProducts.rows.some(p => {
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        return searchTerms.some(term => pName.includes(term) || pCat.includes(term));
      });
    });

    // Check if supplier has already quoted
    const rfqsStatus = await Promise.all(relevantRfqs.map(async (r) => {
      const existingQuote = await db.query('SELECT id FROM quotations WHERE rfq_id = $1 AND supplier_id = $2', [r.id, req.user.id]);
      return { ...r, has_quoted: existingQuote.rows.length > 0 };
    }));
    res.json({ success: true, rfqs: rfqsStatus });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open RFQs' });
  }
});

// Supplier: Submit Quotation
app.post('/api/supplier/rfqs/:id/quote', authMiddleware, async (req, res) => {
  const { price_quoted, message } = req.body;
  try {
    const newQuote = await db.query(
      'INSERT INTO quotations (rfq_id, supplier_id, price_quoted, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [parseInt(req.params.id), req.user.id, price_quoted, message]
    );
    res.json({ success: true, quote: newQuote.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit quote' });
  }
});

// ==========================
// Admin Routes (Module 5) - Strictly Protected
// ==========================
// Route: Admin Dashboard Stats
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const statsRes = await db.query('SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM leads) as leads, (SELECT COUNT(*) FROM products) as products');
    const recentUsers = await db.query('SELECT id, name, phone, role, subscription FROM users ORDER BY id DESC LIMIT 10');
    
    res.json({
      success: true,
      stats: statsRes.rows[0] || { users: 0, leads: 0, products: 0 },
      recentUsers: recentUsers.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Admin stats error' });
  }
});

// Route: Admin Delete User
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    const deleted = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [parseInt(req.params.id)]);
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Also delete their products, business profile, etc in real DB. For mock, handled in db.js or via cascading.
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Delete user error' });
  }
});

// Route: Admin Get User Leads
app.get('/api/admin/users/:id/leads', adminMiddleware, async (req, res) => {
  try {
    const leadsRes = await db.query('SELECT * FROM leads WHERE supplier_id = $1 ORDER BY created_at DESC', [parseInt(req.params.id)]);
    res.json({ success: true, leads: leadsRes.rows });
  } catch (error) {
    res.status(500).json({ error: 'Admin fetch leads error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Flenko API Server running on port ${PORT}`);
});
