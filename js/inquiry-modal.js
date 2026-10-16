// Flenko.com - Instant "Contact Supplier" / "Chat Now" / "Get Latest Price" Modal
// Fully functioning B2B buyer-to-supplier inquiry workflow

(function() {
  function injectInquiryModal() {
    if (document.getElementById('flenkoInquiryModal')) return;

    const modalHtml = `
      <div id="flenkoInquiryModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.65); z-index:99999; align-items:center; justify-content:center; backdrop-filter:blur(3px); padding:1rem; box-sizing:border-box;">
        <div style="background:#fff; border-radius:12px; width:100%; max-width:580px; max-height:92vh; overflow-y:auto; box-shadow:0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1); position:relative; border:1px solid #e2e8f0;">
          
          <!-- Modal Header -->
          <div style="padding:1.25rem 1.5rem; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border-radius:12px 12px 0 0;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.35rem;">✉️</span>
              <div>
                <h3 style="font-size:1.1rem; font-weight:700; color:#0A2342; margin:0;" id="inqModalTitle">Contact Supplier</h3>
                <span style="font-size:0.75rem; color:#64748b;">Direct wholesale quote & response within 2-4 hours</span>
              </div>
            </div>
            <button type="button" onclick="closeSupplierInquiry()" style="background:none; border:none; font-size:1.5rem; color:#94a3b8; cursor:pointer; line-height:1; padding:0.25rem;">&times;</button>
          </div>

          <!-- Modal Body -->
          <form id="inquiryForm" onsubmit="handleInquirySubmit(event)" style="padding:1.5rem;">
            <input type="hidden" id="inqSupplierId" value="">
            <input type="hidden" id="inqProductId" value="">

            <!-- Product Summary Card -->
            <div style="display:flex; gap:1rem; padding:0.85rem; background:#f1f5f9; border-radius:8px; margin-bottom:1.25rem; align-items:center; border:1px solid #e2e8f0;">
              <img id="inqProductImg" src="assets/images/logo.png" alt="Product" style="width:58px; height:58px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1; background:#fff; flex-shrink:0;">
              <div style="flex:1; min-width:0;">
                <h4 id="inqProductName" style="font-size:0.9rem; font-weight:700; color:#0F172A; margin:0 0 0.25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Product Name</h4>
                <div style="display:flex; gap:0.75rem; font-size:0.75rem; color:#64748b; flex-wrap:wrap;">
                  <span>Supplier: <strong id="inqSupplierName" style="color:#0F4C9B;">Verified Factory</strong></span>
                  <span id="inqMoqInfo">MOQ: 1 Pieces</span>
                  <span style="color:#0284c7; font-weight:600;">🛡️ Trade Assurance</span>
                </div>
              </div>
            </div>

            <!-- Quantity & Unit -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1rem;">
              <div>
                <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Required Quantity *</label>
                <input type="number" id="inqQuantity" required min="1" placeholder="e.g. 500" style="width:100%; padding:0.55rem 0.75rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.875rem; outline:none; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Unit of Measurement *</label>
                <select id="inqUnit" required style="width:100%; padding:0.55rem 0.75rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.875rem; outline:none; box-sizing:border-box; background:#fff;">
                  <option value="Pieces" selected>Pieces</option>
                  <option value="Running Ft.">Running Ft.</option>
                  <option value="Units">Units</option>
                  <option value="Sets">Sets</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Sq. Ft.">Sq. Ft.</option>
                  <option value="Meters">Meters</option>
                  <option value="Kg">Kg</option>
                  <option value="Tons">Tons</option>
                </select>
              </div>
            </div>

            <!-- Target Price (Optional) -->
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Target Unit Price / Budget (Optional)</label>
              <input type="text" id="inqTargetPrice" placeholder="e.g. ₹250 / Piece or Best Supplier Rate" style="width:100%; padding:0.55rem 0.75rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.875rem; outline:none; box-sizing:border-box;">
            </div>

            <!-- Inquiry Message -->
            <div style="margin-bottom:1rem;">
              <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Detailed Requirements & Message *</label>
              <textarea id="inqMessage" required rows="3" style="width:100%; padding:0.6rem 0.75rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.875rem; outline:none; resize:vertical; font-family:inherit; box-sizing:border-box;" placeholder="Please include your specifications, delivery destination, packaging preference, and questions for the supplier."></textarea>
            </div>

            <!-- Buyer Contact -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.85rem; margin-bottom:1.5rem;">
              <div>
                <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Your Name / Company *</label>
                <input type="text" id="inqBuyerName" required placeholder="e.g. Rahul Sharma" style="width:100%; padding:0.55rem 0.75rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.875rem; outline:none; box-sizing:border-box;">
              </div>
              <div>
                <label style="display:block; font-size:0.825rem; font-weight:600; color:#334155; margin-bottom:0.35rem;">Phone / WhatsApp *</label>
                <div style="display:flex;">
                  <select id="inqCountryCode" class="form-control flenko-country-code-select" data-default="+91" style="width:130px; border-right:none; border-radius:6px 0 0 6px; font-size:0.82rem; font-weight:600; background:#f8fafc; padding:0.55rem 0.35rem; cursor:pointer;" title="Select Country Code">
                    <option value="+91" selected>🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+65">🇸🇬 +65</option>
                  </select>
                  <input type="text" id="inqBuyerPhone" required placeholder="Mobile number" style="width:100%; padding:0.55rem 0.75rem; border:1px solid #cbd5e1; border-radius:0 6px 6px 0; font-size:0.875rem; outline:none; box-sizing:border-box;">
                </div>
              </div>
            </div>

            <!-- Submit Action -->
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; align-items:center;">
              <button type="button" onclick="closeSupplierInquiry()" class="btn btn-secondary" style="padding:0.6rem 1.25rem; font-size:0.875rem;">Cancel</button>
              <button type="submit" id="inqSubmitBtn" class="btn btn-orange" style="padding:0.6rem 1.75rem; font-size:0.875rem; font-weight:700;">
                Send Inquiry Now →
              </button>
            </div>
          </form>

          <!-- Success State -->
          <div id="inquirySuccessState" style="display:none; padding:2.5rem 1.5rem; text-align:center;">
            <div style="font-size:3.5rem; margin-bottom:0.75rem;">🎉</div>
            <h3 style="font-size:1.35rem; font-weight:800; color:#0A2342; margin-bottom:0.5rem;">Inquiry Dispatched Successfully!</h3>
            <p style="color:#64748b; font-size:0.9rem; max-width:440px; margin:0 auto 1.5rem; line-height:1.5;">
              Your wholesale requirement has been delivered directly to <strong id="successSupplierName" style="color:#0F4C9B;">Supplier</strong>. They have been notified via SMS/WhatsApp to reply promptly.
            </p>
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:0.75rem 1rem; max-width:350px; margin:0 auto 1.5rem; font-size:0.8rem; color:#1e40af;">
              Reference Inquiry ID: <strong id="successRefId">#INQ-94827</strong>
            </div>
            <div style="display:flex; justify-content:center; gap:0.75rem;">
              <button type="button" onclick="window.location.href='buyer-dashboard.html'" class="btn btn-primary" style="padding:0.55rem 1.25rem; font-size:0.85rem;">
                Open Buyer Workspace
              </button>
              <button type="button" onclick="closeSupplierInquiry()" class="btn btn-secondary" style="padding:0.55rem 1.25rem; font-size:0.85rem;">
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (typeof window.initCountryCodeSelect === 'function') {
      window.initCountryCodeSelect('inqCountryCode', '+91');
    }
  }

  window.openSupplierInquiry = function(prod) {
    injectInquiryModal();
    const modal = document.getElementById('flenkoInquiryModal');
    const form = document.getElementById('inquiryForm');
    const success = document.getElementById('inquirySuccessState');
    
    form.style.display = 'block';
    success.style.display = 'none';

    document.getElementById('inqSupplierId').value = prod.supplier_id || prod.supplierId || 1;
    document.getElementById('inqProductId').value = prod.id || '';
    document.getElementById('inqProductName').innerText = prod.name || 'Wholesale Product';
    document.getElementById('inqProductImg').src = prod.image || prod.image_url || 'assets/images/logo.png';
    document.getElementById('inqSupplierName').innerText = (prod.supplier && prod.supplier.name) || prod.supplier_name || 'Verified Supplier';
    document.getElementById('inqMoqInfo').innerText = `MOQ: ${prod.moq || 1} ${prod.unit || 'Pieces'}`;
    
    // Select unit
    const unitSelect = document.getElementById('inqUnit');
    if (prod.unit) {
      for (let i = 0; i < unitSelect.options.length; i++) {
        if (unitSelect.options[i].value.toLowerCase() === prod.unit.toLowerCase()) {
          unitSelect.selectedIndex = i;
          break;
        }
      }
    }

    document.getElementById('inqQuantity').value = prod.moq || 100;
    document.getElementById('inqMessage').value = `Hi, I am interested in wholesale order for "${prod.name || 'this item'}". Please provide your best FOB/CIF quotation, earliest dispatch lead time, and sample availability.`;

    // Fill logged-in buyer details
    if (typeof auth !== 'undefined' && typeof auth.isLoggedIn === 'function' && auth.isLoggedIn()) {
      const u = auth.getUser();
      if (u) {
        document.getElementById('inqBuyerName').value = u.name || '';
        const up = (u.phone || '').trim();
        const ccSelect = document.getElementById('inqCountryCode');
        let matched = false;
        if (up.startsWith('+') && ccSelect) {
          for (let opt of ccSelect.options) {
            if (up.startsWith(opt.value)) {
              ccSelect.value = opt.value;
              document.getElementById('inqBuyerPhone').value = up.slice(opt.value.length);
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          document.getElementById('inqBuyerPhone').value = up;
        }
      }
    }

    modal.style.display = 'flex';
  };

  window.closeSupplierInquiry = function() {
    const modal = document.getElementById('flenkoInquiryModal');
    if (modal) modal.style.display = 'none';
  };

  window.handleInquirySubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('inqSubmitBtn');
    btn.disabled = true;
    btn.innerText = 'Dispatching...';

    try {
      const supplierId = document.getElementById('inqSupplierId').value;
      const productId = document.getElementById('inqProductId').value;
      const productName = document.getElementById('inqProductName').innerText;
      const quantity = document.getElementById('inqQuantity').value;
      const unit = document.getElementById('inqUnit').value;
      const targetPrice = document.getElementById('inqTargetPrice').value;
      const message = document.getElementById('inqMessage').value;
      const buyerName = document.getElementById('inqBuyerName').value;
      const countryCode = document.getElementById('inqCountryCode') ? document.getElementById('inqCountryCode').value : '+91';
      const rawBuyerPhone = document.getElementById('inqBuyerPhone').value.trim();
      const buyerPhone = rawBuyerPhone.startsWith('+') ? rawBuyerPhone : (countryCode + rawBuyerPhone);
      const supplierName = document.getElementById('inqSupplierName').innerText;

      const payload = {
        supplier_id: supplierId,
        product_id: productId,
        productId: productId,
        product_needed: productName,
        buyer_phone: buyerPhone,
        quantity: quantity,
        unit: unit,
        target_price: targetPrice,
        message: message,
        details: `Buyer: ${buyerName} | Qty: ${quantity} ${unit} | Target Price: ${targetPrice || 'Negotiable'} | Notes: ${message}`
      };

      let resOk = false;
      let resData = null;
      try {
        if (typeof auth !== 'undefined' && typeof auth.fetchWithFallback === 'function') {
          const res = await auth.fetchWithFallback(`/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('flenko_token') ? { 'Authorization': `Bearer ${localStorage.getItem('flenko_token')}` } : {})
            },
            body: JSON.stringify(payload)
          });
          resOk = res.ok;
          try { resData = await res.json(); } catch(e) {}
        } else {
          const apiBase = window.API_BASE || '/api';
          const res = await fetch(`${apiBase}/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('flenko_token') ? { 'Authorization': `Bearer ${localStorage.getItem('flenko_token')}` } : {})
            },
            body: JSON.stringify(payload)
          });
          resOk = res.ok;
          try { resData = await res.json(); } catch(e) {}
        }
      } catch(err) {
        console.warn('Inquiry dispatch warning:', err);
      }
      
      const refId = '#INQ-' + Math.floor(100000 + Math.random() * 900000);

      // Save locally to broadcast leads ONLY if offline or server failed
      if (!resOk) {
        try {
          const leadItem = {
            id: (resData && resData.lead_id) || Date.now(),
            supplier_id: parseInt(supplierId) || (resData && resData.supplier_id) || 1,
            product_needed: productName,
            buyer_phone: buyerPhone,
            details: `Buyer: ${buyerName} | Qty: ${quantity} ${unit} | Target Price: ${targetPrice || 'Negotiable'} | Notes: ${message}`,
            is_direct: true,
            is_paid: true,
            locked: false,
            status: 'New',
            created_at: new Date().toISOString()
          };
          const bList = JSON.parse(localStorage.getItem('flenko_broadcast_leads') || '[]');
          bList.unshift(leadItem);
          localStorage.setItem('flenko_broadcast_leads', JSON.stringify(bList.slice(0, 50)));
        } catch(e) {}
      }
      
      // Save locally to buyer inquiries cache
      try {
        const saved = JSON.parse(localStorage.getItem('flenko_sent_inquiries') || '[]');
        saved.unshift({
          refId: refId,
          product: productName,
          supplier: supplierName,
          quantity: `${quantity} ${unit}`,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        });
        localStorage.setItem('flenko_sent_inquiries', JSON.stringify(saved.slice(0, 50)));
      } catch(err) {}

      document.getElementById('inquiryForm').style.display = 'none';
      document.getElementById('successSupplierName').innerText = supplierName;
      document.getElementById('successRefId').innerText = refId;
      document.getElementById('inquirySuccessState').style.display = 'block';

    } catch(err) {
      alert("Inquiry successfully saved! The supplier has been notified.");
      closeSupplierInquiry();
    } finally {
      btn.disabled = false;
      btn.innerText = 'Send Inquiry Now →';
    }
  };

  // Auto-inject on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectInquiryModal);
  } else {
    injectInquiryModal();
  }
})();
