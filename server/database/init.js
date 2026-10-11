const { pool } = require('./db');

const initSql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  city VARCHAR(100),
  role VARCHAR(20) DEFAULT 'buyer', -- 'buyer' or 'supplier'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(200) NOT NULL,
  gst_number VARCHAR(15),
  business_type VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  product_needed VARCHAR(255),
  buyer_phone VARCHAR(15),
  details TEXT,
  status VARCHAR(50) DEFAULT 'New',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  moq INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDB() {
  try {
    console.log('Initializing database schema...');
    await pool.query(initSql);
    console.log('Schema created successfully!');
  } catch (err) {
    console.error('Error creating schema:', err);
  } finally {
    pool.end();
  }
}

initDB();
