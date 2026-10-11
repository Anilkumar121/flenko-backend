const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./database/db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const { sendWhatsAppMessage, getLatestQR } = require('./whatsapp');

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Flenko Backend Server is alive and running!' });
});

// Route: Dynamic QR Page for WhatsApp Link
app.get('/qr', (req, res) => {
  const qrData = getLatestQR();
  
  if (qrData === 'READY') {
    return res.send('<h2>✅ WhatsApp is successfully connected! You can close this window.</h2>');
  }
  
  if (!qrData) {
    return res.send('<meta http-equiv="refresh" content="2"><h2>🔄 Loading QR Code... Please wait...</h2>');
  }

  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="5">
        <title>Scan WhatsApp QR</title>
        <style>body { font-family: sans-serif; text-align: center; margin-top: 50px; background: #f1f3f6; } img { border: 10px solid white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }</style>
      </head>
      <body>
        <h2>📱 Link Flenko WhatsApp Bot</h2>
        <p>Scan this QR code using WhatsApp (Linked Devices). It refreshes automatically every 5 seconds.</p>
        <img src="${qrData}" width="300" height="300" />
      </body>
    </html>
  `);
});

// Route: Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number is required' });
  }

  const otp = generateOTP();
  // Expire in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    // Save OTP to database
    await db.query('DELETE FROM otp_requests WHERE phone = $1', [phone]);
    await db.query(
      'INSERT INTO otp_requests (phone, otp, expires_at) VALUES ($1, $2, $3)',
      [phone, otp, expiresAt]
    );

    // Send real WhatsApp message
    const otpMsg = `*Flenko.com - B2B Marketplace*\n\nYour Login OTP is: *${otp}*\n\nPlease do not share this code with anyone.`;
    const sent = await sendWhatsAppMessage(phone, otpMsg);

    if (sent) {
       res.json({ success: true, message: 'OTP sent via WhatsApp!' });
    } else {
       // Fallback for demo if WhatsApp is not scanned yet
       res.json({ 
         success: true, 
         message: 'WhatsApp not linked. Simulated OTP.',
         _devOtp: otp 
       });
    }
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route: Verify OTP & Login/Register
app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, otp, name, email, city, isSellerRegistration } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  try {
    // Find valid OTP
    const otpRes = await db.query(
      'SELECT * FROM otp_requests WHERE phone = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [phone, otp]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if user exists
    let userRes = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;

    if (userRes.rows.length === 0) {
      // User doesn't exist, create them
      const role = isSellerRegistration ? 'supplier' : 'buyer';
      const insertUser = await db.query(
        'INSERT INTO users (phone, name, email, city, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [phone, name || 'New User', email || null, city || null, role]
      );
      user = insertUser.rows[0];
    } else {
      user = userRes.rows[0];
      // Update name/email if provided during a new registration flow but user already existed
      if (name && user.name === 'New User') {
         await db.query('UPDATE users SET name = $1, email = $2, city = $3 WHERE phone = $4', [name, email, city, phone]);
         user.name = name;
      }
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, phone: user.phone, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Clean up OTP
    await db.query('DELETE FROM otp_requests WHERE phone = $1', [phone]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal server error' });
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
// Admin Routes (Module 5)
// ==========================
// Route: Admin Dashboard Stats
app.get('/api/admin/stats', authMiddleware, async (req, res) => {
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
app.delete('/api/admin/users/:id', authMiddleware, async (req, res) => {
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
app.get('/api/admin/users/:id/leads', authMiddleware, async (req, res) => {
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
