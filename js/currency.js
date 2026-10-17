/**
 * Flenko Global Multi-Currency Conversion System
 * Supports 22+ Major World Currencies with Instant Dynamic Conversion
 */

(function(window) {
  'use strict';

  const CURRENCY_DATABASE = {
    'INR': { code: 'INR', symbol: '₹', rate: 1.0, flag: '🇮🇳', name: 'Indian Rupee', format: '₹{val}' },
    'USD': { code: 'USD', symbol: '$', rate: 1 / 86.5, flag: '🇺🇸', name: 'US Dollar', format: '${val}' },
    'EUR': { code: 'EUR', symbol: '€', rate: 0.92 / 86.5, flag: '🇪🇺', name: 'Euro', format: '€{val}' },
    'GBP': { code: 'GBP', symbol: '£', rate: 0.79 / 86.5, flag: '🇬🇧', name: 'British Pound', format: '£{val}' },
    'AED': { code: 'AED', symbol: 'AED', rate: 3.67 / 86.5, flag: '🇦🇪', name: 'UAE Dirham', format: 'AED {val}' },
    'SAR': { code: 'SAR', symbol: 'SAR', rate: 3.75 / 86.5, flag: '🇸🇦', name: 'Saudi Riyal', format: 'SAR {val}' },
    'CNY': { code: 'CNY', symbol: '¥', rate: 7.24 / 86.5, flag: '🇨🇳', name: 'Chinese Yuan', format: '¥{val}' },
    'CAD': { code: 'CAD', symbol: 'CA$', rate: 1.40 / 86.5, flag: '🇨🇦', name: 'Canadian Dollar', format: 'CA${val}' },
    'AUD': { code: 'AUD', symbol: 'AU$', rate: 1.55 / 86.5, flag: '🇦🇺', name: 'Australian Dollar', format: 'AU${val}' },
    'SGD': { code: 'SGD', symbol: 'S$', rate: 1.34 / 86.5, flag: '🇸🇬', name: 'Singapore Dollar', format: 'S${val}' },
    'JPY': { code: 'JPY', symbol: '¥', rate: 153.0 / 86.5, flag: '🇯🇵', name: 'Japanese Yen', format: '¥{val}' },
    'KRW': { code: 'KRW', symbol: '₩', rate: 1390.0 / 86.5, flag: '🇰🇷', name: 'South Korean Won', format: '₩{val}' },
    'QAR': { code: 'QAR', symbol: 'QAR', rate: 3.64 / 86.5, flag: '🇶🇦', name: 'Qatari Riyal', format: 'QAR {val}' },
    'KWD': { code: 'KWD', symbol: 'KWD', rate: 0.31 / 86.5, flag: '🇰🇼', name: 'Kuwaiti Dinar', format: 'KWD {val}' },
    'OMR': { code: 'OMR', symbol: 'OMR', rate: 0.38 / 86.5, flag: '🇴🇲', name: 'Omani Rial', format: 'OMR {val}' },
    'RUB': { code: 'RUB', symbol: '₽', rate: 96.0 / 86.5, flag: '🇷🇺', name: 'Russian Ruble', format: '{val} ₽' },
    'TRY': { code: 'TRY', symbol: '₺', rate: 34.5 / 86.5, flag: '🇹🇷', name: 'Turkish Lira', format: '₺{val}' },
    'BRL': { code: 'BRL', symbol: 'R$', rate: 5.75 / 86.5, flag: '🇧🇷', name: 'Brazilian Real', format: 'R${val}' },
    'ZAR': { code: 'ZAR', symbol: 'R', rate: 18.2 / 86.5, flag: '🇿🇦', name: 'South African Rand', format: 'R {val}' },
    'BDT': { code: 'BDT', symbol: '৳', rate: 120.0 / 86.5, flag: '🇧🇩', name: 'Bangladeshi Taka', format: '৳{val}' },
    'PKR': { code: 'PKR', symbol: '₨', rate: 278.0 / 86.5, flag: '🇵🇰', name: 'Pakistani Rupee', format: '₨{val}' },
    'NPR': { code: 'NPR', symbol: 'Rs', rate: 138.4 / 86.5, flag: '🇳🇵', name: 'Nepalese Rupee', format: 'Rs {val}' }
  };

  const currencyManager = {
    currencies: CURRENCY_DATABASE,

    getCurrencyCode() {
      try {
        const saved = localStorage.getItem('flenko_currency');
        if (saved && CURRENCY_DATABASE[saved]) return saved;
      } catch(e) {}
      return 'INR';
    },

    getCurrency() {
      const code = this.getCurrencyCode();
      return CURRENCY_DATABASE[code] || CURRENCY_DATABASE['INR'];
    },

    setCurrency(code) {
      if (!CURRENCY_DATABASE[code]) return;
      try {
        localStorage.setItem('flenko_currency', code);
      } catch(e) {}

      // Update all currency display badges
      this.updateDisplayBadges();

      // Trigger custom global event
      const event = new CustomEvent('flenko_currency_changed', {
        detail: CURRENCY_DATABASE[code]
      });
      window.dispatchEvent(event);

      // Close modal if open
      this.closeModal();

      // If page has applyFilters or renderHomepageProducts, re-render automatically
      if (typeof window.applyFilters === 'function') {
        window.applyFilters();
      } else if (typeof window.renderHomepageProducts === 'function') {
        window.renderHomepageProducts();
      }
    },

    convert(amountInInr, targetCode) {
      if (typeof amountInInr !== 'number' || isNaN(amountInInr)) return 0;
      const target = CURRENCY_DATABASE[targetCode || this.getCurrencyCode()] || CURRENCY_DATABASE['INR'];
      return amountInInr * target.rate;
    },

    format(amountInInr, opts = {}) {
      if (typeof amountInInr !== 'number' || isNaN(amountInInr) || amountInInr <= 0) {
        return '₹0';
      }
      const cur = this.getCurrency();
      const converted = amountInInr * cur.rate;

      let formattedNumber;
      if (cur.code === 'INR') {
        formattedNumber = Math.round(converted).toLocaleString('en-IN');
      } else if (converted < 10 && cur.code !== 'JPY' && cur.code !== 'KRW') {
        formattedNumber = converted.toFixed(2);
      } else if (converted < 1000) {
        formattedNumber = converted % 1 === 0 ? converted.toFixed(0) : converted.toFixed(2);
      } else {
        formattedNumber = Math.round(converted).toLocaleString('en-US');
      }

      return cur.format.replace('{val}', formattedNumber);
    },

    formatRange(minUsd, maxUsd) {
      if (typeof minUsd !== 'number' || isNaN(minUsd) || minUsd <= 0) {
        return `<span class="contact-rates-badge" style="background:#e0f2fe; color:#0284c7; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px;">💬 Contact supplier to get best rates</span>`;
      }
      if (maxUsd && maxUsd > minUsd) {
        return `${this.format(minUsd)} - ${this.format(maxUsd)}`;
      }
      return this.format(minUsd);
    },

    updateDisplayBadges() {
      const cur = this.getCurrency();
      document.querySelectorAll('.flenko-curr-code').forEach(el => el.textContent = cur.code);
      document.querySelectorAll('.flenko-curr-symbol').forEach(el => el.textContent = cur.symbol);
      document.querySelectorAll('.flenko-curr-flag').forEach(el => el.textContent = cur.flag);
      document.querySelectorAll('.flenko-curr-label').forEach(el => {
        el.textContent = `${cur.flag} ${cur.code} (${cur.symbol})`;
      });
    },

    renderTopBarPicker(containerSelector) {
      const el = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
      if (!el) return;

      const cur = this.getCurrency();
      el.innerHTML = `
        <span onclick="window.currencyManager.openModal()" style="cursor:pointer; display:inline-flex; align-items:center; gap:5px; padding:3px 8px; border-radius:4px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); font-size:0.82rem; transition:all 0.15s ease;" title="Change Currency">
          <span class="flenko-curr-flag">${cur.flag}</span>
          <span><span class="currency-label-prefix">Currency: </span><strong class="flenko-curr-code">${cur.code}</strong> (<span class="flenko-curr-symbol">${cur.symbol}</span>)</span>
          <span style="font-size:0.7rem; opacity:0.8;">▾</span>
        </span>
      `;
    },

    openModal() {
      let modal = document.getElementById('flenkoCurrencyModal');
      if (!modal) {
        this.injectModal();
        modal = document.getElementById('flenkoCurrencyModal');
      }
      if (modal) {
        modal.style.display = 'flex';
        const searchInput = document.getElementById('currencySearchInput');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
          this.filterCurrencies('');
        }
      }
    },

    closeModal() {
      const modal = document.getElementById('flenkoCurrencyModal');
      if (modal) modal.style.display = 'none';
    },

    filterCurrencies(q) {
      const query = (q || '').toLowerCase().trim();
      const listEl = document.getElementById('currencyModalGrid');
      if (!listEl) return;

      const currentCode = this.getCurrencyCode();
      const entries = Object.values(CURRENCY_DATABASE);
      const filtered = entries.filter(c => 
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
      );

      listEl.innerHTML = filtered.map(c => {
        const isSelected = c.code === currentCode;
        return `
          <button type="button" onclick="window.currencyManager.setCurrency('${c.code}')" style="display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-radius:8px; border:1px solid ${isSelected ? 'var(--color-flenko-orange, #f97316)' : '#e2e8f0'}; background:${isSelected ? '#fff7ed' : '#ffffff'}; cursor:pointer; text-align:left; transition:all 0.15s ease;">
            <span style="font-size:1.5rem; line-height:1;">${c.flag}</span>
            <div style="flex:1;">
              <div style="font-weight:700; font-size:0.92rem; color:#0f172a; display:flex; justify-content:space-between; align-items:center;">
                <span>${c.code} (${c.symbol})</span>
                ${isSelected ? '<span style="color:#f97316; font-size:0.8rem; font-weight:800;">✓ ACTIVE</span>' : ''}
              </div>
              <div style="font-size:0.75rem; color:#64748b;">${c.name}</div>
            </div>
          </button>
        `;
      }).join('');
    },

    injectModal() {
      if (document.getElementById('flenkoCurrencyModal')) return;

      const modalHtml = `
        <div id="flenkoCurrencyModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.65); z-index:999999; align-items:center; justify-content:center; padding:1rem; box-sizing:border-box; backdrop-filter:blur(3px);">
          <div style="background:#ffffff; border-radius:16px; width:100%; max-width:540px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.3); border:1px solid #cbd5e1; overflow:hidden; animation: currencyPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            
            <!-- Header -->
            <div style="padding:1.25rem 1.5rem; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
              <div>
                <h3 style="margin:0; font-size:1.15rem; color:#0f172a; display:flex; align-items:center; gap:0.5rem;">
                  <span>💱 Select Your Currency</span>
                </h3>
                <p style="margin:0.25rem 0 0; font-size:0.78rem; color:#64748b;">All wholesale product prices and RFQs will convert automatically</p>
              </div>
              <button type="button" onclick="window.currencyManager.closeModal()" style="background:#f1f5f9; border:none; font-size:1.4rem; color:#64748b; cursor:pointer; line-height:1; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;" title="Close">&times;</button>
            </div>

            <!-- Search box -->
            <div style="padding:0.85rem 1.5rem; border-bottom:1px solid #f1f5f9;">
              <div style="position:relative; display:flex; align-items:center;">
                <input type="text" id="currencySearchInput" placeholder="Search currency (e.g. INR, USD, EUR, AED, Pound, Rupee...)" oninput="window.currencyManager.filterCurrencies(this.value)" style="width:100%; padding:0.65rem 1rem 0.65rem 2.25rem; border-radius:8px; border:1px solid #cbd5e1; font-size:0.88rem; outline:none; box-sizing:border-box;">
                <span style="position:absolute; left:10px; color:#94a3b8; font-size:0.95rem; pointer-events:none;">🔍</span>
              </div>
            </div>

            <!-- Currencies List -->
            <div id="currencyModalGrid" style="padding:1rem 1.5rem; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:0.75rem; max-height:420px;">
              <!-- Dynamic items injected here -->
            </div>

            <!-- Footer -->
            <div style="padding:0.75rem 1.5rem; border-top:1px solid #f1f5f9; background:#f8fafc; display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#64748b;">
              <span>Rates are updated relative to international standard exchange rates</span>
              <button type="button" onclick="window.currencyManager.closeModal()" style="padding:0.4rem 0.85rem; background:#e2e8f0; border:none; border-radius:6px; font-weight:600; cursor:pointer; color:#334155;">Close</button>
            </div>
          </div>
        </div>

        <style>
          @keyframes currencyPopIn {
            from { transform: scale(0.96); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .flenko-floating-curr-btn {
            position: fixed;
            bottom: 24px;
            right: 195px;
            z-index: 99989;
            background: #0A2342;
            color: #ffffff;
            border: 2px solid #0284c7;
            border-radius: 30px;
            padding: 8px 14px;
            font-size: 0.825rem;
            font-weight: 700;
            box-shadow: 0 10px 25px -5px rgba(10,35,66,0.35);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
          }
          .flenko-floating-curr-btn:hover {
            transform: translateY(-2px);
            background: #0284c7;
            box-shadow: 0 14px 28px -5px rgba(2,132,199,0.45);
          }
          @media (max-width: 640px) {
            .flenko-floating-curr-btn {
              bottom: 74px;
              right: 20px;
            }
          }
        </style>
      `;

      const wrapper = document.createElement('div');
      wrapper.innerHTML = modalHtml;
      document.body.appendChild(wrapper);
    },

    injectFloatingButton() {
      if (document.getElementById('flenkoFloatingCurrencyBtn')) return;
      const cur = this.getCurrency();
      const btn = document.createElement('div');
      btn.id = 'flenkoFloatingCurrencyBtn';
      btn.className = 'flenko-floating-curr-btn';
      btn.innerHTML = `<span class="flenko-curr-flag">${cur.flag}</span> <span class="flenko-curr-code">${cur.code}</span> (<span class="flenko-curr-symbol">${cur.symbol}</span>) ▾`;
      btn.onclick = () => this.openModal();
      btn.setAttribute('title', 'Change Currency');
      document.body.appendChild(btn);
    },

    init() {
      this.injectModal();
      this.injectFloatingButton();
      this.updateDisplayBadges();

      // Render top bar picker if target element exists
      const topTarget = document.getElementById('topBarCurrencyPicker');
      if (topTarget) {
        this.renderTopBarPicker(topTarget);
      }
    }
  };

  // Expose globally
  window.currencyManager = currencyManager;

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => currencyManager.init());
  } else {
    currencyManager.init();
  }

})(window);
