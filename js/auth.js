// Flenko Authentication & API Client

const API_BASE = 'https://flenko-backend.onrender.com/api';

const auth = {
  setToken(token) {
    localStorage.setItem('flenko_token', token);
  },
  getToken() {
    return localStorage.getItem('flenko_token');
  },
  logout() {
    localStorage.removeItem('flenko_token');
    window.location.href = 'index.html';
  },
  async login(phone, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    return res.json();
  },
  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async requestOtp(phone) {
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return res.json();
  },
  async verifyOtp(payload) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async getProfile() {
    const token = this.getToken();
    if (!token) return null;
    
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) this.logout();
      return null;
    }
    return res.json();
  },
  async getLeads() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/leads`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  async getBuyerLeads() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/buyer/leads`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  async getProducts() {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },
  async addProduct(formData) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return res.json();
  },
  async editProduct(id, formData) {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    return res.json();
  }
};

// Check auth state on load and update UI
document.addEventListener('DOMContentLoaded', async () => {
  const token = auth.getToken();
  if (token) {
    try {
      const data = await auth.getProfile();
      if (data && data.user) {
        // Update header logic
        const loginBtn = document.querySelector('.header-actions .action-item:first-child');
        if (loginBtn) {
          loginBtn.innerHTML = `
            <small>Welcome back</small>
            <strong>${data.user.name}</strong>
          `;
          loginBtn.onclick = () => {
             if (data.user.role === 'admin') {
               window.location.href = 'admin-dashboard.html';
             } else if (data.user.role === 'supplier') {
               window.location.href = 'supplier-dashboard.html';
             } else {
               window.location.href = 'buyer-dashboard.html';
             }
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
});
