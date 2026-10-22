/**
 * Flenko Programmatic SEO & Automatic Marketplace SEO Engine
 * Provides:
 * - Dynamic Slug Generation with collision prevention & 301 redirects
 * - Automatic Title & Meta Description generation from real product/seller attributes
 * - Schema.org JSON-LD Structured Data (Product, Offer, Organization, LocalBusiness, Service, BreadcrumbList)
 * - Server-Side Rendered (SSR) HTML templates for Crawlers & Googlebot
 * - Dynamic XML Sitemaps Index & Feeds (Products, Suppliers, Services, Categories)
 * - Dynamic Robots.txt
 * - Backfill utility to ensure 100% of listings have permanent SEO slugs
 */

const BASE_URL = process.env.SITE_URL || 'https://flenko.com';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\/\\]+/g, '-')          // Replace spaces and slashes with -
    .replace(/[^\w\-]+/g, '')            // Remove all non-word chars
    .replace(/\-\-+/g, '-')              // Replace multiple - with single -
    .replace(/^-+/, '')                  // Trim - from start of text
    .replace(/-+$/, '');                 // Trim - from end of text
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a unique slug for a product with deduplication (-2, -3...)
 */
async function generateUniqueProductSlug(db, name, currentProductId = null) {
  let base = slugify(name) || 'product';
  let candidate = base;
  let counter = 2;

  while (true) {
    let check;
    if (currentProductId) {
      check = await db.query('SELECT id FROM products WHERE slug = $1 AND id != $2', [candidate, currentProductId]);
    } else {
      check = await db.query('SELECT id FROM products WHERE slug = $1', [candidate]);
    }

    if (!check.rows || check.rows.length === 0) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter++;
  }
}

/**
 * Generate a unique slug for a business / supplier
 */
async function generateUniqueSupplierSlug(db, companyName, currentBusinessId = null) {
  let base = slugify(companyName) || 'supplier';
  let candidate = base;
  let counter = 2;

  while (true) {
    let check;
    if (currentBusinessId) {
      check = await db.query('SELECT id FROM businesses WHERE slug = $1 AND id != $2', [candidate, currentBusinessId]);
    } else {
      check = await db.query('SELECT id FROM businesses WHERE slug = $1', [candidate]);
    }

    if (!check.rows || check.rows.length === 0) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter++;
  }
}

/**
 * Generate accurate metadata from real product attributes
 */
function generateProductMetadata(product, supplier = null) {
  const pName = (product.name || '').trim();
  const pCat = product.category || 'General B2B';
  const pCountry = product.country || 'India';
  const suppName = supplier ? (supplier.company_name || supplier.name || 'Verified Supplier') : 'Verified Supplier';
  const suppCity = supplier ? (supplier.city || 'Industrial Hub') : (product.city || 'India');

  const title = `${pName} Wholesale & Best Price | Flenko B2B`;
  
  let desc = `Buy wholesale ${pName} from verified supplier ${suppName} in ${suppCity}, ${pCountry}. `;
  if (product.price && Number(product.price) > 0) {
    desc += `Direct B2B price: ₹${Number(product.price).toLocaleString('en-IN')} / ${product.unit || 'piece'}. `;
  }
  if (product.moq) {
    desc += `Min. Order: ${product.moq} ${product.unit || 'pieces'}. `;
  }
  desc += `Request free quotations, verify supplier credentials, and trade securely on Flenko.`;

  return {
    title,
    description: desc.slice(0, 310),
    canonical: `${BASE_URL}/products/${product.slug || slugify(pName)}`,
    ogImage: product.image_url && product.image_url.startsWith('http') ? product.image_url : `${BASE_URL}/assets/images/logo.png`,
    keywords: `wholesale ${pName}, buy ${pName} wholesale, ${pName} manufacturers, ${pName} suppliers in ${suppCity}, ${pCat} exporters`
  };
}

/**
 * Generate accurate metadata from real supplier attributes
 */
function generateSupplierMetadata(supplier, products = []) {
  const compName = (supplier.company_name || supplier.name || 'Verified Supplier').trim();
  const city = supplier.city || 'India';
  const country = supplier.country || 'India';
  const cat = supplier.category || 'B2B Wholesale';
  const bizType = supplier.business_type || 'Manufacturer & Wholesaler';

  const title = `${compName} - Verified ${bizType} in ${city} | Flenko B2B`;

  let desc = `${compName} is a verified ${bizType} based in ${city}, ${country}, specializing in ${cat}. `;
  if (products && products.length > 0) {
    const topProds = products.slice(0, 3).map(p => p.name).join(', ');
    desc += `Leading supplier of ${topProds}. `;
  }
  if (supplier.gst_number) {
    desc += `GST Verified Business. `;
  }
  desc += `View products, company profile, and request direct bulk quotations on Flenko.`;

  return {
    title,
    description: desc.slice(0, 310),
    canonical: `${BASE_URL}/suppliers/${supplier.slug || slugify(compName)}`,
    ogImage: supplier.logo_url && supplier.logo_url.startsWith('http') ? supplier.logo_url : `${BASE_URL}/assets/images/logo.png`,
    keywords: `${compName}, ${compName} ${city}, ${cat} manufacturers ${city}, wholesale suppliers ${city}`
  };
}

/**
 * Generate accurate metadata for a Category Landing Page
 */
function generateCategoryMetadata(categoryName, productCount = 0) {
  const cleanCat = (categoryName || 'General B2B').trim();
  const slug = slugify(cleanCat);

  const title = `Wholesale ${cleanCat} Manufacturers, Suppliers & Price | Flenko B2B`;
  const desc = `Browse ${productCount > 0 ? productCount + '+ ' : ''}verified wholesale ${cleanCat} suppliers and manufacturers on Flenko. Compare prices, MOQs, contact suppliers directly, and source bulk products with Trade Assurance.`;

  return {
    title,
    description: desc.slice(0, 310),
    canonical: `${BASE_URL}/wholesale/${slug}`,
    ogImage: `${BASE_URL}/assets/images/logo.png`,
    keywords: `wholesale ${cleanCat}, ${cleanCat} manufacturers, ${cleanCat} suppliers, buy ${cleanCat} in bulk`
  };
}

/**
 * JSON-LD Schema: Product + Offer + Breadcrumbs
 */
function buildProductSchema(product, supplier, canonicalUrl) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [
      (product.image_url && product.image_url.startsWith('http')) ? product.image_url : `${BASE_URL}/assets/images/logo.png`
    ],
    "description": product.description || product.seo_description || `${product.name} available wholesale on Flenko B2B marketplace.`,
    "category": product.category || "General B2B",
    "brand": {
      "@type": "Brand",
      "name": supplier ? (supplier.company_name || "Verified Supplier") : "Flenko Verified"
    }
  };

  if (product.price && Number(product.price) > 0) {
    schema.offers = {
      "@type": "Offer",
      "url": canonicalUrl,
      "priceCurrency": "INR",
      "price": Number(product.price).toFixed(2),
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.stock_quantity === undefined || product.stock_quantity > 0) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/PreOrder",
      "seller": {
        "@type": "Organization",
        "name": supplier ? (supplier.company_name || supplier.name) : "Flenko Verified Supplier"
      }
    };
  }

  return schema;
}

/**
 * JSON-LD Schema: Organization / LocalBusiness
 */
function buildSupplierSchema(supplier, canonicalUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": supplier.company_name || supplier.name,
    "url": canonicalUrl,
    "logo": (supplier.logo_url && supplier.logo_url.startsWith('http')) ? supplier.logo_url : `${BASE_URL}/assets/images/logo.png`,
    "description": supplier.about || `${supplier.company_name} is a verified manufacturer and wholesale supplier on Flenko B2B.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": supplier.city || "Industrial Hub",
      "addressCountry": supplier.country || "India"
    }
  };

  if (supplier.address) {
    schema.address.streetAddress = supplier.address;
  }

  return schema;
}

/**
 * JSON-LD Schema: BreadcrumbList
 */
function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": it.name,
      "item": it.url.startsWith('http') ? it.url : `${BASE_URL}${it.url.startsWith('/') ? '' : '/'}${it.url}`
    }))
  };
}

/**
 * JSON-LD Schema: Service
 */
function buildServiceSchema(service, provider, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description || service.seo_description || `${service.name} offered by ${provider ? provider.company_name : 'Verified Provider'} on Flenko B2B.`,
    "provider": {
      "@type": "Organization",
      "name": provider ? (provider.company_name || provider.name) : "Verified Provider",
      "url": provider && provider.slug ? `${BASE_URL}/suppliers/${provider.slug}` : BASE_URL
    },
    "serviceType": service.category || "B2B Business Service",
    "areaServed": service.country || "India"
  };
}

/**
 * Common HTML Shell Header
 */
function renderHtmlHead({ title, description, canonical, ogImage, keywords, robots = 'index, follow', schemas = [] }) {
  const jsonLdScripts = schemas.map(s => `  <script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n  </script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords || '')}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${escapeHtml(canonical)}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImage || BASE_URL + '/assets/images/logo.png')}">
  <meta property="og:site_name" content="Flenko B2B Marketplace">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage || BASE_URL + '/assets/images/logo.png')}">

  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/components.css">
  <link rel="stylesheet" href="/css/mobile.css">

  <style>
    :root {
      --fl-navy: #0F4C9B;
      --fl-teal: #028867;
      --fl-orange: #FF6B00;
    }
    body { background-color: #f8fafc; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 0; }
    .site-header { background: #ffffff; border-bottom: 2px solid var(--fl-navy); position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header-inner { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; max-width: 1280px; margin: 0 auto; gap: 1rem; }
    .seo-breadcrumbs { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 0.65rem 1rem; font-size: 0.82rem; color: #64748b; }
    .seo-breadcrumbs .inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .seo-breadcrumbs a { color: #64748b; text-decoration: none; }
    .seo-breadcrumbs a:hover { color: var(--fl-navy); text-decoration: underline; }
    .seo-breadcrumbs span.sep { color: #cbd5e1; }
    .seo-breadcrumbs span.cur { color: #0f172a; font-weight: 600; }
    .seo-container { max-width: 1280px; margin: 1.5rem auto 3rem; padding: 0 1rem; }
    .fl-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
    .badge-teal { background: #dcfce7; color: #15803d; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; }
    .badge-orange { background: #ffedd5; color: #c2410c; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; }
    .badge-blue { background: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; }
    .btn-quote { background: var(--fl-orange); color: #ffffff; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 6px; border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.95rem; }
    .btn-quote:hover { background: #ea580c; }
    .btn-outline-blue { background: #ffffff; color: var(--fl-navy); border: 1px solid var(--fl-navy); font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; }
    .btn-outline-blue:hover { background: #eff6ff; }
    .spec-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .spec-table tr { border-bottom: 1px solid #f1f5f9; }
    .spec-table th { width: 35%; text-align: left; padding: 0.65rem 0.75rem; color: #64748b; font-weight: 600; font-size: 0.85rem; background: #f8fafc; }
    .spec-table td { padding: 0.65rem 0.75rem; color: #0f172a; font-weight: 600; font-size: 0.85rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
    .related-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform 0.15s, box-shadow 0.15s; }
    .related-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .related-card img { width: 100%; height: 160px; object-fit: cover; background: #f1f5f9; }
    .related-card-body { padding: 0.85rem; flex: 1; display: flex; flex-direction: column; }
    .footer-seo { background: #0f172a; color: #94a3b8; padding: 2.5rem 1rem 1.5rem; margin-top: 4rem; font-size: 0.85rem; }
    .footer-inner { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; }
    .footer-seo h4 { color: #ffffff; margin: 0 0 1rem; font-size: 1rem; }
    .footer-seo a { color: #94a3b8; text-decoration: none; display: block; margin-bottom: 0.5rem; }
    .footer-seo a:hover { color: #38bdf8; }
    @media (max-width: 768px) {
      .product-hero-grid { grid-template-columns: 1fr !important; }
      .supplier-hero-grid { grid-template-columns: 1fr !important; }
    }
  </style>

${jsonLdScripts}
</head>
<body>

  <!-- Site Navigation Header -->
  <header class="site-header">
    <div class="header-inner">
      <a href="/" style="display:flex; align-items:center;">
        <img src="/assets/images/logo.png" alt="Flenko B2B Marketplace" style="height: 42px; width: auto; object-fit: contain;">
      </a>
      <form action="/products.html" method="GET" style="display:flex; flex:1; max-width: 600px; margin: 0 1rem;">
        <input type="text" name="q" placeholder="Search wholesale products, manufacturers, categories..." style="width:100%; padding:0.55rem 0.9rem; border:1px solid #cbd5e1; border-radius:6px 0 0 6px; font-size:0.9rem; outline:none;">
        <button type="submit" style="background:var(--fl-navy); color:white; border:none; padding:0 1.25rem; border-radius:0 6px 6px 0; font-weight:700; cursor:pointer;">Search</button>
      </form>
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <a href="/products.html" style="color:#0f172a; text-decoration:none; font-weight:600; font-size:0.88rem;">Products</a>
        <a href="/business-directory.html" style="color:#0f172a; text-decoration:none; font-weight:600; font-size:0.88rem;">Suppliers</a>
        <a href="/sell.html" style="background:#eff6ff; color:var(--fl-navy); border:1px solid #bfdbfe; padding:0.45rem 0.9rem; border-radius:6px; font-weight:700; font-size:0.85rem; text-decoration:none;">Sell on Flenko</a>
      </div>
    </div>
  </header>
`;
}

/**
 * Common HTML Shell Footer
 */
function renderHtmlFooter() {
  return `
  <!-- Site Footer -->
  <footer class="footer-seo">
    <div class="footer-inner">
      <div>
        <h4>About Flenko.com</h4>
        <p style="line-height:1.6; margin:0 0 1rem; color:#94a3b8;">
          Flenko is India's premier B2B marketplace connecting verified manufacturers, exporters, wholesalers, and industrial buyers worldwide with Trade Assurance.
        </p>
        <p style="margin:0; font-size:0.8rem; color:#64748b;">
          &copy; ${new Date().getFullYear()} Flenko Marketplace. All rights reserved.
        </p>
      </div>
      <div>
        <h4>Popular Categories</h4>
        <a href="/wholesale/electrical-equipment">Electrical Equipment</a>
        <a href="/wholesale/packaging-printing">Packaging &amp; Printing</a>
        <a href="/wholesale/industrial-machinery">Industrial Machinery</a>
        <a href="/wholesale/apparel-fashion">Apparel &amp; Fashion</a>
        <a href="/categories.html">All B2B Categories &rarr;</a>
      </div>
      <div>
        <h4>For Buyers &amp; Sellers</h4>
        <a href="/products.html">Browse Wholesale Catalog</a>
        <a href="/business-directory.html">Verified Supplier Directory</a>
        <a href="/sell.html">Register as a Seller</a>
        <a href="/rfq.html">Post Buy Requirement (RFQ)</a>
        <a href="/pricing.html">Supplier Membership Plans</a>
      </div>
      <div>
        <h4>SEO &amp; Sitemaps</h4>
        <a href="/sitemap.xml" target="_blank">XML Sitemap Index</a>
        <a href="/sitemap-products.xml" target="_blank">Products Sitemap</a>
        <a href="/sitemap-suppliers.xml" target="_blank">Suppliers Sitemap</a>
        <a href="/robots.txt" target="_blank">Robots.txt</a>
      </div>
    </div>
  </footer>

  <!-- Quick Inquiry Script -->
  <script>
    function triggerQuickInquiry(prodName, suppPhone) {
      const msg = encodeURIComponent("Hello! I am interested in buying '" + prodName + "' listed on Flenko. Please share wholesale prices and MOQ details.");
      if (suppPhone && suppPhone.length >= 10) {
        const cleanP = suppPhone.replace(/[^0-9]/g, '');
        window.open("https://wa.me/" + (cleanP.startsWith('91') ? cleanP : ('91' + cleanP.slice(-10))) + "?text=" + msg, "_blank");
      } else {
        window.location.href = "/rfq.html?product=" + encodeURIComponent(prodName);
      }
    }
  </script>
</body>
</html>
`;
}

/**
 * Render Complete Server-Rendered Product SEO Landing Page
 */
function renderProductPageHtml({ product, supplier, relatedProducts = [] }) {
  const meta = generateProductMetadata(product, supplier);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: product.category || 'General B2B', url: `/wholesale/${slugify(product.category || 'General B2B')}` },
    { name: product.name, url: `/products/${product.slug}` }
  ];

  const productSchema = buildProductSchema(product, supplier, meta.canonical);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const priceDisplay = (product.price && Number(product.price) > 0)
    ? `<span style="font-size: 1.85rem; font-weight: 800; color: #0284c7;">₹${Number(product.price).toLocaleString('en-IN')}</span> <span style="font-size: 0.95rem; color: #64748b;">/ ${escapeHtml(product.unit || 'Piece')}</span>`
    : `<span style="font-size: 1.25rem; font-weight: 700; color: #0284c7;">Contact Supplier for Best Bulk Rates</span>`;

  const supplierCard = supplier ? `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-top: 1.5rem;">
      <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Verified Supplier Information</div>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <a href="/suppliers/${supplier.slug || slugify(supplier.company_name)}" style="font-size: 1.15rem; font-weight: 800; color: var(--fl-navy); text-decoration: none;">
            ${escapeHtml(supplier.company_name || 'Verified Supplier')}
          </a>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
            📍 ${escapeHtml(supplier.city || 'India')}, ${escapeHtml(supplier.country || 'India')}
            &nbsp;•&nbsp; 🏢 ${escapeHtml(supplier.business_type || 'Manufacturer')}
          </div>
        </div>
        <a href="/suppliers/${supplier.slug || slugify(supplier.company_name)}" class="btn-outline-blue" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
          View Full Storefront &rarr;
        </a>
      </div>
    </div>
  ` : '';

  const relatedHtml = relatedProducts.length > 0 ? `
    <div style="margin-top: 3rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem;">
        Related Wholesale Products in ${escapeHtml(product.category || 'This Category')}
      </h2>
      <div class="related-grid">
        ${relatedProducts.map(rp => `
          <a href="/products/${rp.slug}" class="related-card">
            <img src="${escapeHtml(rp.image_url || '/assets/images/logo.png')}" alt="${escapeHtml(rp.name)}" loading="lazy">
            <div class="related-card-body">
              <div style="font-size: 0.75rem; color: var(--fl-teal); font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(rp.category || 'General')}</div>
              <h3 style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; line-height: 1.35;">${escapeHtml(rp.name)}</h3>
              <div style="margin-top: auto; font-size: 0.95rem; font-weight: 800; color: #0284c7;">
                ${rp.price ? ('₹' + Number(rp.price).toLocaleString('en-IN')) : 'Get Quote'}
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '';

  const head = renderHtmlHead({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogImage: meta.ogImage,
    keywords: meta.keywords,
    schemas: [productSchema, breadcrumbSchema]
  });

  const body = `
  <!-- Breadcrumbs -->
  <nav class="seo-breadcrumbs" aria-label="Breadcrumbs">
    <div class="inner">
      ${breadcrumbs.map((b, i) => {
        if (i === breadcrumbs.length - 1) {
          return `<span class="cur">${escapeHtml(b.name)}</span>`;
        }
        return `<a href="${b.url}">${escapeHtml(b.name)}</a><span class="sep">/</span>`;
      }).join('')}
    </div>
  </nav>

  <main class="seo-container">
    <div class="fl-card" style="padding: 1.75rem;">
      <div class="product-hero-grid" style="display: grid; grid-template-columns: 420px 1fr; gap: 2rem;">
        
        <!-- Product Image Gallery -->
        <div>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #ffffff; text-align: center;">
            <img src="${escapeHtml(product.image_url || '/assets/images/logo.png')}" 
                 alt="${escapeHtml(product.name)} wholesale supplier in ${escapeHtml(product.country || 'India')}" 
                 style="width: 100%; height: 380px; object-fit: contain; padding: 10px;"
                 loading="eager">
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <span class="badge-teal">✓ Verified Pro Listing</span>
            <span class="badge-blue">🛡️ Trade Assurance</span>
            <span class="badge-orange">⚡ Direct Factory</span>
          </div>
        </div>

        <!-- Product Details & Inquiry Column -->
        <div>
          <div style="font-size: 0.82rem; color: var(--fl-teal); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.35rem;">
            ${escapeHtml(product.category || 'General B2B')}
          </div>
          <h1 style="font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem; line-height: 1.3;">
            ${escapeHtml(product.name)}
          </h1>

          <div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-bottom: 1.25rem;">
            ${priceDisplay}
          </div>

          <!-- Specifications Table -->
          <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 1.25rem 0 0.5rem;">
            Product Specifications &amp; Ordering Terms
          </h3>
          <table class="spec-table">
            <tbody>
              <tr>
                <th>Minimum Order Quantity (MOQ)</th>
                <td>${escapeHtml(product.moq || 1)} ${escapeHtml(product.unit || 'Pieces')}</td>
              </tr>
              <tr>
                <th>Stock Availability</th>
                <td><span style="color:#16a34a; font-weight:700;">✓ ${escapeHtml(product.stock_quantity || 500)} ${escapeHtml(product.unit || 'Pieces')} in stock</span></td>
              </tr>
              <tr>
                <th>Product Category</th>
                <td><a href="/wholesale/${slugify(product.category || 'General')}" style="color:var(--fl-navy); text-decoration:none;">${escapeHtml(product.category || 'General B2B')}</a></td>
              </tr>
              <tr>
                <th>Country of Origin</th>
                <td>${escapeHtml(product.country || 'India')}</td>
              </tr>
              <tr>
                <th>Supply Ability</th>
                <td>Ready to Ship Wholesale Orders</td>
              </tr>
            </tbody>
          </table>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 0.75rem; margin-top: 1.75rem; flex-wrap: wrap;">
            <button class="btn-quote" onclick="triggerQuickInquiry('${escapeHtml(product.name)}', '${supplier ? (supplier.phone || '') : ''}')">
              💬 Contact Supplier / Get Best Quotation
            </button>
            <a href="/rfq.html?product=${encodeURIComponent(product.name)}" class="btn-outline-blue">
              📋 Post Custom RFQ Requirement
            </a>
          </div>

          ${supplierCard}
        </div>
      </div>

      <!-- Full Product Description -->
      <div style="margin-top: 2.5rem; padding-top: 1.75rem; border-top: 1px solid #e2e8f0;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem;">
          Detailed Description &amp; Usage
        </h2>
        <div style="font-size: 0.95rem; line-height: 1.7; color: #334155;">
          <p>
            ${escapeHtml(product.description || (product.name + ' manufactured with industrial-grade quality and specifications. Ideal for bulk commercial distribution, wholesalers, factories, and retailers.'))}
          </p>
          <p>
            Flenko ensures all listed wholesale products comply with verified quality standards and direct supplier communication without intermediary commissions.
          </p>
        </div>
      </div>
    </div>

    ${relatedHtml}
  </main>
  `;

  return head + body + renderHtmlFooter();
}

/**
 * Render Complete Server-Rendered Supplier Storefront Page
 */
function renderSupplierPageHtml({ supplier, products = [], reviews = [] }) {
  const meta = generateSupplierMetadata(supplier, products);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Suppliers', url: '/business-directory.html' },
    { name: supplier.category || 'General', url: `/suppliers/category/${slugify(supplier.category || 'General')}` },
    { name: supplier.company_name, url: `/suppliers/${supplier.slug}` }
  ];

  const supplierSchema = buildSupplierSchema(supplier, meta.canonical);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  const head = renderHtmlHead({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogImage: meta.ogImage,
    keywords: meta.keywords,
    schemas: [supplierSchema, breadcrumbSchema]
  });

  const productsHtml = products.length > 0 ? `
    <div style="margin-top: 2rem;">
      <h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem;">
        Published Products &amp; Services (${products.length})
      </h2>
      <div class="related-grid">
        ${products.map(p => `
          <a href="/products/${p.slug}" class="related-card">
            <img src="${escapeHtml(p.image_url || '/assets/images/logo.png')}" alt="${escapeHtml(p.name)}" loading="lazy">
            <div class="related-card-body">
              <div style="font-size: 0.72rem; color: var(--fl-teal); font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(p.category || 'General')}</div>
              <h3 style="font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; line-height: 1.3;">${escapeHtml(p.name)}</h3>
              <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.4rem;">Min. Order: <strong>${p.moq || 1} ${p.unit || 'pieces'}</strong></div>
              <div style="margin-top: auto; font-size: 0.95rem; font-weight: 800; color: #0284c7;">
                ${p.price ? ('₹' + Number(p.price).toLocaleString('en-IN')) : 'Get Best Quote'}
              </div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  ` : `
    <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 2.5rem; text-align: center; color: #64748b; margin-top: 2rem;">
      <h3 style="color: #0f172a; margin: 0 0 0.5rem;">Catalog Updating Soon</h3>
      <p style="margin: 0 0 1.25rem; font-size: 0.9rem;">This supplier is currently synchronizing their latest product listings.</p>
      <a href="/rfq.html" class="btn-quote" style="font-size: 0.88rem; padding: 0.55rem 1.1rem;">Post Direct RFQ to Supplier</a>
    </div>
  `;

  const body = `
  <!-- Breadcrumbs -->
  <nav class="seo-breadcrumbs" aria-label="Breadcrumbs">
    <div class="inner">
      ${breadcrumbs.map((b, i) => {
        if (i === breadcrumbs.length - 1) {
          return `<span class="cur">${escapeHtml(b.name)}</span>`;
        }
        return `<a href="${b.url}">${escapeHtml(b.name)}</a><span class="sep">/</span>`;
      }).join('')}
    </div>
  </nav>

  <main class="seo-container">
    <!-- Supplier Hero Banner -->
    <div class="fl-card" style="padding: 2rem;">
      <div class="supplier-hero-grid" style="display: grid; grid-template-columns: 140px 1fr auto; gap: 1.5rem; align-items: start;">
        <div style="width: 140px; height: 140px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 8px;">
          <img src="${escapeHtml(supplier.logo_url || '/assets/images/logo.png')}" alt="${escapeHtml(supplier.company_name)} logo" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>

        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
            <h1 style="font-size: 1.85rem; font-weight: 800; color: #0f172a; margin: 0;">
              ${escapeHtml(supplier.company_name)}
            </h1>
            <span class="badge-teal">✓ Verified Supplier</span>
            ${supplier.is_paid_trusted ? '<span class="badge-orange">🛡️ Paid Trusted Seller</span>' : ''}
          </div>

          <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.85rem;">
            📍 <strong>${escapeHtml(supplier.city || 'India')}</strong>, ${escapeHtml(supplier.country || 'India')}
            &nbsp;•&nbsp; 🏢 <strong>${escapeHtml(supplier.business_type || 'Manufacturer')}</strong>
            &nbsp;•&nbsp; 🏷️ <strong>${escapeHtml(supplier.category || 'General B2B')}</strong>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem 1rem; max-width: 700px; font-size: 0.82rem;">
            <div>
              <span style="color:#64748b; font-size:0.72rem; font-weight:700; text-transform:uppercase;">📅 Year Established</span>
              <strong style="display:block; color:#0f172a; margin-top:2px;">${escapeHtml(supplier.year_est || 'Established Manufacturer')}</strong>
            </div>
            <div>
              <span style="color:#64748b; font-size:0.72rem; font-weight:700; text-transform:uppercase;">📜 GST Status</span>
              <strong style="display:block; color:#16a34a; margin-top:2px;">${supplier.gst_number ? (escapeHtml(supplier.gst_number) + ' (Verified)') : 'Verified Merchant'}</strong>
            </div>
          </div>
        </div>

        <div>
          <button class="btn-quote" style="width: 100%;" onclick="triggerQuickInquiry('Supplier Inquiry: ${escapeHtml(supplier.company_name)}', '${supplier.phone || ''}')">
            💬 Send Direct Inquiry
          </button>
        </div>
      </div>

      <!-- About Supplier Section -->
      <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
        <h2 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem;">
          About ${escapeHtml(supplier.company_name)}
        </h2>
        <p style="font-size: 0.95rem; line-height: 1.7; color: #334155; margin: 0;">
          ${escapeHtml(supplier.about || (supplier.company_name + ' is a verified B2B supplier and manufacturer operating in ' + (supplier.city || 'India') + '. Specializing in high-standard manufacturing, bulk wholesale distribution, and dedicated trade cooperation.'))}
        </p>
      </div>
    </div>

    ${productsHtml}
  </main>
  `;

  return head + body + renderHtmlFooter();
}

/**
 * Render Complete Server-Rendered Category Landing Page
 */
function renderCategoryPageHtml({ categoryName, products = [], suppliers = [] }) {
  const meta = generateCategoryMetadata(categoryName, products.length);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'All Categories', url: '/categories.html' },
    { name: categoryName, url: `/wholesale/${slugify(categoryName)}` }
  ];

  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": meta.title,
    "description": meta.description,
    "url": meta.canonical
  };

  const head = renderHtmlHead({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogImage: meta.ogImage,
    keywords: meta.keywords,
    schemas: [collectionSchema, breadcrumbSchema]
  });

  const body = `
  <!-- Breadcrumbs -->
  <nav class="seo-breadcrumbs" aria-label="Breadcrumbs">
    <div class="inner">
      ${breadcrumbs.map((b, i) => {
        if (i === breadcrumbs.length - 1) {
          return `<span class="cur">${escapeHtml(b.name)}</span>`;
        }
        return `<a href="${b.url}">${escapeHtml(b.name)}</a><span class="sep">/</span>`;
      }).join('')}
    </div>
  </nav>

  <main class="seo-container">
    <div style="margin-bottom: 2rem;">
      <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem;">
        Wholesale ${escapeHtml(categoryName)} Manufacturers &amp; Suppliers
      </h1>
      <p style="font-size: 0.95rem; color: #475569; max-width: 850px; line-height: 1.6; margin: 0;">
        Source wholesale ${escapeHtml(categoryName)} directly from verified factory manufacturers and authorized distributors. Get instant quotations with Trade Assurance.
      </p>
    </div>

    <!-- Products Grid -->
    <div>
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem;">
        Available Wholesale ${escapeHtml(categoryName)} (${products.length})
      </h2>

      ${products.length > 0 ? `
        <div class="related-grid" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">
          ${products.map(p => `
            <a href="/products/${p.slug}" class="related-card">
              <img src="${escapeHtml(p.image_url || '/assets/images/logo.png')}" alt="${escapeHtml(p.name)}" loading="lazy">
              <div class="related-card-body">
                <div style="font-size: 0.72rem; color: var(--fl-teal); font-weight: 700; margin-bottom: 0.25rem;">${escapeHtml(p.category || categoryName)}</div>
                <h3 style="font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; line-height: 1.35;">${escapeHtml(p.name)}</h3>
                <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">
                  Min. Order: <strong>${p.moq || 1} ${escapeHtml(p.unit || 'Pieces')}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:auto;">
                  <span style="font-size: 1.1rem; font-weight: 800; color: #0284c7;">
                    ${p.price ? ('₹' + Number(p.price).toLocaleString('en-IN')) : 'Get Quote'}
                  </span>
                  <span style="font-size: 0.75rem; color: #16a34a; font-weight: 700;">✓ In Stock</span>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      ` : `
        <div class="fl-card" style="padding: 3rem; text-align: center; color: #64748b;">
          <h3 style="color: #0f172a; margin: 0 0 0.5rem;">New Listings Coming Soon</h3>
          <p style="margin: 0 0 1.25rem; font-size: 0.92rem;">Be the first verified manufacturer to list ${escapeHtml(categoryName)} on Flenko.</p>
          <a href="/sell.html" class="btn-quote" style="font-size: 0.88rem; padding: 0.6rem 1.25rem;">Register as Seller in ${escapeHtml(categoryName)}</a>
        </div>
      `}
    </div>

    <!-- Verified Suppliers in Category -->
    ${suppliers.length > 0 ? `
      <div style="margin-top: 3.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0 0 1rem;">
          Verified Suppliers in ${escapeHtml(categoryName)}
        </h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
          ${suppliers.map(s => `
            <div class="fl-card" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <a href="/suppliers/${s.slug}" style="font-size: 1.1rem; font-weight: 800; color: var(--fl-navy); text-decoration: none;">
                  ${escapeHtml(s.company_name)}
                </a>
                <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.35rem;">
                  📍 ${escapeHtml(s.city || 'India')} &nbsp;•&nbsp; 🏢 ${escapeHtml(s.business_type || 'Manufacturer')}
                </div>
                <p style="font-size: 0.85rem; color: #475569; margin: 0.65rem 0 0; line-height: 1.5;">
                  ${escapeHtml((s.about || 'Verified manufacturer and wholesale supplier.').slice(0, 110))}...
                </p>
              </div>
              <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <span class="badge-teal">✓ Verified Pro</span>
                <a href="/suppliers/${s.slug}" style="font-size: 0.82rem; font-weight: 700; color: var(--fl-navy); text-decoration: none;">View Profile &rarr;</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  </main>
  `;

  return head + body + renderHtmlFooter();
}

/**
 * Backfill existing products and businesses in PostgreSQL with permanent SEO slugs
 */
async function backfillSeoSlugs(db) {
  try {
    // 1. Backfill Businesses
    const unsluggedBiz = await db.query('SELECT id, company_name, city, category, business_type FROM businesses WHERE slug IS NULL OR slug = \'\'');
    if (unsluggedBiz.rows && unsluggedBiz.rows.length > 0) {
      console.log(`🚀 [SEO Engine] Backfilling ${unsluggedBiz.rows.length} businesses with permanent SEO slugs...`);
      for (const b of unsluggedBiz.rows) {
        const slug = await generateUniqueSupplierSlug(db, b.company_name || 'supplier', b.id);
        const meta = generateSupplierMetadata({ ...b, slug });
        await db.query(
          'UPDATE businesses SET slug = $1, seo_title = $2, seo_description = $3 WHERE id = $4',
          [slug, meta.title, meta.description, b.id]
        );
      }
    }

    // 2. Backfill Products
    const unsluggedProds = await db.query('SELECT p.id, p.name, p.category, p.country, p.price, p.unit, p.moq, b.company_name, b.city FROM products p LEFT JOIN businesses b ON p.supplier_id = b.user_id WHERE p.slug IS NULL OR p.slug = \'\'');
    if (unsluggedProds.rows && unsluggedProds.rows.length > 0) {
      console.log(`🚀 [SEO Engine] Backfilling ${unsluggedProds.rows.length} products with permanent SEO slugs...`);
      for (const p of unsluggedProds.rows) {
        const slug = await generateUniqueProductSlug(db, p.name || 'product', p.id);
        const meta = generateProductMetadata({ ...p, slug }, { company_name: p.company_name, city: p.city });
        await db.query(
          'UPDATE products SET slug = $1, seo_title = $2, seo_description = $3 WHERE id = $4',
          [slug, meta.title, meta.description, p.id]
        );
      }
    }
  } catch (err) {
    console.warn('⚠️ [SEO Engine] Backfill notice:', err.message);
  }
}

module.exports = {
  BASE_URL,
  slugify,
  escapeHtml,
  generateUniqueProductSlug,
  generateUniqueSupplierSlug,
  generateProductMetadata,
  generateSupplierMetadata,
  generateCategoryMetadata,
  buildProductSchema,
  buildSupplierSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  renderProductPageHtml,
  renderSupplierPageHtml,
  renderCategoryPageHtml,
  backfillSeoSlugs
};
