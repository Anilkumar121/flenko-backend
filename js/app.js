// Flenko.com Core JS - Real Production B2B Marketplace

// Clean: No mock or sample products
const b2bProducts = [];

function formatCurrency(n) {
  if (typeof n !== 'number') n = parseFloat(n) || 0;
  if (window.currencyManager && typeof window.currencyManager.format === 'function') {
    return window.currencyManager.format(n);
  }
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatPriceRange(p) {
  if (!p || p.price === null || p.price === undefined || p.price === '' || isNaN(p.price) || Number(p.price) <= 0) {
    return `<span class="contact-rates-badge" style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;"><span style="font-size:0.85rem;">💬</span> Contact supplier to get best rates</span>`;
  }
  if (window.currencyManager && typeof window.currencyManager.formatRange === 'function') {
    return window.currencyManager.formatRange(parseFloat(p.price), p.priceMax ? parseFloat(p.priceMax) : null);
  }
  if (p.priceMax && p.priceMax > p.price) {
    return `${formatCurrency(p.price)} - ${formatCurrency(p.priceMax)}`;
  }
  return formatCurrency(p.price);
}

async function renderHomepageProducts() {
  const grid = document.getElementById("homepageProductGrid");
  if (!grid) return;
  
  let allProducts = [];
  const primaryApi = window.API_BASE || '/api';
  const fallbackApi = window.API_FALLBACK || 'https://flenko-backend.onrender.com/api';

  const fetchProductsFrom = async (base) => {
    try {
      const res = await fetch(`${base}/public/products`);
      if (res.ok) {
        const data = await res.json();
        return (data && data.products) ? data.products : [];
      }
    } catch(e) {}
    return null;
  };

  let rawList = await fetchProductsFrom(primaryApi);
  if ((!rawList || rawList.length === 0) && primaryApi !== fallbackApi) {
    const fallbackList = await fetchProductsFrom(fallbackApi);
    if (fallbackList && fallbackList.length > 0) {
      rawList = fallbackList;
    }
  }

  const getCountryFlag = (cName) => {
    if (!cName) return '📍';
    const match = (window.FLENKO_COUNTRIES || []).find(c => c.name.toLowerCase() === cName.toLowerCase() || c.code.toLowerCase() === cName.toLowerCase());
    return match ? match.flag : (cName === 'United States' ? '🇺🇸' : (cName === 'Germany' ? '🇩🇪' : (cName === 'China' ? '🇨🇳' : '🇮🇳')));
  };

  if (rawList && rawList.length > 0) {
    allProducts = rawList.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || "Wholesale B2B",
      country: p.country || "India",
      flag: getCountryFlag(p.country || "India"),
      years: "Verified",
      rating: "5.0",
      reviews: 1,
      slug: p.slug || '',
      supplier: { 
        name: p.supplier_name || ("Supplier #" + p.supplier_id), 
        logo: p.supplier_logo || null, 
        verified: true, 
        location: (p.city || "Industrial Hub") + (p.country ? ", " + p.country : ", India"),
        slug: p.supplier_slug || (p.supplier && p.supplier.slug) || ''
      },
      supplier_id: p.supplier_id || 1,
      supplier_slug: p.supplier_slug || (p.supplier && p.supplier.slug) || '',
      supplier_phone: p.supplier_phone || (p.supplier && p.supplier.phone) || '',
      supplier_whatsapp: p.supplier_whatsapp || (p.supplier && (p.supplier.whatsapp || p.supplier.phone)) || '',
      price: (p.price !== null && p.price !== undefined && p.price !== '' && Number(p.price) > 0) ? parseFloat(p.price) : null,
      priceMax: (p.price !== null && p.price !== undefined && p.price !== '' && Number(p.price) > 0) ? (parseFloat(p.price) * 1.15) : null,
      moq: p.moq || 1,
      stock: p.stock_quantity || 500,
      unit: p.unit || "Pieces",
      image: p.image_url || "assets/images/logo.png",
      badge: "NEW LISTING",
      tradeAssurance: true,
      responseTime: "Active"
    }));
  }

  

  // Clean Empty State if no products yet
  if (allProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; padding: 4rem 2rem; text-align: center; background: var(--color-white); border: 1px dashed #cbd5e1; border-radius: var(--radius-lg);">
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">📦</div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-navy-midnight); margin-bottom: 0.5rem;">
          No wholesale products listed yet
        </h3>
        <p style="color: #64748b; max-width: 500px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
          Are you a manufacturer, exporter, or wholesale supplier? Create your free seller account and be the first to list your products to global buyers.
        </p>
        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <button class="btn btn-orange" onclick="window.location.href='sell.html'" style="padding: 0.6rem 1.5rem;">
            Start Selling on Flenko (Free) →
          </button>
          <button class="btn btn-secondary" onclick="window.location.href='rfq.html'" style="padding: 0.6rem 1.25rem;">
            Post Buy Requirement (RFQ)
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Render Real Products from Backend
  grid.innerHTML = allProducts.map(p => `
    <article class="flenko-card">
      <div class="flenko-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="flenko-card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Product+Image'">
        <div style="position:absolute; top:8px; left:8px; display:flex; flex-direction:column; gap:4px;">
          ${p.tradeAssurance ? `<span class="badge badge-trade-assurance" style="font-size:0.68rem; padding:2px 6px;">🛡️ Trade Assurance</span>` : ''}
          ${p.badge ? `<span class="badge badge-verified-pro" style="font-size:0.68rem; padding:2px 6px;">${p.badge}</span>` : ''}
        </div>
      </div>
      
      <div class="flenko-card-body">
        <div class="flenko-card-price" style="min-height:28px; display:flex; align-items:center;">
          ${(p.price !== null && p.price !== undefined && p.price !== '' && Number(p.price) > 0)
            ? `${formatPriceRange(p)} <small style="font-size:0.75rem; font-weight:normal; color:#64748b; margin-left:4px;">/ ${p.unit || 'Pieces'}</small>`
            : formatPriceRange(p)
          }
        </div>
        
        <div class="flenko-card-moq" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Min. order: <strong>${p.moq} ${p.unit}</strong></span>
          <span style="color:#028867; font-weight:600; font-size:0.72rem;">✓ ${p.stock || 500} ${p.unit} In Stock</span>
        </div>

        <h3 class="flenko-card-title" title="${p.name}">
          ${p.name}
        </h3>

        <div class="flenko-supplier-meta">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:6px; min-width:0;">
              ${p.supplier.logo ? `<img src="${p.supplier.logo}" alt="Logo" style="width:20px; height:20px; border-radius:50%; object-fit:contain; border:1px solid #cbd5e1; background:#fff; flex-shrink:0;">` : ''}
              <span style="font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">
                ${p.supplier.name}
              </span>
            </div>
            <span style="color:#b45309; font-weight:700; font-size:0.75rem;">${p.years || 'Verified'}</span>
          </div>
        </div>

        <div style="display:flex; gap:0.4rem; margin-top:0.75rem;">
          <button class="btn btn-orange" style="flex:1; padding:0.4rem 0.5rem; font-size:0.78rem;" onclick="openProductInquiry(${p.id})">
            Contact Supplier
          </button>
          <button class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.78rem; border-color:#cbd5e1;" onclick="openProductInquiry(${p.id})" title="Chat / Send Inquiry">
            💬
          </button>
        </div>
      </div>
    </article>
  `).join("");

  window.homeProducts = allProducts;
}

window.openProductInquiry = function(id) {
  const p = (window.homeProducts || []).find(x => x.id === id);
  if (p && typeof window.openSupplierInquiry === 'function') {
    window.openSupplierInquiry(p);
  } else {
    window.location.href = `rfq.html?product=${id}`;
  }
};

// Initialize & listen for currency changes
document.addEventListener("DOMContentLoaded", () => {
  renderHomepageProducts();
  window.addEventListener('flenko_currency_changed', () => {
    renderHomepageProducts();
  });
});
