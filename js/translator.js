/**
 * Flenko.com - Universal Multi-Language Translator (100+ Languages)
 * Real-Time AI Global Translation System for 190+ Countries
 */

(function () {
  const FLENKO_LANGUAGES = [
    // --- Top Global B2B Trading Languages ---
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', popular: true },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', popular: true },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', popular: true },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪', popular: true },
    { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳', popular: true },
    { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文', flag: '🇹🇼', popular: true },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', popular: true },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', popular: true },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', popular: true },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', popular: true },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', popular: true },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', popular: true },
    { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', popular: true },
    { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷', popular: true },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', popular: true },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', popular: true },
    { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭', popular: true },
    { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱', popular: true },
    { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', popular: true },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', popular: true },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', popular: true },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', popular: true },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', popular: true },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', popular: true },
    { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰', popular: true },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', popular: true },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', popular: true },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', popular: true },
    { code: 'fa', name: 'Persian', native: 'فارسی', flag: '🇮🇷', popular: true },

    // --- All Other Worldwide Sovereign Languages (100+) ---
    { code: 'af', name: 'Afrikaans', native: 'Afrikaans', flag: '🇿🇦' },
    { code: 'sq', name: 'Albanian', native: 'Shqip', flag: '🇦🇱' },
    { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' },
    { code: 'hy', name: 'Armenian', native: 'Հայերեն', flag: '🇦🇲' },
    { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'eu', name: 'Basque', native: 'Euskara', flag: '🇪🇸' },
    { code: 'be', name: 'Belarusian', native: 'Беларуская', flag: '🇧🇾' },
    { code: 'bs', name: 'Bosnian', native: 'Bosanski', flag: '🇧🇦' },
    { code: 'bg', name: 'Bulgarian', native: 'Български', flag: '🇧🇬' },
    { code: 'my', name: 'Burmese', native: 'မြန်မာ', flag: '🇲🇲' },
    { code: 'ca', name: 'Catalan', native: 'Català', flag: '🇪🇸' },
    { code: 'ceb', name: 'Cebuano', native: 'Binisaya', flag: '🇵🇭' },
    { code: 'hr', name: 'Croatian', native: 'Hrvatski', flag: '🇭🇷' },
    { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
    { code: 'da', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
    { code: 'eo', name: 'Esperanto', native: 'Esperanto', flag: '🌐' },
    { code: 'et', name: 'Estonian', native: 'Eesti', flag: '🇪🇪' },
    { code: 'tl', name: 'Filipino / Tagalog', native: 'Tagalog', flag: '🇵🇭' },
    { code: 'fi', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
    { code: 'gl', name: 'Galician', native: 'Galego', flag: '🇪🇸' },
    { code: 'ka', name: 'Georgian', native: 'ქართული', flag: '🇬🇪' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'ht', name: 'Haitian Creole', native: 'Kreyòl ayisyen', flag: '🇭🇹' },
    { code: 'ha', name: 'Hausa', native: 'Hausa', flag: '🇳🇬' },
    { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
    { code: 'hmn', name: 'Hmong', native: 'Hmoob', flag: '🇱🇦' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
    { code: 'is', name: 'Icelandic', native: 'Íslenska', flag: '🇮🇸' },
    { code: 'ig', name: 'Igbo', native: 'Asụsụ Igbo', flag: '🇳🇬' },
    { code: 'ga', name: 'Irish', native: 'Gaeilge', flag: '🇮🇪' },
    { code: 'jw', name: 'Javanese', native: 'Basa Jawa', flag: '🇮🇩' },
    { code: 'kk', name: 'Kazakh', native: 'Қазақ тілі', flag: '🇰🇿' },
    { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
    { code: 'ku', name: 'Kurdish', native: 'Kurdî', flag: '🇮🇶' },
    { code: 'ky', name: 'Kyrgyz', native: 'Кыргызча', flag: '🇰🇬' },
    { code: 'lo', name: 'Lao', native: 'ພາສາລາວ', flag: '🇱🇦' },
    { code: 'la', name: 'Latin', native: 'Latina', flag: '🇻🇦' },
    { code: 'lv', name: 'Latvian', native: 'Latviešu', flag: '🇱🇻' },
    { code: 'lt', name: 'Lithuanian', native: 'Lietuvių', flag: '🇱🇹' },
    { code: 'lb', name: 'Luxembourgish', native: 'Lëtzebuergesch', flag: '🇱🇺' },
    { code: 'mk', name: 'Macedonian', native: 'Македонски', flag: '🇲🇰' },
    { code: 'mg', name: 'Malagasy', native: 'Malagasy', flag: '🇲🇬' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'mt', name: 'Maltese', native: 'Malti', flag: '🇲🇹' },
    { code: 'mi', name: 'Maori', native: 'Māori', flag: '🇳🇿' },
    { code: 'mn', name: 'Mongolian', native: 'Монгол', flag: '🇲🇳' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
    { code: 'no', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
    { code: 'ps', name: 'Pashto', native: 'پښتو', flag: '🇦🇫' },
    { code: 'ro', name: 'Romanian', native: 'Română', flag: '🇷🇴' },
    { code: 'sm', name: 'Samoan', native: 'Fa\'asamoa', flag: '🇼🇸' },
    { code: 'gd', name: 'Scots Gaelic', native: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    { code: 'sr', name: 'Serbian', native: 'Српски', flag: '🇷🇸' },
    { code: 'st', name: 'Sesotho', native: 'Sesotho', flag: '🇱🇸' },
    { code: 'sn', name: 'Shona', native: 'chiShona', flag: '🇿🇼' },
    { code: 'sd', name: 'Sindhi', native: 'سنڌي', flag: '🇵🇰' },
    { code: 'si', name: 'Sinhala', native: 'සිංහල', flag: '🇱🇰' },
    { code: 'sk', name: 'Slovak', native: 'Slovenčina', flag: '🇸🇰' },
    { code: 'sl', name: 'Slovenian', native: 'Slovenščina', flag: '🇸🇮' },
    { code: 'so', name: 'Somali', native: 'Soomaaliga', flag: '🇸🇴' },
    { code: 'su', name: 'Sundanese', native: 'Basa Sunda', flag: '🇮🇩' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
    { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
    { code: 'tg', name: 'Tajik', native: 'Тоҷикӣ', flag: '🇹🇯' },
    { code: 'tt', name: 'Tatar', native: 'Татарча', flag: '🇷🇺' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
    { code: 'ug', name: 'Uyghur', native: 'ئۇيغۇرچە', flag: '🇨🇳' },
    { code: 'uz', name: 'Uzbek', native: 'Oʻzbekcha', flag: '🇺🇿' },
    { code: 'cy', name: 'Welsh', native: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    { code: 'xh', name: 'Xhosa', native: 'isiXhosa', flag: '🇿🇦' },
    { code: 'yi', name: 'Yiddish', native: 'ייִדיש', flag: '🇮🇱' },
    { code: 'yo', name: 'Yoruba', native: 'Èdè Yorùbá', flag: '🇳🇬' },
    { code: 'zu', name: 'Zulu', native: 'isiZulu', flag: '🇿🇦' }
  ];

  window.FLENKO_LANGUAGES = FLENKO_LANGUAGES;

  // Read current active language code from cookies or storage
  function getCurrentLanguageCode() {
    try {
      const match = document.cookie.match(/(^|;\s*)googtrans=([^;]+)/);
      if (match && match[2]) {
        const parts = decodeURIComponent(match[2]).split('/');
        const target = parts[parts.length - 1];
        if (target) return target;
      }
      const saved = localStorage.getItem('flenko_language_code');
      if (saved) return saved;
    } catch (e) {}
    return 'en';
  }

  function getLanguageObj(code) {
    return FLENKO_LANGUAGES.find(l => l.code === code) || FLENKO_LANGUAGES[0];
  }

  // Inject Google Translate Engine hidden element and CSS overrides
  function injectTranslateEngine() {
    if (document.getElementById('google_translate_element')) return;

    // 1. Google Translate container
    const container = document.createElement('div');
    container.id = 'google_translate_element';
    container.style.display = 'none';
    document.body.appendChild(container);

    // 2. Hide Google default frame bar & tooltips so site looks 100% native
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate,
      .goog-te-banner-frame,
      #goog-gt-tt,
      .goog-te-balloon-frame,
      .goog-tooltip,
      .goog-tooltip:hover {
        display: none !important;
        visibility: hidden !important;
      }
      body {
        top: 0px !important;
        position: static !important;
      }
      font {
        background-color: transparent !important;
        box-shadow: none !important;
      }
      .skiptranslate:not(.flenko-keep) {
        display: none !important;
      }

      /* Floating Global Language Button */
      .flenko-floating-lang-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99990;
        background: #0A2342;
        color: #ffffff;
        border: 2px solid #FF6B00;
        border-radius: 30px;
        padding: 8px 16px;
        font-size: 0.825rem;
        font-weight: 700;
        box-shadow: 0 10px 25px -5px rgba(10,35,66,0.4), 0 4px 6px -2px rgba(0,0,0,0.1);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .flenko-floating-lang-btn:hover {
        transform: translateY(-2px);
        background: #0F4C9B;
        box-shadow: 0 14px 28px -5px rgba(15,76,155,0.45);
      }

      /* Language Modal */
      .flenko-lang-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        box-sizing: border-box;
      }
      .flenko-lang-modal {
        background: #ffffff;
        border-radius: 16px;
        width: 100%;
        max-width: 680px;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3);
        border: 1px solid #cbd5e1;
        overflow: hidden;
        animation: flenkoLangPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes flenkoLangPop {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .flenko-lang-header {
        padding: 1.25rem 1.5rem 1rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #f8fafc;
      }
      .flenko-lang-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #0A2342;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .flenko-lang-search-box {
        padding: 0.85rem 1.5rem;
        border-bottom: 1px solid #f1f5f9;
        background: #ffffff;
      }
      .flenko-lang-search-input {
        width: 100%;
        padding: 0.65rem 1rem 0.65rem 2.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: 12px center;
      }
      .flenko-lang-search-input:focus {
        border-color: #FF6B00;
        box-shadow: 0 0 0 3px rgba(255,107,0,0.15);
      }
      .flenko-lang-body {
        padding: 1.25rem 1.5rem;
        overflow-y: auto;
        flex: 1;
      }
      .flenko-lang-section-title {
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.5px;
        margin-bottom: 0.75rem;
      }
      .flenko-lang-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }
      .flenko-lang-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.55rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.15s ease;
        text-align: left;
        font-size: 0.825rem;
        color: #1e293b;
        user-select: none;
      }
      .flenko-lang-pill:hover {
        background: #fff7ed;
        border-color: #FF6B00;
        color: #FF6B00;
      }
      .flenko-lang-pill.active {
        background: #0A2342;
        border-color: #0A2342;
        color: #ffffff;
        font-weight: 700;
      }
      .flenko-lang-pill.active .flenko-native-label {
        color: #94a3b8;
      }
      .flenko-native-label {
        font-size: 0.7rem;
        color: #64748b;
        display: block;
        line-height: 1.1;
      }
      .flenko-lang-flag {
        font-size: 1.15rem;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(style);

    // 3. Inject Google Translate JS SDK
    window.googleTranslateElementInit = function () {
      try {
        new google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            autoDisplay: false
          },
          'google_translate_element'
        );
      } catch (e) {}
    };

    const gScript = document.createElement('script');
    gScript.type = 'text/javascript';
    gScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gScript.async = true;
    document.body.appendChild(gScript);
  }

  // Set the translation language in Google Translate Engine
  function applyLanguage(langCode) {
    const lang = getLanguageObj(langCode);
    const domain = window.location.hostname;

    // Set cookies for Google Translate
    const cookieValue = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    if (domain && domain !== 'localhost' && !domain.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      document.cookie = `googtrans=${cookieValue}; domain=.${domain}; path=/;`;
    }
    localStorage.setItem('flenko_language_code', langCode);

    // Attempt direct trigger via Google combo
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // Reload page smoothly so engine applies cookie
      window.location.reload();
      return;
    }

    updateTriggerLabels(lang);
    closeTranslatorModal();
  }

  function resetToEnglish() {
    applyLanguage('en');
  }

  function updateTriggerLabels(lang) {
    document.querySelectorAll('.flenko-lang-display-name').forEach(el => {
      el.innerText = lang.code === 'en' ? 'English' : `${lang.name} (${lang.native})`;
    });
    document.querySelectorAll('.flenko-lang-display-flag').forEach(el => {
      el.innerText = lang.flag;
    });
    const floatBtn = document.getElementById('flenkoFloatingLangBtn');
    if (floatBtn) {
      floatBtn.innerHTML = `<span>${lang.flag}</span> <span>${lang.native || lang.name}</span> <span style="font-size:0.7rem; opacity:0.8;">▾</span>`;
    }
  }

  // Build the Language Modal Dialog
  function injectModal() {
    if (document.getElementById('flenkoLangModalBackdrop')) return;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'flenkoLangModalBackdrop';
    modalBackdrop.className = 'flenko-lang-modal-backdrop';
    modalBackdrop.style.display = 'none';

    modalBackdrop.innerHTML = `
      <div class="flenko-lang-modal">
        <div class="flenko-lang-header">
          <div class="flenko-lang-title">
            <span style="font-size:1.3rem;">🌐</span>
            <span>Select Language / भाषा चुनें / Seleccionar idioma</span>
          </div>
          <button type="button" onclick="window.closeFlenkoTranslatorModal()" style="background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:1.3rem; color:#64748b; cursor:pointer; line-height:1; display:flex; align-items:center; justify-content:center;">&times;</button>
        </div>

        <div class="flenko-lang-search-box">
          <input type="text" id="flenkoLangSearch" class="flenko-lang-search-input" placeholder="Search from 100+ languages (e.g. Hindi, Spanish, Arabic, German)..." autocomplete="off">
        </div>

        <div class="flenko-lang-body">
          <div id="flenkoPopularSection">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <div class="flenko-lang-section-title" style="margin:0;">🔥 Popular Global B2B Languages</div>
              <button type="button" onclick="window.flenkoResetLanguage()" style="background:none; border:none; font-size:0.75rem; color:#0F4C9B; font-weight:700; cursor:pointer; text-decoration:underline;">Reset to English (Default)</button>
            </div>
            <div class="flenko-lang-grid" id="flenkoPopularGrid"></div>
          </div>

          <div class="flenko-lang-section-title" style="margin-top:1rem;">🌍 All 100+ World Languages</div>
          <div class="flenko-lang-grid" id="flenkoAllGrid"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Search input handler
    const searchInput = document.getElementById('flenkoLangSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        renderLanguageGrids(q);
      });
    }

    // Close when clicking backdrop
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeTranslatorModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeTranslatorModal();
    });
  }

  function renderLanguageGrids(filterText = '') {
    const popGrid = document.getElementById('flenkoPopularGrid');
    const allGrid = document.getElementById('flenkoAllGrid');
    const popSection = document.getElementById('flenkoPopularSection');
    if (!popGrid || !allGrid) return;

    const currentCode = getCurrentLanguageCode();

    const matchesFilter = (l) => {
      if (!filterText) return true;
      return (
        l.name.toLowerCase().includes(filterText) ||
        l.native.toLowerCase().includes(filterText) ||
        l.code.toLowerCase().includes(filterText)
      );
    };

    // 1. Popular Grid
    if (filterText) {
      popSection.style.display = 'none';
    } else {
      popSection.style.display = 'block';
      const popLangs = FLENKO_LANGUAGES.filter(l => l.popular);
      popGrid.innerHTML = popLangs.map(l => `
        <div class="flenko-lang-pill ${l.code === currentCode ? 'active' : ''}" onclick="window.flenkoSelectLanguage('${l.code}')">
          <span class="flenko-lang-flag">${l.flag}</span>
          <div style="min-width:0; overflow:hidden;">
            <div style="font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${l.name}</div>
            <span class="flenko-native-label">${l.native}</span>
          </div>
        </div>
      `).join('');
    }

    // 2. All Grid
    const filteredAll = FLENKO_LANGUAGES.filter(matchesFilter);
    if (filteredAll.length === 0) {
      allGrid.innerHTML = `<div style="grid-column:1/-1; padding:2rem; text-align:center; color:#64748b;">No language found matching "${filterText}"</div>`;
      return;
    }

    allGrid.innerHTML = filteredAll.map(l => `
      <div class="flenko-lang-pill ${l.code === currentCode ? 'active' : ''}" onclick="window.flenkoSelectLanguage('${l.code}')">
        <span class="flenko-lang-flag">${l.flag}</span>
        <div style="min-width:0; overflow:hidden;">
          <div style="font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${l.name}</div>
          <span class="flenko-native-label">${l.native}</span>
        </div>
      </div>
    `).join('');
  }

  // Inject Floating Button for Instant Access on all devices
  function injectFloatingButton() {
    if (document.getElementById('flenkoFloatingLangBtn')) return;

    const currentCode = getCurrentLanguageCode();
    const lang = getLanguageObj(currentCode);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'flenkoFloatingLangBtn';
    btn.className = 'flenko-floating-lang-btn';
    btn.innerHTML = `<span>${lang.flag}</span> <span>${lang.native || lang.name}</span> <span style="font-size:0.7rem; opacity:0.8;">▾</span>`;
    btn.title = 'Translate Website into Any Language';
    btn.onclick = openTranslatorModal;

    document.body.appendChild(btn);
  }

  // Integrate with existing top-bar language links
  function wireHeaderLanguageButtons() {
    // Look for top bar language text (e.g., "🌐 Global Trade / English")
    document.querySelectorAll('.flenko-top-left, .site-header, header').forEach(container => {
      const spans = container.querySelectorAll('span, a');
      spans.forEach(el => {
        if (el.textContent && (el.textContent.includes('Global Trade') || el.textContent.includes('English') || el.textContent.includes('🌐'))) {
          if (!el.hasAttribute('data-lang-wired')) {
            el.setAttribute('data-lang-wired', 'true');
            el.style.cursor = 'pointer';
            el.title = 'Click to Translate into 100+ Languages';
            el.addEventListener('click', (e) => {
              e.preventDefault();
              openTranslatorModal();
            });
          }
        }
      });
    });
  }

  function openTranslatorModal() {
    injectModal();
    const backdrop = document.getElementById('flenkoLangModalBackdrop');
    if (backdrop) {
      renderLanguageGrids('');
      const search = document.getElementById('flenkoLangSearch');
      if (search) search.value = '';
      backdrop.style.display = 'flex';
      setTimeout(() => { if (search) search.focus(); }, 100);
    }
  }

  function closeTranslatorModal() {
    const backdrop = document.getElementById('flenkoLangModalBackdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  // Global window functions
  window.openFlenkoTranslatorModal = openTranslatorModal;
  window.closeFlenkoTranslatorModal = closeTranslatorModal;
  window.flenkoSelectLanguage = function (code) {
    applyLanguage(code);
  };
  window.flenkoResetLanguage = resetToEnglish;

  // Initialize on DOM Ready
  function initTranslator() {
    injectTranslateEngine();
    injectFloatingButton();
    wireHeaderLanguageButtons();

    // Check if a non-English language was previously saved
    const activeCode = getCurrentLanguageCode();
    if (activeCode && activeCode !== 'en') {
      const lang = getLanguageObj(activeCode);
      updateTriggerLabels(lang);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTranslator);
  } else {
    initTranslator();
  }
})();
