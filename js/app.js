// Flenko.com Core JS

const b2bProducts = [];

function formatCurrency(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

async function renderHomepageProducts() {
  const grid = document.getElementById("homepageProductGrid");
  if (!grid) return;
  
  let allProducts = [...b2bProducts]; // Start with mock data

  try {
    const res = await fetch('/api/public/products');
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        // Format backend products to match frontend mock format
        const liveProducts = data.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          supplier: { name: "Supplier ID: " + p.supplier_id, verified: true, location: "Pan-India" },
          price: p.price,
          moq: p.moq,
          unit: "Pieces",
          image: p.image_url,
          badge: "NEW LISTING",
          leadTime: "TBD"
        }));
        
        // Put live products at the top!
        allProducts = [...liveProducts, ...allProducts];
      }
    }
  } catch (err) {
    console.warn("Could not fetch live products from backend", err);
  }

  grid.innerHTML = allProducts.map(p => `
    <article class="product-card">
      <div class="product-img-wrapper">
        <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
        ${p.badge ? `<div class="product-badges"><span class="badge badge-teal">${p.badge}</span></div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-vendor">${p.supplier.name} ${p.supplier.verified ? '<span style="color:var(--color-blue-primary);" title="Verified Supplier">✓</span>' : ''}</div>
        <h3 class="product-title">${p.name}</h3>
        
        <div class="product-meta">
          <div>📍 ${p.supplier.location}</div>
          <div>⏱️ Lead time: ${p.leadTime}</div>
        </div>
        
        <div class="product-price-row">
          <div>
            <div class="product-price">${formatCurrency(p.price)} <small style="font-weight:normal; font-size:0.75rem; color:var(--color-text-muted);">/ ${p.unit}</small></div>
            <div class="product-moq">Min. Order: ${p.moq} ${p.unit}</div>
          </div>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
           <button class="btn btn-outline" style="flex:1;" onclick="window.location.href='rfq.html?product=${p.id}'">Contact Supplier</button>
        </div>
      </div>
    </article>
  `).join("");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderHomepageProducts();
});
