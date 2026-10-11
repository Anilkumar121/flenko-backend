// Flenko.com Core JS - Alibaba-Style Global Wholesale Marketplace

const b2bProducts = [
  {
    id: "gp_1",
    name: "Industrial 5-Axis CNC Machining Center High-Precision Metal Milling",
    category: "Industrial Machinery",
    country: "Germany",
    flag: "🇩🇪",
    years: "12 Yrs",
    rating: "4.9",
    reviews: 84,
    supplier: { name: "Siemens Tooling & Automation GmbH", verified: true, location: "Munich, Germany" },
    price: 24500,
    priceMax: 28000,
    moq: 1,
    unit: "Sets",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
    badge: "VERIFIED PRO",
    tradeAssurance: true,
    responseTime: "≤ 2h"
  },
  {
    id: "gp_2",
    name: "Eco-Friendly Biodegradable Corrugated Shipping Boxes Bulk 5-Ply",
    category: "Packaging & Printing",
    country: "United States",
    flag: "🇺🇸",
    years: "6 Yrs",
    rating: "4.8",
    reviews: 142,
    supplier: { name: "Apex Pack Worldwide Corp", verified: true, location: "Chicago, IL, USA" },
    price: 0.45,
    priceMax: 0.75,
    moq: 1000,
    unit: "Pieces",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=500&q=80",
    badge: "READY TO SHIP",
    tradeAssurance: true,
    responseTime: "≤ 1h"
  },
  {
    id: "gp_3",
    name: "Commercial Tier-1 Bifacial Monocrystalline Solar Panels 550W",
    category: "Renewable Energy",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    years: "8 Yrs",
    rating: "5.0",
    reviews: 67,
    supplier: { name: "Gulf CleanEnergy Technologies FZE", verified: true, location: "Dubai, UAE" },
    price: 95,
    priceMax: 110,
    moq: 50,
    unit: "Units",
    image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80",
    badge: "VERIFIED PRO",
    tradeAssurance: true,
    responseTime: "≤ 3h"
  },
  {
    id: "gp_4",
    name: "100% Organic Combed Ring-Spun Cotton Yarn 30s/1 for Knitting",
    category: "Textiles & Apparel",
    country: "India",
    flag: "🇮🇳",
    years: "15 Yrs",
    rating: "4.9",
    reviews: 210,
    supplier: { name: "Vardhman Global Textiles Ltd", verified: true, location: "Surat, India" },
    price: 3.20,
    priceMax: 3.80,
    moq: 500,
    unit: "Kg",
    image: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=500&q=80",
    badge: "OEKO-TEX",
    tradeAssurance: true,
    responseTime: "≤ 2h"
  },
  {
    id: "gp_5",
    name: "Industrial Grade Titanium Dioxide (TiO2) High-Purity White Pigment",
    category: "Chemicals & Dyes",
    country: "China",
    flag: "🇨🇳",
    years: "9 Yrs",
    rating: "4.7",
    reviews: 95,
    supplier: { name: "Shandong Chemical Industries Ltd", verified: true, location: "Qingdao, China" },
    price: 1850,
    priceMax: 2100,
    moq: 5,
    unit: "Tons",
    image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=500&q=80",
    badge: "ISO 9001",
    tradeAssurance: true,
    responseTime: "≤ 1h"
  },
  {
    id: "gp_6",
    name: "Smart AI 4K IP Dome Security Camera with Night Vision & Motion Alerts",
    category: "IT & Telecom",
    country: "Singapore",
    flag: "🇸🇬",
    years: "5 Yrs",
    rating: "4.9",
    reviews: 118,
    supplier: { name: "NexTech Vision Solutions Pte", verified: true, location: "Singapore" },
    price: 42,
    priceMax: 55,
    moq: 25,
    unit: "Units",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=500&q=80",
    badge: "ONVIF",
    tradeAssurance: true,
    responseTime: "≤ 2h"
  },
  {
    id: "gp_7",
    name: "Hospital Grade Electric ICU Patient Bed 5 Functions with Remote Control",
    category: "Medical & Pharma",
    country: "Japan",
    flag: "🇯🇵",
    years: "18 Yrs",
    rating: "5.0",
    reviews: 54,
    supplier: { name: "Kyoto MedTech International", verified: true, location: "Kyoto, Japan" },
    price: 1450,
    priceMax: 1680,
    moq: 5,
    unit: "Sets",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=80",
    badge: "CE & FDA",
    tradeAssurance: true,
    responseTime: "≤ 1h"
  },
  {
    id: "gp_8",
    name: "Heavy Duty High-Speed Electric Vehicle (EV) DC Fast Charger 120kW",
    category: "Automotive & Parts",
    country: "United Kingdom",
    flag: "🇬🇧",
    years: "7 Yrs",
    rating: "4.8",
    reviews: 73,
    supplier: { name: "ElectroVolt Power Systems UK", verified: true, location: "London, UK" },
    price: 8900,
    priceMax: 9800,
    moq: 1,
    unit: "Units",
    image: "https://images.unsplash.com/photo-1558441719-8b489c63f7d1?auto=format&fit=crop&w=500&q=80",
    badge: "CE CERTIFIED",
    tradeAssurance: true,
    responseTime: "≤ 4h"
  }
];

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
          years: "3 Yrs",
          rating: "4.9",
          reviews: 18,
          supplier: { 
            name: "Verified Supplier #" + p.supplier_id, 
            verified: true, 
            location: (p.city || "Pan-India") + (p.country ? ", " + p.country : "") 
          },
          price: p.price,
          priceMax: p.price * 1.15,
          moq: p.moq || 1,
          unit: p.unit || "Pieces",
          image: p.image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80",
          badge: "VERIFIED PRO",
          tradeAssurance: true,
          responseTime: "≤ 2h"
        }));
        
        allProducts = [...liveProducts, ...allProducts];
      }
    }
  } catch (err) {
    console.warn("Could not fetch live products from backend", err);
  }

  // Render Alibaba-Styled Cards
  grid.innerHTML = allProducts.map(p => `
    <article class="alibaba-card">
      <div class="alibaba-card-img-wrap">
        <img src="${p.image}" alt="${p.name}" class="alibaba-card-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'">
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
            <span style="color:#b45309; font-weight:700;">${p.years || '5 Yrs'}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; color:#94a3b8; font-size:0.7rem;">
            <span>★ ${p.rating || '4.9'} (${p.reviews || '50+'})</span>
            <span>⏱️ ${p.responseTime || '≤ 2h'}</span>
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
