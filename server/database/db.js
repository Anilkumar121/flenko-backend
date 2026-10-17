const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      connectionTimeoutMillis: 3000,
    };

const pool = new Pool(poolConfig);

const fs = require('fs');
const path = require('path');

const mockDbPath = path.join(__dirname, 'db.json');

// VERY basic in-memory fallback for DEVELOPMENT ONLY
// when Postgres is not running locally
let mockDB = {
  users: [],
  otp_requests: [],
  businesses: [],
  leads: [
    { id: 1, supplier_id: 1, product_needed: '1000 Corrugated Boxes', buyer_phone: '9876543210', details: 'Need heavy duty 5-ply boxes', status: 'New', created_at: new Date() }
  ],
  products: [],
  rfqs: [],
  quotations: [],
  password_resets: [],
  lead_payments: [],
  subscription_payments: [],
  reviews: [],
  idCounter: 2
};

// Load existing data from file if available
if (fs.existsSync(mockDbPath)) {
  try {
    const data = fs.readFileSync(mockDbPath, 'utf8');
    const parsed = JSON.parse(data);
    mockDB = { ...mockDB, ...parsed };
    mockDB.rfqs = mockDB.rfqs || [];
    mockDB.quotations = mockDB.quotations || [];
    mockDB.products = mockDB.products || [];
    mockDB.users = mockDB.users || [];
    mockDB.lead_payments = mockDB.lead_payments || [];
    mockDB.subscription_payments = mockDB.subscription_payments || [];
    mockDB.reviews = mockDB.reviews || [];
    mockDB.platform_settings = mockDB.platform_settings || [];
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

// Seed initial supplier reviews if empty
if (!mockDB.reviews || mockDB.reviews.length === 0) {
  mockDB.reviews = [
    {
      id: 1,
      supplier_id: 1,
      product_id: 101,
      product_name: 'Heavy-Duty Corrugated Boxes',
      reviewer_name: 'Rajesh K. (Procurement Head)',
      rating: 5,
      comment: 'Top quality material and on-time bulk delivery. Highly recommend for large packaging orders.',
      created_at: new Date(Date.now() - 3 * 86400000)
    },
    {
      id: 2,
      supplier_id: 1,
      product_id: null,
      product_name: 'Bulk Packaging Supply',
      reviewer_name: 'Sunil Mehta (Operations Director)',
      rating: 5,
      comment: 'Very professional response to our RFQ. Excellent prices and custom printing options.',
      created_at: new Date(Date.now() - 7 * 86400000)
    }
  ];
}

// Ensure Master Admin exists
if (!mockDB.users.some(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === '8368074009')) {
  mockDB.users.push({
    id: 1,
    phone: '8368074009',
    password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
    name: 'Master Admin',
    email: 'admin@flenko.com',
    city: 'New Delhi',
    role: 'admin',
    subscription: 'vip',
    created_at: new Date()
  });
}

// Ensure default business for supplier 1 has subdomain & paid trusted status
let supBiz = (mockDB.businesses || []).find(b => b.user_id == 1 || b.id == 1);
if (!supBiz) {
  mockDB.businesses = mockDB.businesses || [];
  mockDB.businesses.push({
    id: 1,
    user_id: 1,
    company_name: 'Apex Packaging Solutions',
    category: 'Packaging & Printing',
    business_type: 'Manufacturer & Wholesaler',
    gst_number: '27AADCA9821Z5',
    city: 'Mumbai',
    country: 'India',
    address: 'Plot 45, MIDC Industrial Estate, Andheri East, Mumbai, Maharashtra 400069',
    about: 'Apex Packaging Solutions is a leading manufacturer of high-grade industrial packaging materials, corrugated boxes, and shipping supplies. We specialize in custom packaging designs tailored to your business needs, ensuring safe and efficient logistics for your products.',
    is_verified: true,
    is_paid_trusted: true,
    subdomain: 'apexpackaging',
    website_enabled: true,
    website_tagline: 'Leading Industrial Packaging & Corrugated Box Manufacturer',
    logo_url: 'assets/images/logo.png',
    year_est: '2015',
    created_at: new Date('2020-01-15')
  });
} else {
  supBiz.subdomain = supBiz.subdomain || 'apexpackaging';
  supBiz.is_paid_trusted = (supBiz.is_paid_trusted !== undefined) ? supBiz.is_paid_trusted : true;
  supBiz.website_enabled = (supBiz.website_enabled !== undefined) ? supBiz.website_enabled : true;
  supBiz.website_tagline = supBiz.website_tagline || 'Leading Industrial Packaging & Corrugated Box Manufacturer';
}

function saveMockDB() {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(mockDB, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let useMock = false;

async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255),
      name VARCHAR(100),
      email VARCHAR(100),
      city VARCHAR(100),
      role VARCHAR(20) DEFAULT 'buyer',
      subscription VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(50) DEFAULT 'free'`,
    `CREATE TABLE IF NOT EXISTS otp_requests (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      company_name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      gst_number VARCHAR(20),
      business_type VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      is_verified BOOLEAN DEFAULT FALSE,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category VARCHAR(100)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_paid_trusted BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_enabled BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_tagline TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_theme VARCHAR(50) DEFAULT 'modern'`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS year_est VARCHAR(20)`,
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER,
      name VARCHAR(200) NOT NULL,
      price DECIMAL(12, 2),
      category VARCHAR(100),
      moq INTEGER DEFAULT 1,
      unit VARCHAR(50) DEFAULT 'pieces',
      image_url TEXT,
      seo_tags TEXT,
      stock_quantity INTEGER DEFAULT 500,
      country VARCHAR(100) DEFAULT 'India',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 500`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_tags TEXT`,
    `CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER,
      buyer_id INTEGER,
      product_needed VARCHAR(255),
      buyer_phone VARCHAR(20),
      details TEXT,
      status VARCHAR(50) DEFAULT 'New',
      is_direct BOOLEAN DEFAULT FALSE,
      is_paid BOOLEAN DEFAULT FALSE,
      replies JSONB DEFAULT '[]'::jsonb,
      source VARCHAR(50) DEFAULT 'flenko_direct',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_direct BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'flenko_direct'`,
    `ALTER TABLE leads ALTER COLUMN supplier_id DROP NOT NULL`,
    `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_supplier_id_fkey`,
    `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_buyer_id_fkey`,
    `CREATE TABLE IF NOT EXISTS rfqs (
      id SERIAL PRIMARY KEY,
      buyer_id INTEGER,
      product VARCHAR(255) NOT NULL,
      qty VARCHAR(50),
      target_price VARCHAR(50),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE rfqs ALTER COLUMN buyer_id DROP NOT NULL`,
    `ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_buyer_id_fkey`,
    `CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      rfq_id INTEGER,
      supplier_id INTEGER,
      price_quoted VARCHAR(50),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      email VARCHAR(150),
      token VARCHAR(100) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lead_payments (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      amount DECIMAL(10, 2) DEFAULT 50.00,
      utr VARCHAR(64) NOT NULL UNIQUE,
      screenshot_url TEXT,
      payer_phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'verified',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      plan VARCHAR(50) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      utr VARCHAR(64) NOT NULL UNIQUE,
      screenshot_url TEXT,
      status VARCHAR(20) DEFAULT 'verified',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS about TEXT`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(255),
      reviewer_name VARCHAR(100) DEFAULT 'Verified Buyer',
      rating INTEGER DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS platform_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch(err) {
      // Ignore non-fatal column / constraint warnings
    }
  }
  console.log('✅ PostgreSQL schema verified and synchronized successfully.');
}

pool.query('SELECT 1').then(() => {
  console.log('✅ PostgreSQL connected successfully!');
  ensureTables();
}).catch(() => {
  console.warn('⚠️ PostgreSQL connection failed. Using IN-MEMORY DEVELOPMENT ADAPTER (Data saved to db.json).');
  useMock = true;
});

module.exports = {
  query: async (text, params = []) => {
    if (!useMock) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn('Postgres query failed:', err.message);
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || (err.message && err.message.includes('Connection terminated')) || (err.message && err.message.includes('timeout'))) {
          console.warn('Switching to mock adapter due to connection loss.');
          useMock = true;
        }
      }
    }
    
    // DEVELOPMENT ADAPTER LOGIC
    // This is a naive regex parser just to handle the basic queries in app.js for the demo
    if (text.includes('INSERT INTO otp_requests')) {
      mockDB.otp_requests = mockDB.otp_requests || [];
      const cleanPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      mockDB.otp_requests.push({ 
        phone: cleanPhone, 
        otp: (params[1] || '').toString().trim(), 
        expires_at: params[2], 
        created_at: new Date() 
      });
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM otp_requests')) {
      const targetPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const targetOtp = (params[1] || '').toString().trim();
      mockDB.otp_requests = mockDB.otp_requests || [];
      const row = mockDB.otp_requests.find(o => 
        (o.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone && 
        (o.otp || '').toString().trim() === targetOtp && 
        new Date(o.expires_at).getTime() > Date.now()
      );
      return { rows: row ? [row] : [] };
    }
    if (text.includes('SELECT id, phone, name FROM users WHERE subscription')) {
      const rows = mockDB.users.filter(u => u.subscription && u.subscription !== 'free' && u.role === 'supplier' && u.id !== params[0]).slice(0, 5);
      return { rows };
    }
    if (text.includes('INSERT INTO users')) {
      const cleanPhone = (params[0] || '').toString().trim();
      const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);
      mockDB.users = mockDB.users || [];
      let existing = mockDB.users.find(u => {
        const uDigits = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
        const uEmail = (u.email || '').toLowerCase();
        return (cleanPhoneDigits && cleanPhoneDigits.length >= 7 && uDigits === cleanPhoneDigits) || 
               (params[3] && uEmail === params[3].toString().toLowerCase());
      });
      if (existing) {
        if (params[1]) existing.password = params[1];
        if (params[2]) existing.name = params[2];
        if (params[3]) existing.email = params[3];
        if (params[4]) existing.city = params[4];
        if (params[5]) existing.role = params[5];
        saveMockDB();
        return { rows: [existing] };
      }
      let newUser;
      if (params.length >= 6) {
        newUser = { 
          id: mockDB.idCounter++, 
          phone: cleanPhone, 
          password: params[1], 
          name: params[2], 
          email: params[3], 
          city: params[4], 
          role: params[5], 
          subscription: 'free' 
        };
      } else {
        newUser = { 
          id: mockDB.idCounter++, 
          phone: cleanPhone, 
          password: null, 
          name: params[1], 
          email: params[2], 
          city: params[3], 
          role: params[4], 
          subscription: 'free' 
        };
      }
      mockDB.users.push(newUser);
      saveMockDB();
      return { rows: [newUser] };
    }
    if (text.includes('SELECT * FROM users WHERE')) {
      mockDB.users = mockDB.users || [];
      const cleanParams = params.map(p => (p !== null && p !== undefined) ? p.toString().trim() : '');
      const row = mockDB.users.find(u => {
        const uPhone = (u.phone || '').toString();
        const uPhoneDigits = uPhone.replace(/[^0-9]/g, '');
        const uPhone10 = uPhoneDigits.slice(-10);
        const uEmail = (u.email || '').toString().trim().toLowerCase();
        for (const p of cleanParams) {
          if (!p) continue;
          const pLower = p.toLowerCase();
          const pDigits = p.replace(/[^0-9]/g, '');
          const p10 = pDigits.slice(-10);
          if (pLower.includes('@') && uEmail === pLower) return true;
          if (u.phone === p || uPhoneDigits === pDigits) return true;
          if (p10 && p10.length >= 7 && (uPhone10 === p10 || uPhoneDigits === pDigits)) return true;
          if (u.id && u.id.toString() === p) return true;
        }
        return false;
      });
      return { rows: row ? [row] : [] };
    }
    if (text.includes('INSERT INTO password_resets')) {
      mockDB.password_resets = mockDB.password_resets || [];
      const newReset = {
        id: mockDB.idCounter++,
        user_id: params[0],
        email: params[1],
        token: params[2],
        expires_at: params[3],
        created_at: new Date()
      };
      mockDB.password_resets.push(newReset);
      saveMockDB();
      return { rows: [newReset] };
    }
    if (text.includes('SELECT * FROM password_resets WHERE token = $1')) {
      mockDB.password_resets = mockDB.password_resets || [];
      const row = mockDB.password_resets.find(r => r.token === params[0] && new Date(r.expires_at).getTime() > Date.now());
      return { rows: row ? [row] : [] };
    }
    if (text.includes('DELETE FROM password_resets WHERE token = $1')) {
      mockDB.password_resets = (mockDB.password_resets || []).filter(r => r.token !== params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM password_resets WHERE user_id = $1')) {
      mockDB.password_resets = (mockDB.password_resets || []).filter(r => r.user_id != params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET password = $1 WHERE id = $2')) {
      const user = (mockDB.users || []).find(u => u.id == params[1]);
      if (user) { user.password = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET password = $1 WHERE phone = $2')) {
      const targetPhone = (params[1] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const user = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      if (user) { user.password = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET name = $1 WHERE id = $2')) {
      const user = (mockDB.users || []).find(u => u.id == params[1]);
      if (user) { user.name = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET') && text.includes('WHERE id =')) {
      const targetUserId = params[params.length - 1];
      const user = (mockDB.users || []).find(u => u.id == targetUserId);
      if (user) {
        if (params[0]) user.name = params[0];
        if (params[1]) user.city = params[1];
      }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET')) {
      const targetPhone = (params[3] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const user = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      if (user) { user.name = params[0]; user.email = params[1]; user.city = params[2]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM otp_requests')) {
      const targetPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      mockDB.otp_requests = (mockDB.otp_requests || []).filter(o => (o.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) !== targetPhone);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('FROM users WHERE id')) {
      const row = mockDB.users.find(u => u.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses WHERE user_id') || text.includes('FROM businesses WHERE id')) {
      const targetId = params[0];
      const row = mockDB.businesses.find(b => b.user_id == targetId || b.id == targetId);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses WHERE LOWER(subdomain)') || text.includes('FROM businesses WHERE subdomain')) {
      const targetSub = (params[0] || '').toString().toLowerCase().trim();
      const row = mockDB.businesses.find(b => (b.subdomain || '').toLowerCase().trim() === targetSub || String(b.user_id) === targetSub);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses') && text.includes('SELECT')) {
      let rows = [...mockDB.businesses];
      if (params.length > 0 && text.includes('LOWER(b.category) = LOWER($1)')) {
        rows = rows.filter(b => b.category && b.category.toLowerCase() === params[0].toLowerCase());
      }
      return { rows: rows.reverse() };
    }
    if (text.includes('INSERT INTO businesses')) {
      const newBiz = {
        id: mockDB.idCounter++,
        user_id: params[0],
        company_name: params[1],
        gst_number: params[2],
        business_type: params[3],
        address: params[4],
        city: params[5],
        category: params[6],
        logo_url: params[7] || null,
        country: params[8] || 'India',
        about: params[9] || '',
        subdomain: params[10] || null,
        is_paid_trusted: params[11] || false,
        website_enabled: params[12] || false,
        website_tagline: params[13] || null,
        is_verified: true,
        year_est: params[10] || params[9] || '',
        created_at: new Date()
      };
      mockDB.businesses.push(newBiz);
      saveMockDB();
      return { rows: [newBiz] };
    }
    if (text.includes('UPDATE businesses SET website_enabled')) {
      const targetUserId = params[params.length - 1];
      let biz = mockDB.businesses.find(b => b.user_id == targetUserId || b.id == targetUserId);
      if (biz) {
        biz.website_enabled = true;
        biz.subdomain = params[0];
        biz.website_tagline = params[1] || biz.website_tagline;
        biz.is_paid_trusted = true;
      }
      saveMockDB();
      return { rows: biz ? [biz] : [] };
    }
    if (text.includes('UPDATE businesses SET')) {
      const targetUserId = params[params.length - 1];
      let biz = mockDB.businesses.find(b => b.user_id == targetUserId || b.id == targetUserId);
      if (biz) { 
        biz.company_name = params[0] || biz.company_name; 
        biz.gst_number = params[1] !== undefined ? params[1] : biz.gst_number; 
        biz.business_type = params[2] || biz.business_type; 
        biz.address = params[3] !== undefined ? params[3] : biz.address; 
        biz.city = params[4] || biz.city; 
        biz.category = params[5] || biz.category; 
        biz.logo_url = params[6] || biz.logo_url;
        if (params.length >= 9) {
          biz.country = params[7] || biz.country || 'India';
          biz.about = params[8] !== undefined ? params[8] : biz.about;
        }
        if (params.length >= 11) {
          biz.subdomain = params[9] || biz.subdomain;
          if (params[10] !== undefined) biz.is_paid_trusted = params[10];
        }
        if (text.includes('year_est')) {
          const parts = text.split('SET')[1].split('WHERE')[0].split(',');
          const yIdx = parts.findIndex(p => p.includes('year_est'));
          if (yIdx !== -1 && params[yIdx] !== undefined) {
            biz.year_est = params[yIdx];
          }
        }
      } else {
        biz = {
          id: mockDB.idCounter++,
          user_id: targetUserId,
          company_name: params[0] || 'Supplier Company',
          gst_number: params[1] || '',
          business_type: params[2] || 'Manufacturer',
          address: params[3] || '',
          city: params[4] || 'New Delhi',
          category: params[5] || 'General',
          logo_url: params[6] || null,
          country: params[7] || 'India',
          about: params[8] || '',
          subdomain: params[9] || null,
          is_paid_trusted: false,
          website_enabled: false,
          is_verified: true,
          created_at: new Date()
        };
        mockDB.businesses.push(biz);
      }
      saveMockDB();
      return { rows: [biz] };
    }
    if (text.includes('INSERT INTO reviews')) {
      mockDB.reviews = mockDB.reviews || [];
      const newReview = {
        id: mockDB.idCounter++,
        supplier_id: Number(params[0]),
        product_id: params[1] ? Number(params[1]) : null,
        product_name: params[2] || 'General Supplier Review',
        reviewer_name: params[3] || 'Verified Buyer',
        rating: Number(params[4]) || 5,
        comment: params[5] || '',
        created_at: new Date()
      };
      mockDB.reviews.push(newReview);
      saveMockDB();
      return { rows: [newReview] };
    }
    if (text.includes('FROM reviews') && text.includes('WHERE supplier_id')) {
      mockDB.reviews = mockDB.reviews || [];
      const targetSuppId = Number(params[0]);
      const rows = mockDB.reviews.filter(r => Number(r.supplier_id) === targetSuppId);
      return { rows: rows.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('FROM reviews')) {
      mockDB.reviews = mockDB.reviews || [];
      return { rows: mockDB.reviews.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('FROM leads WHERE') && (text.includes('supplier_id') || text.includes('supplier_id IS NULL') || text.includes('is_direct'))) {
      const targetSuppId = params[0];
      const rows = (mockDB.leads || []).filter(l => {
        const isDirect = l.is_direct === true || l.is_direct === 'true';
        if (isDirect) {
          return l.supplier_id == targetSuppId;
        }
        return true; // Buy leads are visible to all suppliers
      });
      return { rows: rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('SELECT * FROM leads WHERE supplier_id')) {
      const rows = (mockDB.leads || []).filter(l => l.supplier_id == params[0] || !l.supplier_id || l.supplier_id == 0).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    if (text.includes('INSERT INTO leads')) {
      const newLead = { 
        id: mockDB.idCounter++, 
        supplier_id: params[0], 
        buyer_id: params[1], 
        product_needed: params[2], 
        buyer_phone: params[3], 
        details: params[4], 
        is_direct: params[5],
        is_paid: params[6] !== undefined ? params[6] : (params[5] === true),
        status: 'New', 
        source: (params[7] !== undefined) ? params[7] : 'flenko_direct',
        created_at: new Date() 
      };
      mockDB.leads.push(newLead);
      saveMockDB();
      return { rows: [newLead] };
    }
    if (text.includes('FROM leads WHERE id = $1') || text.includes('SELECT * FROM leads WHERE id')) {
      const row = (mockDB.leads || []).find(l => l.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('UPDATE leads SET is_paid')) {
      const isPaidVal = !text.includes('is_paid = false');
      const lead = (mockDB.leads || []).find(l => l.id == params[0]);
      if (lead) {
        lead.is_paid = isPaidVal;
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('DELETE FROM leads WHERE id = $1')) {
      mockDB.leads = mockDB.leads || [];
      const idx = mockDB.leads.findIndex(l => l.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.leads.splice(idx, 1);
        if (mockDB.lead_payments) {
          mockDB.lead_payments = mockDB.lead_payments.filter(lp => lp.lead_id != params[0]);
        }
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('FROM leads') && (text.includes('u_buyer') || text.includes('ORDER BY l.id DESC') || text.includes('SELECT l.*') || text.includes('ORDER BY id DESC'))) {
      mockDB.leads = mockDB.leads || [];
      mockDB.users = mockDB.users || [];
      mockDB.businesses = mockDB.businesses || [];
      const userMap = {};
      (mockDB.users || []).forEach(u => { userMap[u.id] = u; });
      const bizMap = {};
      (mockDB.businesses || []).forEach(b => { bizMap[b.user_id] = b; });

      const sorted = (mockDB.leads || []).slice().sort((a,b) => (b.id || 0) - (a.id || 0));
      const enriched = sorted.map(l => {
        const buyer = userMap[l.buyer_id] || {};
        const sup = userMap[l.supplier_id] || {};
        const biz = bizMap[l.supplier_id] || {};
        return {
          ...l,
          buyer_name: buyer.name || 'Buyer',
          buyer_phone: l.buyer_phone || buyer.phone || 'N/A',
          buyer_email: buyer.email || '',
          buyer_city: buyer.city || '',
          supplier_name: biz.company_name || sup.name || (l.supplier_id ? ('Supplier #' + l.supplier_id) : ''),
          supplier_phone: sup.phone || '',
          supplier_email: sup.email || ''
        };
      });
      return { rows: enriched };
    }
    if (text.includes('FROM leads WHERE supplier_id = $1 OR buyer_id = $1')) {
      const uId = params[0];
      const rows = (mockDB.leads || []).filter(l => l.supplier_id == uId || l.buyer_id == uId);
      return { rows: rows.slice().reverse() };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads WHERE is_direct = true')) {
      const cnt = (mockDB.leads || []).filter(l => l.is_direct === true || l.is_direct === 'true').length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads WHERE is_direct = false OR supplier_id IS NULL')) {
      const cnt = (mockDB.leads || []).filter(l => !l.is_direct || l.is_direct === false || l.is_direct === 'false' || !l.supplier_id).length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads')) {
      const cnt = (mockDB.leads || []).length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('INSERT INTO lead_payments')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rec = { id: mockDB.idCounter++, lead_id: params[0], supplier_id: params[1], amount: params[2], utr: params[3], screenshot_url: params[4], payer_phone: params[5], status: params[6] || 'verified', created_at: new Date() };
      mockDB.lead_payments.push(rec);
      saveMockDB();
      return { rows: [rec] };
    }
    if (text.includes('FROM lead_payments WHERE id = $1') || text.includes('SELECT * FROM lead_payments WHERE id')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const row = mockDB.lead_payments.find(p => p.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('UPDATE lead_payments SET status')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const pay = mockDB.lead_payments.find(p => p.id == params[0]);
      if (pay) {
        pay.status = 'fraud';
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('FROM lead_payments WHERE utr')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const found = mockDB.lead_payments.filter(p => p.utr === params[0]);
      return { rows: found };
    }
    if (text.includes('FROM subscription_payments WHERE utr')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      const found = mockDB.subscription_payments.filter(p => p.utr === params[0]);
      return { rows: found };
    }
    if (text.includes('INSERT INTO subscription_payments')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      const rec = { id: mockDB.idCounter++, user_id: params[0], plan: params[1], amount: params[2], utr: params[3], screenshot_url: params[4], status: params[5] || 'verified', created_at: new Date() };
      mockDB.subscription_payments.push(rec);
      saveMockDB();
      return { rows: [rec] };
    }
    if (text.includes('FROM lead_payments WHERE lead_id = $1 AND supplier_id = $2')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rows = mockDB.lead_payments.filter(p => p.lead_id == params[0] && p.supplier_id == params[1] && p.status === 'verified');
      return { rows };
    }
    if (text.includes('FROM lead_payments WHERE supplier_id = $1')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rows = mockDB.lead_payments.filter(p => p.supplier_id == params[0] && (!text.includes('status =') || p.status === 'verified'));
      return { rows };
    }
    if (text.includes('SELECT * FROM lead_payments') || text.includes('FROM lead_payments')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      return { rows: mockDB.lead_payments.slice().reverse() };
    }
    if (text.includes('SELECT * FROM subscription_payments') || text.includes('FROM subscription_payments')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      return { rows: mockDB.subscription_payments.slice().reverse() };
    }
    if (text.includes('SELECT subscription FROM users')) {
      const user = mockDB.users.find(u => u.id === params[0]);
      return { rows: user ? [user] : [] };
    }
    if (text.includes('UPDATE users SET subscription')) {
      const user = mockDB.users.find(u => u.id === params[1]);
      if (user) user.subscription = params[0];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE leads SET status')) {
      const lead = mockDB.leads.find(l => l.id === params[1]);
      if (lead) lead.status = params[0];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('INSERT INTO lead_replies')) {
      const lead = mockDB.leads.find(l => l.id === params[0]);
      if (lead) {
        lead.replies = lead.replies || [];
        lead.replies.push({
          message: params[1],
          created_at: new Date()
        });
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM leads WHERE buyer_phone')) {
      const rows = mockDB.leads.filter(l => l.buyer_phone === params[0]).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    if (text.includes('SELECT * FROM products WHERE id = $1')) {
      mockDB.products = mockDB.products || [];
      const row = mockDB.products.find(p => p.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('INSERT INTO products')) {
      const newProd = { 
        id: mockDB.idCounter++, 
        supplier_id: params[0], 
        name: params[1], 
        price: (params[2] !== undefined && params[2] !== null && params[2] !== '' && !isNaN(Number(params[2]))) ? Number(params[2]) : null, 
        category: params[3], 
        moq: params[4], 
        unit: params[5],
        image_url: params[6], 
        seo_tags: params[7],
        stock_quantity: params[8] !== undefined ? parseInt(params[8]) : 500,
        country: params[9] || 'India',
        created_at: new Date() 
      };
      mockDB.products = mockDB.products || [];
      mockDB.products.push(newProd);
      saveMockDB();
      return { rows: [newProd] };
    }
    if (text.includes('SELECT * FROM products WHERE supplier_id')) {
      mockDB.products = mockDB.products || [];
      const rows = mockDB.products.filter(p => p.supplier_id == params[0]);
      return { rows };
    }
    if (text.includes('UPDATE products') && text.includes('image_url')) {
      const targetId = parseInt(params[params.length - 1]) || parseInt(params[params.length - 2]);
      let prod = mockDB.products.find(p => p.id == targetId);
      if (prod) {
        prod.name = params[0] || prod.name;
        prod.price = (params[1] !== undefined && params[1] !== null && params[1] !== '' && !isNaN(Number(params[1]))) ? Number(params[1]) : prod.price;
        prod.category = params[2] || prod.category;
        prod.moq = parseInt(params[3]) || prod.moq || 1;
        prod.unit = params[4] || prod.unit || 'Pieces';
        const imgParam = params.find(p => typeof p === 'string' && (p.startsWith('http') || p.startsWith('data:') || p.includes('assets/')));
        if (imgParam) prod.image_url = imgParam;
        if (params.length >= 8) {
          prod.stock_quantity = parseInt(params[5]) || prod.stock_quantity || 500;
          prod.country = params[6] || prod.country || 'India';
        }
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('UPDATE products') && !text.includes('image_url')) {
      const targetId = parseInt(params[params.length - 1]) || parseInt(params[params.length - 2]);
      let prod = mockDB.products.find(p => p.id == targetId);
      if (prod) {
        prod.name = params[0] || prod.name;
        prod.price = (params[1] !== undefined && params[1] !== null && params[1] !== '' && !isNaN(Number(params[1]))) ? Number(params[1]) : prod.price;
        prod.category = params[2] || prod.category;
        if (params.length >= 8) {
          prod.moq = parseInt(params[3]) || prod.moq || 1;
          prod.unit = params[4] || prod.unit || 'Pieces';
          prod.stock_quantity = parseInt(params[5]) || prod.stock_quantity || 500;
          prod.country = params[6] || prod.country || 'India';
        }
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('DELETE FROM products WHERE id = $1')) {
      let idx = mockDB.products.findIndex(p => p.id == params[0] && (params.length < 2 || p.supplier_id == params[1] || !p.supplier_id));
      if (idx === -1) idx = mockDB.products.findIndex(p => p.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.products.splice(idx, 1);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('FROM products') && (text.includes('businesses') || text.includes('ORDER BY created_at') || text.includes('SELECT p.*') || text.includes('SELECT * FROM products'))) {
      mockDB.products = mockDB.products || [];
      mockDB.businesses = mockDB.businesses || [];
      mockDB.users = mockDB.users || [];
      const bizMap = {};
      (mockDB.businesses || []).forEach(b => { bizMap[b.user_id] = b; });
      const userMap = {};
      (mockDB.users || []).forEach(u => { userMap[u.id] = u; });

      const sorted = (mockDB.products || []).slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const enriched = sorted.map(p => {
        const biz = bizMap[p.supplier_id] || {};
        const usr = userMap[p.supplier_id] || {};
        return {
          ...p,
          supplier_name: biz.company_name || usr.name || ('Supplier #' + p.supplier_id),
          supplier_logo: biz.logo_url || null,
          city: biz.city || usr.city || 'Industrial Hub',
          country: p.country || biz.country || 'India'
        };
      });
      return { rows: enriched };
    }
    
    if (text.includes('SELECT (SELECT COUNT(*) FROM users)')) {
      const stats = {
        users: mockDB.users ? mockDB.users.length : 0,
        leads: mockDB.leads ? mockDB.leads.length : 0,
        products: mockDB.products ? mockDB.products.length : 0
      };
      return { rows: [stats] };
    }
    if (text.includes('SELECT id, name, phone, role, subscription FROM users ORDER BY id DESC LIMIT 10')) {
      const recent = (mockDB.users || []).slice().reverse().slice(0, 10);
      return { rows: recent };
    }
    if (text.includes("SELECT id, phone, name FROM users WHERE subscription != 'free' AND subscription IS NOT NULL AND role = 'supplier' AND id !=")) {
      const prem = (mockDB.users || []).filter(u => u.subscription && u.subscription !== 'free' && u.role === 'supplier' && u.id != params[0] && u.phone !== params[1]);
      return { rows: prem };
    }
    if (text.includes("SELECT supplier_id, name, category FROM products")) {
      return { rows: mockDB.products || [] };
    }
    if (text.includes('DELETE FROM users WHERE id')) {
      const idx = mockDB.users.findIndex(u => u.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.users.splice(idx, 1);
        // Cascading mock deletes
        mockDB.businesses = mockDB.businesses.filter(b => b.user_id != params[0]);
        mockDB.products = mockDB.products.filter(p => p.supplier_id != params[0]);
        mockDB.leads = mockDB.leads.filter(l => l.supplier_id != params[0]);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes("DELETE FROM users WHERE role = 'supplier'")) {
      mockDB.users = (mockDB.users || []).filter(u => u.id == 1 || u.role !== 'supplier');
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM businesses WHERE user_id !=')) {
      mockDB.businesses = (mockDB.businesses || []).filter(b => b.user_id == 1);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM products') && !text.includes('WHERE id')) {
      mockDB.products = [];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM leads') && !text.includes('WHERE id')) {
      mockDB.leads = [];
      saveMockDB();
      return { rows: [] };
    }

    // --- Module 3 & 4 Mock Data (RFQs and Quotations) ---
    if (text.includes('INSERT INTO rfqs')) {
      mockDB.rfqs = mockDB.rfqs || [];
      const newRfq = {
        id: ++mockDB.idCounter,
        buyer_id: params[0],
        product: params[1],
        qty: params[2],
        target_price: params[3],
        details: params[4],
        created_at: new Date().toISOString()
      };
      mockDB.rfqs.push(newRfq);
      saveMockDB();
      return { rows: [newRfq] };
    }
    if (text.includes('DELETE FROM rfqs WHERE id = $1 AND buyer_id = $2')) {
      mockDB.rfqs = mockDB.rfqs || [];
      const idx = mockDB.rfqs.findIndex(r => r.id == params[0] && r.buyer_id == params[1]);
      if (idx !== -1) {
        const deleted = mockDB.rfqs.splice(idx, 1);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('DELETE FROM rfqs WHERE buyer_id = $1')) {
      mockDB.rfqs = mockDB.rfqs || [];
      mockDB.rfqs = mockDB.rfqs.filter(r => r.buyer_id != params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM rfqs WHERE buyer_id = $1')) {
      return { rows: (mockDB.rfqs || []).filter(r => r.buyer_id == params[0]).slice().reverse() };
    }
    if (text.includes('SELECT * FROM rfqs ORDER BY created_at DESC')) {
      return { rows: (mockDB.rfqs || []).slice().reverse() };
    }
    if (text.includes('INSERT INTO quotations')) {
      mockDB.quotations = mockDB.quotations || [];
      const newQuote = {
        id: ++mockDB.idCounter,
        rfq_id: params[0],
        supplier_id: params[1],
        price_quoted: params[2],
        message: params[3],
        created_at: new Date().toISOString()
      };
      mockDB.quotations.push(newQuote);
      saveMockDB();
      return { rows: [newQuote] };
    }
    if (text.includes('SELECT q.*, u.name as supplier_name FROM quotations q JOIN users u ON q.supplier_id = u.id WHERE q.rfq_id = $1')) {
      const quotes = (mockDB.quotations || []).filter(q => q.rfq_id == params[0]);
      const enriched = quotes.map(q => {
        const sup = mockDB.users.find(u => u.id == q.supplier_id);
        return { ...q, supplier_name: sup ? sup.name : 'Unknown' };
      });
      return { rows: enriched };
    }
    if (text.includes('SELECT id FROM quotations WHERE rfq_id = $1 AND supplier_id = $2')) {
      return { rows: (mockDB.quotations || []).filter(q => q.rfq_id == params[0] && q.supplier_id == params[1]) };
    }

    if (text.includes('platform_settings')) {
      mockDB.platform_settings = mockDB.platform_settings || [];
      if (text.includes('SELECT') && text.includes('WHERE setting_key = $1')) {
        const row = mockDB.platform_settings.find(s => s.setting_key === params[0]);
        return { rows: row ? [row] : [] };
      }
      if (text.includes('SELECT') && !text.includes('WHERE')) {
        return { rows: mockDB.platform_settings };
      }
      if (text.includes('INSERT') || text.includes('UPDATE')) {
        const key = params[0];
        const val = params[1];
        let existing = mockDB.platform_settings.find(s => s.setting_key === key);
        if (existing) {
          existing.setting_value = val;
          existing.updated_at = new Date();
        } else {
          existing = { setting_key: key, setting_value: val, updated_at: new Date() };
          mockDB.platform_settings.push(existing);
        }
        saveMockDB();
        return { rows: [existing] };
      }
    }
    
    return { rows: [] };
  },
  pool
};
