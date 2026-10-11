// Flenko.com Core JS - Worldwide B2B Platform

const b2bProducts = [
  {
    id: "hp_1",
    name: "High-Precision 5-Axis CNC Milling Machine Center",
    category: "Industrial Machinery",
    country: "Germany",
    flag: "🇩🇪",
    supplier: { name: "Siemens Automation & Tooling GmbH", verified: true, location: "Munich, Germany" },
    price: 24500,
    moq: 1,
    unit: "Sets",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
    badge: "GLOBAL EXPORTER",
    leadTime: "15-20 days"
  },
  {
    id: "hp_2",
    name: "Eco-Friendly Biodegradable Corrugated Shipping Boxes (Bulk 5-Ply)",
    category: "Packaging & Printing",
    country: "United States",
    flag: "🇺🇸",
    supplier: { name: "Apex Pack Worldwide Corp", verified: true, location: "Chicago, IL, USA" },
    price: 0.45,
    moq: 1000,
    unit: "Pieces",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80",
    badge: "BESTSELLER",
    leadTime: "5-7 days"
  },
  {
    id: "hp_3",
    name: "Commercial Tier-1 Bifacial Monocrystalline Solar Panels 550W",
    category: "Renewable Energy",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    supplier: { name: "Gulf CleanEnergy Technologies FZE", verified: true, location: "Dubai, UAE" },
    price: 95,
    moq: 50,
    unit: "Units",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80",
    badge: "TIER 1 RATED",
    leadTime: "7-12 days"
  },
  {
    id: "hp_4",
    name: "100% Organic Combed Ring-Spun Cotton Yarn 30s/1 for Weaving",
    category: "Textiles & Apparel",
    country: "India",
    flag: "🇮🇳",
    supplier: { name: "Vardhman Global Textiles Ltd", verified: true, location: "Surat, India" },
    price: 3.20,
    moq: 500,
    unit: "Kg",
    image: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=500&q=80",
    badge: "OEKO-TEX",
    leadTime: "7 days"
  },
  {
    id: "hp_5",
    name: "Industrial Grade Titanium Dioxide (TiO2) High-Purity White Pigment",
    category: "Chemicals & Dyes",
    country: "China",
    flag: "🇨🇳",
    supplier: { name: "Shandong Chemical Industries Ltd", verified: true, location: "Qingdao, China" },
    price: 1850,
    moq: 5,
    unit: "Tons",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=500&q=80",
    badge: "ISO 9001",
    leadTime: "10-14 days"
  },
  {
    id: "hp_6",
    name: "Smart AI 4K IP Dome Security Camera with Night Vision",
    category: "IT & Telecom",
    country: "Singapore",
    flag: "🇸🇬",
    supplier: { name: "NexTech Vision Solutions Pte", verified: true, location: "Singapore" },
    price: 42,
    moq: 25,
    unit: "Units",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=500&q=80",
    badge: "ONVIF VERIFIED",
    leadTime: "5-7 days"
  }
];

function formatCurrency(n) {
  if (typeof n !== 'number') n = parseFloat(n) || 0;
  
  // Check if saved user country is India
  try {
    const saved = localStorage.getItem('flenko_country');
    if (saved) {
      const countryObj = JSON.parse(saved);
      if (countryObj.code === 'IN') {
        // If price is small in USD (e.g. <= 100), convert roughly or show $ / ₹
        return "₹" + Math.round(n * 85).toLocaleString("en-IN");
      }
    }
  } catch(e) {}

  // Global default in USD
  if (n < 10 && n % 1 !== 0) {
    return "$" + n.toFixed(2);
  }
  return "$" + Math.round(n).toLocaleString("en-US");
}

async function renderHomepageProducts() {
  const grid = document.getElementById("homepageProductGrid");
  if (!grid) return;
  
  let allProducts = [...b2bProducts];

  try {
    const res = await fetch('https://flenko-backend.onrender.com/api/public/products');
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        const liveProducts = data.products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category || "Wholesale B2B",
          country: p.country || "India",
          flag: p.country === "United States" ? "🇺🇸" : (p.country === "Germany" ? "🇩🇪" : "🇮🇳"),
          supplier: { 
            name: "Verified Supplier #" + p.supplier_id, 
            verified: true, 
            location: (p.city || "Pan-India") + (p.country ? ", " + p.country : "") 
          },
          price: p.price,
          moq: p.moq || 1,
          unit: p.unit || "Pieces",
          image: p.image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
          badge: "NEW LISTING",
          leadTime: "Ready to Ship"
        }));
        
        allProducts = [...liveProducts, ...allProducts];
      }
    }
  } catch (err) {
    console.warn("Could not fetch live products from backend", err);
  }

  grid.innerHTML = allProducts.map(p => `
    <article class="product-card">
      <div class="product-img-wrapper">
        <img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'">
        ${p.badge ? `<div class="product-badges"><span class="badge badge-teal">${p.badge}</span></div>` : ''}
      </div>
      <div class="product-info">
        <div class="product-vendor">${p.supplier.name} ${p.supplier.verified ? '<span style="color:var(--color-blue-primary);" title="Verified Global Supplier">✓</span>' : ''}</div>
        <h3 class="product-title" title="${p.name}">${p.name}</h3>
        
        <div class="product-meta">
          <div>${p.flag || '📍'} ${p.supplier.location}</div>
          ${p.leadTime ? `<div>⏱️ Lead time: ${p.leadTime}</div>` : ''}
        </div>
        
        <div class="product-price-row">
          <div>
            <div class="product-price">${formatCurrency(p.price)} <small style="font-weight:normal; font-size:0.75rem; color:var(--color-text-muted);">/ ${p.unit}</small></div>
            <div class="product-moq">Min. Order: <strong>${p.moq} ${p.unit}</strong></div>
          </div>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
           <button class="btn btn-primary" style="flex:1; font-size:0.8125rem; padding:0.45rem 0.6rem;" onclick="window.location.href='rfq.html?product=${p.id}&name=${encodeURIComponent(p.name)}'">Contact Supplier</button>
        </div>
      </div>
    </article>
  `).join("");
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderHomepageProducts();
});
