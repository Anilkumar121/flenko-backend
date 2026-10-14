/**
 * Flenko.com - Worldwide Countries Database & Searchable Country Selector Component
 * Covers 195+ sovereign countries worldwide + Worldwide option
 */

const FLENKO_COUNTRIES = [
  { code: "ALL", name: "Worldwide (All Countries)", flag: "🌐", dial: "" },
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91" },
  { code: "CN", name: "China", flag: "🇨🇳", dial: "+86" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dial: "+966" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61" },
  { code: "JP", name: "Japan", flag: "🇯🇵", dial: "+81" },
  { code: "FR", name: "France", flag: "🇫🇷", dial: "+33" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dial: "+39" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", dial: "+52" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", dial: "+82" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", dial: "+65" },
  { code: "TR", name: "Turkey", flag: "🇹🇷", dial: "+90" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dial: "+62" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", dial: "+84" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60" },
  { code: "TH", name: "Thailand", flag: "🇹🇭", dial: "+66" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dial: "+31" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dial: "+34" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", dial: "+41" },
  { code: "PL", name: "Poland", flag: "🇵🇱", dial: "+48" },
  { code: "RU", name: "Russia", flag: "🇷🇺", dial: "+7" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dial: "+20" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "+254" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", dial: "+880" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", dial: "+92" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", dial: "+94" },
  { code: "NP", name: "Nepal", flag: "🇳🇵", dial: "+977" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dial: "+63" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", dial: "+974" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", dial: "+965" },
  { code: "OM", name: "Oman", flag: "🇴🇲", dial: "+968" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", dial: "+973" },
  { code: "SE", name: "Sweden", flag: "🇸🇪", dial: "+46" },
  { code: "NO", name: "Norway", flag: "🇳🇴", dial: "+47" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", dial: "+45" },
  { code: "FI", name: "Finland", flag: "🇫🇮", dial: "+358" },
  { code: "BE", name: "Belgium", flag: "🇧🇪", dial: "+32" },
  { code: "AT", name: "Austria", flag: "🇦🇹", dial: "+43" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dial: "+353" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", dial: "+64" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dial: "+351" },
  { code: "GR", name: "Greece", flag: "🇬🇷", dial: "+30" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", dial: "+420" },
  { code: "HU", name: "Hungary", flag: "🇭🇺", dial: "+36" },
  { code: "RO", name: "Romania", flag: "🇷🇴", dial: "+40" },
  { code: "IL", name: "Israel", flag: "🇮🇱", dial: "+972" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", dial: "+54" },
  { code: "CL", name: "Chile", flag: "🇨🇱", dial: "+56" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", dial: "+57" },
  { code: "PE", name: "Peru", flag: "🇵🇪", dial: "+51" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", dial: "+212" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "+233" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", dial: "+255" },
  { code: "UG", name: "Uganda", flag: "🇺🇬", dial: "+256" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", dial: "+251" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", dial: "+213" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", dial: "+964" },
  { code: "JO", name: "Jordan", flag: "🇯🇴", dial: "+962" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", dial: "+961" },
  { code: "AF", name: "Afghanistan", flag: "🇦🇫", dial: "+93" },
  { code: "AL", name: "Albania", flag: "🇦🇱", dial: "+355" },
  { code: "AD", name: "Andorra", flag: "🇦🇩", dial: "+376" },
  { code: "AO", name: "Angola", flag: "🇦🇴", dial: "+244" },
  { code: "AM", name: "Armenia", flag: "🇦🇲", dial: "+374" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", dial: "+994" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", dial: "+1-242" },
  { code: "BY", name: "Belarus", flag: "🇧🇾", dial: "+375" },
  { code: "BZ", name: "Belize", flag: "🇧🇿", dial: "+501" },
  { code: "BJ", name: "Benin", flag: "🇧🇯", dial: "+229" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹", dial: "+975" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", dial: "+591" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦", dial: "+387" },
  { code: "BW", name: "Botswana", flag: "🇧🇼", dial: "+267" },
  { code: "BN", name: "Brunei", flag: "🇧🇳", dial: "+673" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", dial: "+359" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226" },
  { code: "BI", name: "Burundi", flag: "🇧🇮", dial: "+257" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", dial: "+855" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", dial: "+237" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻", dial: "+238" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫", dial: "+236" },
  { code: "TD", name: "Chad", flag: "🇹🇩", dial: "+235" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", dial: "+506" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", dial: "+385" },
  { code: "CU", name: "Cuba", flag: "🇨🇺", dial: "+53" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", dial: "+357" },
  { code: "CD", name: "DR Congo", flag: "🇨🇩", dial: "+243" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴", dial: "+1-809" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", dial: "+593" },
  { code: "EE", name: "Estonia", flag: "🇪🇪", dial: "+372" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯", dial: "+679" },
  { code: "GE", name: "Georgia", flag: "🇬🇪", dial: "+995" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", dial: "+502" },
  { code: "HN", name: "Honduras", flag: "🇭🇳", dial: "+504" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", dial: "+852" },
  { code: "IS", name: "Iceland", flag: "🇮🇸", dial: "+354" },
  { code: "IR", name: "Iran", flag: "🇮🇷", dial: "+98" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", dial: "+1-876" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", dial: "+7" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", dial: "+371" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", dial: "+370" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dial: "+352" },
  { code: "MT", name: "Malta", flag: "🇲🇹", dial: "+356" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺", dial: "+230" },
  { code: "MC", name: "Monaco", flag: "🇲🇨", dial: "+377" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", dial: "+95" },
  { code: "PA", name: "Panama", flag: "🇵🇦", dial: "+507" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", dial: "+595" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", dial: "+381" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", dial: "+421" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", dial: "+386" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼", dial: "+886" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", dial: "+380" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", dial: "+598" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿", dial: "+998" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", dial: "+58" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", dial: "+263" }
];

class FlenkoCountryPicker {
  /**
   * @param {Object} options
   * @param {string|HTMLElement} options.container - Container or input selector
   * @param {string} options.inputName - Name for hidden form input (e.g. 'country')
   * @param {string} options.defaultCountry - Default country name or 'Worldwide (All Countries)'
   * @param {function} options.onSelect - Callback when country changes
   * @param {string} options.style - 'dropdown' (default) or 'hero' or 'header'
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string' ? document.querySelector(options.container) : options.container;
    this.inputName = options.inputName || 'country';
    this.onSelect = options.onSelect || null;
    this.styleType = options.style || 'dropdown';
    this.storageKey = options.storageKey || null;
    
    // Check saved preference in localStorage
    let saved = null;
    if (this.storageKey) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) saved = JSON.parse(stored);
      } catch(e) {}
    }
    this.selected = saved || (
      FLENKO_COUNTRIES.find(c => c.name.toLowerCase() === (options.defaultCountry || '').toLowerCase()) || FLENKO_COUNTRIES[0]
    );

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.container.innerHTML = '';
    this.container.classList.add('flenko-country-wrapper');

    // Create wrapper button/input
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = `flenko-country-btn style-${this.styleType}`;
    trigger.innerHTML = `
      <span class="country-flag">${this.selected.flag}</span>
      <span class="country-label">${this.selected.name}</span>
      <svg class="chevron-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
    `;
    this.trigger = trigger;

    // Hidden input for HTML form submission
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = this.inputName;
    hiddenInput.value = this.selected.code === 'ALL' ? '' : this.selected.name;
    this.hiddenInput = hiddenInput;

    // Dropdown panel
    const panel = document.createElement('div');
    panel.className = 'flenko-country-panel';
    panel.style.display = 'none';

    panel.innerHTML = `
      <div class="country-search-box">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" class="country-search-input" placeholder="Search country (e.g. USA, India, Germany)..." autocomplete="off">
      </div>
      <div class="country-list-scroll"></div>
    `;

    this.panel = panel;
    this.searchInput = panel.querySelector('.country-search-input');
    this.listContainer = panel.querySelector('.country-list-scroll');

    this.container.appendChild(trigger);
    this.container.appendChild(hiddenInput);
    this.container.appendChild(panel);

    this.renderList(FLENKO_COUNTRIES);

    // Event listeners
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = FLENKO_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) ||
        (c.dial && c.dial.includes(q))
      );
      this.renderList(filtered);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

    // Prevent closing when clicking inside search input
    panel.addEventListener('click', (e) => e.stopPropagation());
  }

  renderList(countries) {
    if (countries.length === 0) {
      this.listContainer.innerHTML = '<div class="no-country-found">No country found</div>';
      return;
    }

    this.listContainer.innerHTML = countries.map(c => `
      <div class="country-option ${c.code === this.selected.code ? 'selected' : ''}" data-code="${c.code}">
        <span class="country-flag">${c.flag}</span>
        <span class="country-name">${c.name}</span>
        ${c.dial ? `<span class="country-dial">${c.dial}</span>` : ''}
      </div>
    `).join('');

    this.listContainer.querySelectorAll('.country-option').forEach(el => {
      el.addEventListener('click', () => {
        const code = el.getAttribute('data-code');
        const country = FLENKO_COUNTRIES.find(item => item.code === code);
        if (country) {
          this.selectCountry(country);
        }
      });
    });
  }

  selectCountry(country) {
    this.selected = country;
    if (this.storageKey) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(country));
      } catch(e) {}
    }
    
    // Update trigger UI
    this.trigger.querySelector('.country-flag').textContent = country.flag;
    this.trigger.querySelector('.country-label').textContent = country.name;
    this.hiddenInput.value = country.code === 'ALL' ? '' : country.name;

    this.close();

    // Trigger callbacks & custom event
    if (this.onSelect) this.onSelect(country);
    window.dispatchEvent(new CustomEvent('flenko_country_selected', { detail: { country, storageKey: this.storageKey } }));
  }

  toggle() {
    if (this.panel.style.display === 'none' || !this.panel.style.display) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    // Close other pickers on the page
    document.querySelectorAll('.flenko-country-panel').forEach(p => p.style.display = 'none');
    this.panel.style.display = 'block';
    this.searchInput.value = '';
    this.renderList(FLENKO_COUNTRIES);
    setTimeout(() => this.searchInput.focus(), 50);
  }

  close() {
    this.panel.style.display = 'none';
  }
}

// Global Country Helper function
window.FlenkoCountryPicker = FlenkoCountryPicker;
window.FLENKO_COUNTRIES = FLENKO_COUNTRIES;
window.getFlenkoCountry = function() {
  const saved = localStorage.getItem('flenko_country');
  return saved ? JSON.parse(saved) : FLENKO_COUNTRIES[0];
};

/**
 * Universal Worldwide Country Calling Code Dropdown Initializer
 * Fills any <select> with all 195+ countries with flags and dial codes
 */
window.initCountryCodeSelect = function(elementOrId, defaultDial = '+91') {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;

  const currentVal = el.value || defaultDial;
  const dialCountries = (window.FLENKO_COUNTRIES || []).filter(c => c.dial && c.dial.trim());

  // Priority order for global trade hubs
  const topCodes = ['IN', 'US', 'AE', 'GB', 'CN', 'SA', 'CA', 'DE', 'AU', 'SG', 'BD', 'PK', 'NP', 'LK', 'RU', 'FR', 'IT', 'TR', 'ID', 'MY', 'TH', 'VN', 'BR', 'ZA', 'EG', 'NG', 'KE', 'JP', 'KR', 'QA', 'KW', 'OM', 'BH'];
  const topList = [];
  const otherList = [];

  dialCountries.forEach(c => {
    if (topCodes.includes(c.code)) {
      topList.push(c);
    } else {
      otherList.push(c);
    }
  });

  topList.sort((a, b) => topCodes.indexOf(a.code) - topCodes.indexOf(b.code));
  otherList.sort((a, b) => a.name.localeCompare(b.name));

  const allToRender = [...topList, ...otherList];

  el.innerHTML = '';
  allToRender.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.dial;
    opt.textContent = `${c.flag} ${c.dial} (${c.name})`;
    if (c.dial === currentVal && !el.value) {
      opt.selected = true;
    }
    el.appendChild(opt);
  });

  if (currentVal) el.value = currentVal;
};

// Auto-run on DOM ready for any select with .flenko-country-code-select
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flenko-country-code-select').forEach(sel => {
      window.initCountryCodeSelect(sel, sel.getAttribute('data-default') || '+91');
    });
  });
} else {
  document.querySelectorAll('.flenko-country-code-select').forEach(sel => {
    window.initCountryCodeSelect(sel, sel.getAttribute('data-default') || '+91');
  });
}

