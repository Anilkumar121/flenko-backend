const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const db = require('./server/database/db');
const seoService = require('./server/services/seoService');
const { FLENKO_CATEGORIES } = require('./js/categories-data');

const BASE_URL = (process.env.SITE_URL || 'https://flenko.com').replace(/\/+$/, '');
const TODAY = new Date().toISOString().split('T')[0];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeXml(unsafe = '') {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isServiceProduct(p) {
  if (!p) return false;
  if (p.is_service === true || p.is_service === 'true' || p.is_service === 1 || p.is_service === '1') return true;
  const text = [p.name, p.category, p.seo_tags, p.description, p.unit].filter(Boolean).join(' ').toLowerCase();
  const serviceWords = [
    'service', 'services', 'contractor', 'contractors', 'fabrication', 'installation',
    'drilling', 'anchoring', 'demolition', 'design', 'development', 'maintenance',
    'repair', 'consulting', 'consultancy', 'package', 'work', 'advocate', 'lawyer',
    'legal', 'attorney', 'court', 'rera', 'advisory', 'audit', 'tax filing', 'ca audit'
  ];
  return serviceWords.some(w => text.includes(w));
}

async function generateAllSeoPagesAndSitemaps() {
  console.log('=========================================================================');
  console.log('🚀 FLENKO AUTOMATIC MARKETPLACE SEO ENGINE: PRE-RENDERING PAGES & SITEMAPS');
  console.log('=========================================================================');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📅 Date: ${TODAY}`);

  try {
    // 1. Fetch live products from database
    const prodRes = await db.query('SELECT * FROM products WHERE is_indexed IS NOT FALSE ORDER BY id DESC');
    const products = prodRes.rows || [];
    console.log(`📦 Loaded ${products.length} live products from database.`);

    // 2. Fetch live businesses / suppliers from database
    const suppRes = await db.query(`
      SELECT b.*, 
             COALESCE(b.phone, u.phone) AS phone, 
             COALESCE(b.whatsapp, b.phone, u.phone) AS whatsapp,
             u.email AS user_email
      FROM businesses b 
      LEFT JOIN users u ON b.user_id = u.id 
      ORDER BY b.id ASC
    `);
    const suppliers = suppRes.rows || [];
    console.log(`🏢 Loaded ${suppliers.length} suppliers from database.`);

    // Create lookup maps for suppliers (by user_id and by business id)
    const supplierByUser = new Map();
    const supplierById = new Map();
    for (const s of suppliers) {
      if (s.user_id) supplierByUser.set(Number(s.user_id), s);
      supplierById.set(Number(s.id), s);
    }

    const getSupplierForProduct = (p) => {
      if (p.supplier_id && supplierByUser.has(Number(p.supplier_id))) {
        return supplierByUser.get(Number(p.supplier_id));
      }
      if (p.supplier_id && supplierById.has(Number(p.supplier_id))) {
        return supplierById.get(Number(p.supplier_id));
      }
      return null;
    };

    // Prepare directories
    const productsDir = path.join(__dirname, 'products');
    const servicesDir = path.join(__dirname, 'services');
    const suppliersDir = path.join(__dirname, 'suppliers');
    const wholesaleDir = path.join(__dirname, 'wholesale');

    ensureDir(productsDir);
    ensureDir(servicesDir);
    ensureDir(suppliersDir);
    ensureDir(wholesaleDir);

    // 3. Pre-render Product & Service Pages
    console.log('\n📄 Generating Product & Service Crawlable HTML Landing Pages...');
    let productCount = 0;
    let serviceCount = 0;
    const sitemapProductEntries = [];
    const sitemapServiceEntries = [];

    for (const p of products) {
      let slug = p.slug;
      if (!slug || slug.trim() === '') {
        slug = seoService.slugify(p.name);
      }
      if (!slug) continue;

      const supp = getSupplierForProduct(p);
      const isService = isServiceProduct(p);

      // Related products in same category
      const related = products.filter(rp => rp.category === p.category && rp.id !== p.id).slice(0, 4);

      const html = seoService.renderProductPageHtml({
        product: { ...p, slug },
        supplier: supp,
        relatedProducts: related,
        isService
      });

      // Write to products/<slug>/index.html
      const pFolder = path.join(productsDir, slug);
      ensureDir(pFolder);
      fs.writeFileSync(path.join(pFolder, 'index.html'), html, 'utf8');
      productCount++;

      const pLastmod = p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : TODAY;
      const prodUrl = `${BASE_URL}/products/${encodeURIComponent(slug)}`;

      let imgXml = '';
      if (p.image_url && p.image_url.startsWith('http')) {
        imgXml = `    <image:image>\n      <image:loc>${escapeXml(p.image_url)}</image:loc>\n      <image:title>${escapeXml(p.name || '')}</image:title>\n    </image:image>\n`;
      }

      sitemapProductEntries.push(`  <url>\n    <loc>${prodUrl}</loc>\n    <lastmod>${pLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.90</priority>\n${imgXml}  </url>`);

      // If it is a service, also write to services/<slug>/index.html and add to sitemap-services.xml
      if (isService) {
        const sFolder = path.join(servicesDir, slug);
        ensureDir(sFolder);
        fs.writeFileSync(path.join(sFolder, 'index.html'), html, 'utf8');
        serviceCount++;

        const servUrl = `${BASE_URL}/services/${encodeURIComponent(slug)}`;
        sitemapServiceEntries.push(`  <url>\n    <loc>${servUrl}</loc>\n    <lastmod>${pLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.90</priority>\n${imgXml}  </url>`);
      }
    }
    console.log(`✓ Rendered ${productCount} Product Pages into '/products/<slug>/index.html'`);
    console.log(`✓ Rendered ${serviceCount} Service Pages into '/services/<slug>/index.html'`);

    // 4. Pre-render Supplier Storefronts
    console.log('\n🏢 Generating Supplier Crawlable HTML Storefronts...');
    let supplierCount = 0;
    const sitemapSupplierEntries = [];

    for (const s of suppliers) {
      let slug = s.slug;
      if (!slug || slug.trim() === '') {
        slug = seoService.slugify(s.company_name);
      }
      if (!slug) continue;

      const suppProducts = products.filter(p => p.supplier_id === s.user_id || p.supplier_id === s.id);

      const html = seoService.renderSupplierPageHtml({
        supplier: { ...s, slug },
        products: suppProducts
      });

      const sFolder = path.join(suppliersDir, slug);
      ensureDir(sFolder);
      fs.writeFileSync(path.join(sFolder, 'index.html'), html, 'utf8');
      supplierCount++;

      const suppUrl = `${BASE_URL}/suppliers/${encodeURIComponent(slug)}`;
      const suppLastmod = s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : TODAY;
      sitemapSupplierEntries.push(`  <url>\n    <loc>${suppUrl}</loc>\n    <lastmod>${suppLastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.85</priority>\n  </url>`);
    }
    console.log(`✓ Rendered ${supplierCount} Supplier Storefronts into '/suppliers/<slug>/index.html'`);

    // 5. Pre-render Category Pages
    console.log('\n🗂️ Generating Category Crawlable HTML Landing Pages...');
    let categoryCount = 0;
    const sitemapCategoryEntries = [];

    // Combine taxonomy categories and any categories from products
    const categoryNamesSet = new Set();
    (FLENKO_CATEGORIES || []).forEach(c => categoryNamesSet.add(c.name));
    products.forEach(p => { if (p.category) categoryNamesSet.add(p.category); });

    for (const catName of categoryNamesSet) {
      const slug = seoService.slugify(catName);
      if (!slug) continue;

      const catProducts = products.filter(p => (p.category || '').toLowerCase() === catName.toLowerCase());
      const catSuppliers = suppliers.filter(s => (s.category || '').toLowerCase().includes(catName.toLowerCase()));

      const html = seoService.renderCategoryPageHtml({
        categoryName: catName,
        products: catProducts,
        suppliers: catSuppliers
      });

      const cFolder = path.join(wholesaleDir, slug);
      ensureDir(cFolder);
      fs.writeFileSync(path.join(cFolder, 'index.html'), html, 'utf8');
      categoryCount++;

      const catUrl = `${BASE_URL}/wholesale/${encodeURIComponent(slug)}`;
      sitemapCategoryEntries.push(`  <url>\n    <loc>${catUrl}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.80</priority>\n  </url>`);
    }
    console.log(`✓ Rendered ${categoryCount} Category Landing Pages into '/wholesale/<slug>/index.html'`);

    // 6. Generate Core Platform Pages Sitemap
    const corePages = [
      { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${BASE_URL}/products.html`, priority: '0.95', changefreq: 'hourly' },
      { loc: `${BASE_URL}/categories.html`, priority: '0.90', changefreq: 'daily' },
      { loc: `${BASE_URL}/business-directory.html`, priority: '0.90', changefreq: 'daily' },
      { loc: `${BASE_URL}/rfq.html`, priority: '0.85', changefreq: 'daily' },
      { loc: `${BASE_URL}/sell.html`, priority: '0.85', changefreq: 'weekly' },
      { loc: `${BASE_URL}/pricing.html`, priority: '0.80', changefreq: 'monthly' }
    ];

    const sitemapPageEntries = corePages.map(p => 
      `  <url>\n    <loc>${p.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    );

    // 7. Write XML Sitemaps
    console.log('\n🗺️ Writing Search-Engine XML Sitemaps...');

    // A. sitemap-products.xml
    const productsSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapProductEntries.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(__dirname, 'sitemap-products.xml'), productsSitemapXml, 'utf8');
    console.log(`✓ Wrote 'sitemap-products.xml' (${sitemapProductEntries.length} URLs)`);

    // B. sitemap-services.xml
    const servicesSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapServiceEntries.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(__dirname, 'sitemap-services.xml'), servicesSitemapXml, 'utf8');
    console.log(`✓ Wrote 'sitemap-services.xml' (${sitemapServiceEntries.length} URLs)`);

    // C. sitemap-suppliers.xml
    const suppliersSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapSupplierEntries.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(__dirname, 'sitemap-suppliers.xml'), suppliersSitemapXml, 'utf8');
    console.log(`✓ Wrote 'sitemap-suppliers.xml' (${sitemapSupplierEntries.length} URLs)`);

    // D. sitemap-categories.xml
    const categoriesSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapCategoryEntries.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(__dirname, 'sitemap-categories.xml'), categoriesSitemapXml, 'utf8');
    console.log(`✓ Wrote 'sitemap-categories.xml' (${sitemapCategoryEntries.length} URLs)`);

    // E. sitemap-pages.xml
    const pagesSitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPageEntries.join('\n')}\n</urlset>`;
    fs.writeFileSync(path.join(__dirname, 'sitemap-pages.xml'), pagesSitemapXml, 'utf8');
    console.log(`✓ Wrote 'sitemap-pages.xml' (${sitemapPageEntries.length} URLs)`);

    // F. sitemap.xml (Root Sitemap Index)
    const rootSitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-products.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-services.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-suppliers.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-categories.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-pages.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>
`;
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), rootSitemapIndexXml, 'utf8');
    console.log(`✓ Wrote Root 'sitemap.xml' (Sitemap Index with all 5 sub-sitemaps)`);

    console.log('\n=========================================================================');
    console.log('✅ ALL SEO LANDING PAGES AND SITEMAPS SUCCESSFULLY GENERATED!');
    console.log(`Total URLs Ready for Google Crawling: ${sitemapProductEntries.length + sitemapServiceEntries.length + sitemapSupplierEntries.length + sitemapCategoryEntries.length + sitemapPageEntries.length}`);
    console.log('=========================================================================\n');
  } catch (err) {
    console.error('❌ Error during SEO page & sitemap generation:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  generateAllSeoPagesAndSitemaps();
}

module.exports = { generateAllSeoPagesAndSitemaps };
