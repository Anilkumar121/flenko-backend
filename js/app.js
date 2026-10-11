// Flenko.com Core JS - Real Production B2B Marketplace

// Clean: No mock or sample products
const b2bProducts = [];

function formatCurrency(n) {
  if (typeof n !== 'number') n = parseFloat(n) || 0;
  
  try {
    const saved = localStorage.getItem('flenko_country');
    if (saved) {
      const countryObj = JSON.parse(saved);
      if (countryObj.code === 'IN') {
        return "₹" + Math.round(n * 85).toLocaleString("en-IN");
      }
    }
  } catch(e) {}

  if (n < 10 && n % 1 !== 0) {
    return "$" + n.toFixed(2);
  }
  return "$" + Math.round(n).toLocaleString("en-US");
}

function formatPriceRange(p) {
  if (p.priceMax && p.priceMax > p.price) {
    return `${formatCurrency(p.price)} - ${formatCurrency(p.priceMax)}`;
  }
  return formatCurrency(p.price);
}

async function renderHomepageProducts() {
  const grid = document.getElementById("homepageProductGrid");
  if (!grid) return;
  
  let allProducts = [];

  try {
    const res = await fetch('https://flenko-backend.onrender.com/api/public/products');
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        allProducts = data.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || "Wholesale B2B",
          country: p.country || "Worldwide",
          flag: p.country === "United States" ? "🇺🇸" : (p.country === "Germany" ? "🇩🇪" : (p.country === "India" ? "🇮🇳" : "🌐")),
          years: "Verified",
          rating: "5.0",
          reviews: 1,
          supplier: { 
            name: p.supplier_name || ("Supplier #" + p.supplier_id), 
            verified: true, 
            location: (p.city || "Global Hub") + (p.country ? ", " + p.country : "") 
          },
          price: parseFloat(p.price) || 0,
          priceMax: (parseFloat(p.price) || 0) * 1.15,
          moq: p.moq || 1,
          unit: p.unit || "Pieces",
          image: p.image_url || "assets/images/logo.png",
          badge: "NEW LISTING",
          tradeAssurance: true,
          responseTime: "Active"
        }));
      }
    }
  } catch (err) {
    console.warn("Could not fetch live products from backend", err);
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
    <article class="alibaba-card">
      <div class="alibaba-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="alibaba-card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Product+Image'">
        <div style="position:absolute; top:8px; left:8px; display:flex; flex-direction:column; gap:4px;">
          ${p.tradeAssurance ? `<span class="badge badge-trade-assurance" style="font-size:0.68rem; padding:2px 6px;">🛡️ Trade Assurance</span>` : ''}
          ${p.badge ? `<span class="badge badge-verified-pro" style="font-size:0.68rem; padding:2px 6px;">${p.badge}</span>` : ''}
        </div>
      </div>
      
      <div class="alibaba-card-body">
        <div class="alibaba-card-price">
          ${formatPriceRange(p)} <small style="font-size:0.75rem; font-weight:normal; color:#64748b;">/ ${p.unit}</small>
        </div>
        
        <div class="alibaba-card-moq">
          Min. order: <strong>${p.moq} ${p.unit}</strong>
        </div>

        <h3 class="alibaba-card-title" title="${p.name}">
          ${p.name}
        </h3>

        <div class="alibaba-supplier-meta">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;">
              ${p.flag || '📍'} ${p.supplier.name}
            </span>
            <span style="color:#b45309; font-weight:700;">${p.years || 'Verified'}</span>
          </div>
        </div>

        <div style="display:flex; gap:0.4rem; margin-top:0.75rem;">
          <button class="btn btn-orange" style="flex:1; padding:0.4rem 0.5rem; font-size:0.78rem;" onclick="window.location.href='rfq.html?product=${p.id}&name=${encodeURIComponent(p.name)}'">
            Contact Supplier
          </button>
          <button class="btn btn-secondary" style="padding:0.4rem 0.6rem; font-size:0.78rem; border-color:#cbd5e1;" onclick="window.location.href='rfq.html?product=${p.id}&name=${encodeURIComponent(p.name)}'" title="Chat / Send Inquiry">
            💬
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderHomepageProducts();
});
