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
    // 1. Fetch businesses
    const bRes = await pool.query(`
      SELECT b.*,
             COALESCE(b.company_name, u.name, 'Verified Supplier') AS company_name,
             COALESCE(b.city, u.city, 'Industrial Hub') AS city,
             COALESCE(b.country, 'India') AS country,
             COALESCE(b.phone, u.phone, '') AS phone,
             COALESCE(b.whatsapp, b.phone, u.phone, '') AS whatsapp,
             u.name AS owner_name,
             u.email AS owner_email,
             u.subscription AS subscription,
             COALESCE((SELECT COUNT(*) FROM products p WHERE p.supplier_id = b.user_id), 0) AS products_count
      FROM businesses b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.id ASC
    `);

    console.log('Total businesses in DB:', bRes.rows.length);
    bRes.rows.forEach(r => {
      console.log(`ID: ${r.id}, user_id: ${r.user_id}, name: "${r.company_name}", slug: "${r.slug}", prods: ${r.products_count}`);
    });

    const sPath = path.join(__dirname, 'suppliers.json');
    fs.writeFileSync(sPath, JSON.stringify(bRes.rows, null, 2), 'utf8');
    try {
      fs.writeFileSync(path.join(__dirname, '..', 'suppliers.json'), JSON.stringify(bRes.rows, null, 2), 'utf8');
    } catch(e) {}
    console.log('✓ Updated suppliers.json with', bRes.rows.length, 'suppliers.');

    // 2. Fetch products
    const pRes = await pool.query(`
      SELECT p.*,
             COALESCE(b.slug, '') AS supplier_slug,
             COALESCE(b.company_name, u.name, '') AS supplier_name,
             COALESCE(b.phone, u.phone, '') AS supplier_phone,
             COALESCE(b.whatsapp, b.phone, u.phone, '') AS supplier_whatsapp,
             COALESCE(b.city, u.city, 'India') AS city
      FROM products p
      LEFT JOIN users u ON p.supplier_id = u.id
      LEFT JOIN businesses b ON b.user_id = p.supplier_id
      ORDER BY p.id DESC
    `);

    console.log('Total products in DB:', pRes.rows.length);
    pRes.rows.forEach(r => {
      console.log(`Product ID: ${r.id}, name: "${r.name}", supplier_id: ${r.supplier_id}, slug: "${r.supplier_slug}", supp_name: "${r.supplier_name}"`);
    });

    const pPath = path.join(__dirname, 'products.json');
    fs.writeFileSync(pPath, JSON.stringify(pRes.rows, null, 2), 'utf8');
    try {
      fs.writeFileSync(path.join(__dirname, '..', 'products.json'), JSON.stringify(pRes.rows, null, 2), 'utf8');
    } catch(e) {}
    console.log('✓ Updated products.json with', pRes.rows.length, 'products.');

    // 3. Generate high-availability browser JS fallback bundle
    const jsPath = path.join(__dirname, 'js', 'products-data.js');
    const jsContent = `// Preloaded Authoritative Data for Instant Rendering (Offline / Cold-Start Safe)
window.FLENKO_STATIC_SUPPLIERS = ${JSON.stringify(bRes.rows)};
window.FLENKO_STATIC_PRODUCTS = ${JSON.stringify(pRes.rows)};
`;
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('✓ Updated js/products-data.js with preloaded suppliers and products.');

  } catch(e) {
    console.error('Error during sync:', e);
  } finally {
    await pool.end();
  }
}
run();
