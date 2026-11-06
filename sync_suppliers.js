const path = require('path');
const fs = require('fs');
const dotenv = require('./node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const { Pool } = require('./node_modules/pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(
      "SELECT b.*, " +
      "COALESCE(b.company_name, u.name, 'Verified Supplier') AS company_name, " +
      "COALESCE(b.city, u.city, 'Industrial Hub') AS city, " +
      "COALESCE(b.country, 'India') AS country, " +
      "COALESCE(b.phone, u.phone, '') AS phone, " +
      "COALESCE(b.whatsapp, b.phone, u.phone, '') AS whatsapp, " +
      "u.name AS owner_name, " +
      "u.email AS owner_email, " +
      "u.subscription AS subscription, " +
      "COALESCE((SELECT COUNT(*) FROM products p WHERE p.supplier_id = b.user_id), 0) AS products_count " +
      "FROM businesses b " +
      "LEFT JOIN users u ON b.user_id = u.id " +
      "ORDER BY b.id ASC"
    );
    console.log('Total businesses in DB:', res.rows.length);
    res.rows.forEach(r => {
      console.log('ID:', r.id, 'user_id:', r.user_id, 'company:', r.company_name, 'phone:', r.phone, 'prods:', r.products_count, 'slug:', r.slug);
    });

    const sPath = path.join(__dirname, 'suppliers.json');
    fs.writeFileSync(sPath, JSON.stringify(res.rows, null, 2), 'utf8');
    try {
      fs.writeFileSync(path.join(__dirname, '..', 'suppliers.json'), JSON.stringify(res.rows, null, 2), 'utf8');
    } catch(e) {}
    console.log('Successfully wrote', res.rows.length, 'suppliers to', sPath);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
  }
}
run();
