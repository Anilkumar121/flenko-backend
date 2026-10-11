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
  idCounter: 2
};

// Load existing data from file if available
if (fs.existsSync(mockDbPath)) {
  try {
    const data = fs.readFileSync(mockDbPath, 'utf8');
    mockDB = JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
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
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255),
      name VARCHAR(100),
      email VARCHAR(100),
      city VARCHAR(100),
      role VARCHAR(20) DEFAULT 'buyer',
      subscription VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    CREATE TABLE IF NOT EXISTS otp_requests (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      gst_number VARCHAR(20),
      business_type VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      price DECIMAL(12, 2),
      category VARCHAR(100),
      moq INTEGER DEFAULT 1,
      unit VARCHAR(50) DEFAULT 'pieces',
      image_url TEXT,
      seo_tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      product_needed VARCHAR(255),
      buyer_phone VARCHAR(20),
      details TEXT,
      status VARCHAR(50) DEFAULT 'New',
      is_direct BOOLEAN DEFAULT FALSE,
      is_paid BOOLEAN DEFAULT FALSE,
      replies JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rfqs (
      id SERIAL PRIMARY KEY,
      buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product VARCHAR(255) NOT NULL,
      qty VARCHAR(50),
      target_price VARCHAR(50),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      rfq_id INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
      supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      price_quoted VARCHAR(50),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(schema);
    console.log('✅ PostgreSQL schema verified and synchronized successfully.');
  } catch (err) {
    console.warn('⚠️ Could not auto-sync PG schema:', err.message);
  }
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
        console.warn('Postgres query failed, switching to mock:', err.message);
        useMock = true;
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
    if (text.includes('SELECT * FROM users WHERE phone = $1')) {
      const targetPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      mockDB.users = mockDB.users || [];
      const row = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('SELECT id, phone, name FROM users WHERE subscription')) {
      const rows = mockDB.users.filter(u => u.subscription && u.subscription !== 'free' && u.role === 'supplier' && u.id !== params[0]).slice(0, 5);
      return { rows };
    }
    if (text.includes('INSERT INTO users')) {
      const cleanPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      let newUser;
      if (params.length >= 6) {
        // (phone, password, name, email, city, role)
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
        // (phone, name, email, city, role)
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
    if (text.includes('UPDATE users SET password = $1 WHERE phone = $2')) {
      const targetPhone = (params[1] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const user = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      if (user) { user.password = params[0]; }
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
    if (text.includes('SELECT id, name, phone, email, city, role FROM users WHERE id')) {
      const row = mockDB.users.find(u => u.id === params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('SELECT * FROM businesses WHERE user_id')) {
      const row = mockDB.businesses.find(b => b.user_id === params[0]);
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
      mockDB.businesses.push({ id: mockDB.idCounter++, user_id: params[0], company_name: params[1], gst_number: params[2], business_type: params[3], address: params[4], city: params[5], category: params[6] });
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE businesses SET')) {
      const biz = mockDB.businesses.find(b => b.user_id === params[6]);
      if (biz) { biz.company_name = params[0]; biz.gst_number = params[1]; biz.business_type = params[2]; biz.address = params[3]; biz.city = params[4]; biz.category = params[5]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM leads WHERE supplier_id')) {
      const rows = mockDB.leads.filter(l => l.supplier_id === params[0]).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
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
        status: 'New', 
        created_at: new Date() 
      };
      mockDB.leads.push(newLead);
      saveMockDB();
      return { rows: [newLead] };
    }
    if (text.includes('UPDATE leads SET is_paid')) {
      const lead = mockDB.leads.find(l => l.id === params[0]);
      if (lead) lead.is_paid = true;
      saveMockDB();
      return { rows: [] };
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
      const row = mockDB.products.find(p => p.id === parseInt(params[0]));
      return { rows: row ? [row] : [] };
    }
    if (text.includes('INSERT INTO products')) {
      const newProd = { 
        id: mockDB.idCounter++, 
        supplier_id: params[0], 
        name: params[1], 
        price: params[2], 
        category: params[3], 
        moq: params[4], 
        unit: params[5],
        image_url: params[6], 
        seo_tags: params[7],
        created_at: new Date() 
      };
      mockDB.products = mockDB.products || [];
      mockDB.products.push(newProd);
      saveMockDB();
      return { rows: [newProd] };
    }
    if (text.includes('SELECT * FROM products WHERE supplier_id')) {
      mockDB.products = mockDB.products || [];
      const rows = mockDB.products.filter(p => p.supplier_id === params[0]);
      return { rows };
    }
    if (text.includes('UPDATE products SET name = $1, price = $2, category = $3, moq = $4, unit = $5, image_url = $6')) {
      const prod = mockDB.products.find(p => p.id == params[6] && p.supplier_id == params[7]);
      if (prod) {
        prod.name = params[0];
        prod.price = params[1];
        prod.category = params[2];
        prod.moq = params[3];
        prod.unit = params[4];
        prod.image_url = params[5];
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('UPDATE products SET name = $1, price = $2, category = $3, moq = $4, unit = $5 WHERE id')) {
      const prod = mockDB.products.find(p => p.id == params[5] && p.supplier_id == params[6]);
      if (prod) {
        prod.name = params[0];
        prod.price = params[1];
        prod.category = params[2];
        prod.moq = params[3];
        prod.unit = params[4];
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('DELETE FROM products WHERE id = $1 AND supplier_id = $2')) {
      const idx = mockDB.products.findIndex(p => p.id == params[0] && p.supplier_id == params[1]);
      if (idx !== -1) {
        const deleted = mockDB.products.splice(idx, 1);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.trim() === 'SELECT * FROM products ORDER BY created_at DESC') {
      mockDB.products = mockDB.products || [];
      return { rows: mockDB.products };
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
    if (text.includes('SELECT * FROM rfqs WHERE buyer_id = $1')) {
      return { rows: (mockDB.rfqs || []).filter(r => r.buyer_id == params[0]).reverse() };
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
    
    return { rows: [] };
  },
  pool
};
