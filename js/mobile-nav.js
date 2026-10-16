/**
 * Flenko.com - Universal Mobile Bottom App Navigation Bar
 * Injects a native-feeling sticky bottom navigation bar on mobile screens (< 768px).
 * Dynamically highlights the current page and updates based on authentication state.
 */

(function() {
  'use strict';

  function initMobileBottomNav() {
    if (document.getElementById('flenkoMobileBottomNav')) return;

    // Detect current path
    const path = window.location.pathname.toLowerCase();
    const isHome = path.endsWith('index.html') || path.endsWith('/') || path === '';
    const isCat = path.includes('categories.html') || path.includes('products.html');
    const isRfq = path.includes('rfq.html');
    const isInq = path.includes('inquiries') || path.includes('supplier-leads.html');
    const isAuth = path.includes('login.html') || path.includes('dashboard') || path.includes('sell.html');

    // Check auth status
    let user = null;
    let isSupplierRole = false;
    let isAdminRole = false;
    let accountUrl = 'login.html';
    let accountLabel = 'Account';
    let accountIcon = '👤';
    let inquiriesUrl = 'login.html?redirect=buyer-dashboard.html?tab=inquiries';
    let storeUrl = 'supplier-dashboard.html';

    try {
      if (typeof auth !== 'undefined' && auth.getToken && auth.getToken()) {
        user = auth.getUser ? auth.getUser() : null;
        if (user) {
          if (user.role === 'admin') {
            isAdminRole = true;
            accountUrl = 'admin-dashboard.html';
            accountLabel = 'Admin';
            inquiriesUrl = 'admin-dashboard.html';
          } else if (user.role === 'supplier') {
            isSupplierRole = true;
            accountUrl = 'supplier-dashboard.html';
            accountLabel = 'Store';
            inquiriesUrl = 'supplier-leads.html';
            const sub = (user.business && user.business.subdomain) ? user.business.subdomain : null;
            storeUrl = sub ? ('site.html?store=' + encodeURIComponent(sub)) : 'supplier-dashboard.html';
          } else {
            accountUrl = 'buyer-dashboard.html';
            accountLabel = 'Buyer';
            inquiriesUrl = 'buyer-dashboard.html?tab=inquiries';
          }
        } else {
          accountUrl = 'buyer-dashboard.html';
          accountLabel = 'My Hub';
        }
      }
    } catch(e) {}

    const isSupplierPage = path.includes('supplier-');

    let navHtml = '';

    if (isSupplierPage) {
      // Specialized Seller Panel Bottom Navigation
      const isDash = path.includes('supplier-dashboard.html');
      const isLeads = path.includes('supplier-leads.html');
      const isProds = path.includes('supplier-products.html');
      const isProf = path.includes('supplier-profile.html');

      navHtml = `
        <nav class="flenko-mobile-bottom-nav" id="flenkoMobileBottomNav">
          <a href="supplier-dashboard.html" class="flenko-mobile-nav-item ${isDash ? 'active' : ''}">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>

          <a href="supplier-leads.html" class="flenko-mobile-nav-item ${isLeads ? 'active' : ''}">
            <span class="icon">✉️</span>
            <span>Leads CRM</span>
          </a>

          <a href="supplier-products.html" class="flenko-mobile-nav-item ${isProds ? 'active' : ''}">
            <span class="icon">📋</span>
            <span>Products</span>
          </a>

          <a href="supplier-profile.html" class="flenko-mobile-nav-item ${isProf ? 'active' : ''}">
            <span class="icon">💼</span>
            <span>Profile</span>
          </a>

          <a href="${storeUrl}" target="_blank" class="flenko-mobile-nav-item">
            <span class="icon">🌐</span>
            <span>My Store ↗</span>
          </a>
        </nav>
      `;
    } else {
      // Standard Buyer & Visitor Bottom Navigation
      navHtml = `
        <nav class="flenko-mobile-bottom-nav" id="flenkoMobileBottomNav">
          <a href="index.html" class="flenko-mobile-nav-item ${isHome ? 'active' : ''}">
            <span class="icon">🏠</span>
            <span>Home</span>
          </a>

          <a href="categories.html" class="flenko-mobile-nav-item ${isCat ? 'active' : ''}">
            <span class="icon">📂</span>
            <span>Categories</span>
          </a>

          <a href="rfq.html" class="flenko-mobile-nav-item rfq-highlight ${isRfq ? 'active' : ''}">
            <div class="rfq-badge">✉️</div>
            <span>Post RFQ</span>
          </a>

          <a href="${inquiriesUrl}" class="flenko-mobile-nav-item ${isInq ? 'active' : ''}">
            <span class="icon">💬</span>
            <span>Inquiries</span>
          </a>

          <a href="${accountUrl}" class="flenko-mobile-nav-item ${isAuth ? 'active' : ''}" id="flenkoMobileAccountItem">
            <span class="icon">${accountIcon}</span>
            <span id="flenkoMobileAccountText">${accountLabel}</span>
          </a>
        </nav>
      `;
    }

    document.body.insertAdjacentHTML('beforeend', navHtml);
  }

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileBottomNav);
  } else {
    initMobileBottomNav();
  }
})();
