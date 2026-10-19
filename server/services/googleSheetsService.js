const db = require('../database/db');

// Cache webhook url in memory to reduce DB calls, but re-check every minute
let cachedWebhookUrl = null;
let lastCacheTime = 0;

async function getWebhookUrl() {
  const now = Date.now();
  if (cachedWebhookUrl !== null && (now - lastCacheTime < 60000)) {
    return cachedWebhookUrl;
  }
  try {
    const res = await db.query('SELECT setting_value FROM platform_settings WHERE setting_key = $1', ['google_sheet_webhook_url']);
    if (res.rows && res.rows.length > 0 && res.rows[0].setting_value) {
      cachedWebhookUrl = res.rows[0].setting_value.trim();
      lastCacheTime = now;
      return cachedWebhookUrl;
    }
  } catch(e) {}
  
  cachedWebhookUrl = (process.env.GOOGLE_SHEET_WEBHOOK_URL || '').trim();
  lastCacheTime = now;
  return cachedWebhookUrl;
}

async function saveWebhookUrl(url) {
  const cleanUrl = (url || '').trim();
  cachedWebhookUrl = cleanUrl;
  lastCacheTime = Date.now();
  try {
    await db.query(`
      INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP) 
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
    `, ['google_sheet_webhook_url', cleanUrl]);
  } catch(e) {
    // Fallback for mockDB or without ON CONFLICT
    try {
      const existing = await db.query('SELECT setting_value FROM platform_settings WHERE setting_key = $1', ['google_sheet_webhook_url']);
      if (existing.rows && existing.rows.length > 0) {
        await db.query('UPDATE platform_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2', [cleanUrl, 'google_sheet_webhook_url']);
      } else {
        await db.query('INSERT INTO platform_settings (setting_key, setting_value) VALUES ($1, $2)', ['google_sheet_webhook_url', cleanUrl]);
      }
    } catch(err2) {
      console.warn('Could not persist google_sheet_webhook_url to DB:', err2.message);
    }
  }
  return cleanUrl;
}

async function getLastSyncTime() {
  try {
    const res = await db.query('SELECT setting_value FROM platform_settings WHERE setting_key = $1', ['google_sheet_last_sync']);
    if (res.rows && res.rows.length > 0) {
      return res.rows[0].setting_value;
    }
  } catch(e) {}
  return null;
}

async function setLastSyncTime() {
  const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  try {
    await db.query(`
      INSERT INTO platform_settings (setting_key, setting_value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP) 
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
    `, ['google_sheet_last_sync', nowStr]);
  } catch(e) {
    try {
      const existing = await db.query('SELECT setting_value FROM platform_settings WHERE setting_key = $1', ['google_sheet_last_sync']);
      if (existing.rows && existing.rows.length > 0) {
        await db.query('UPDATE platform_settings SET setting_value = $1, updated_at = CURRENT_TIMESTAMP WHERE setting_key = $2', [nowStr, 'google_sheet_last_sync']);
      } else {
        await db.query('INSERT INTO platform_settings (setting_key, setting_value) VALUES ($1, $2)', ['google_sheet_last_sync', nowStr]);
      }
    } catch(err2) {}
  }
  return nowStr;
}

function buildSellerRecord(user, business, productCount) {
  const u = user || {};
  const b = business || {};
  const sellerId = `FLK-SUP-${u.id || b.user_id || b.id || '0'}`;
  const isPaid = Boolean(
    b.is_paid_trusted === true || b.is_paid_trusted === 'true' ||
    u.is_paid_trusted === true ||
    (u.subscription && u.subscription !== 'free' && u.subscription !== 'basic')
  );

  const subdomain = b.subdomain || '';
  const websiteUrl = subdomain ? `https://flenko.com/site.html?store=${encodeURIComponent(subdomain)}` : '';

  let regDate = '';
  if (u.created_at) {
    try {
      regDate = new Date(u.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    } catch(e) {
      regDate = String(u.created_at);
    }
  } else if (b.created_at) {
    try {
      regDate = new Date(b.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    } catch(e) {
      regDate = String(b.created_at);
    }
  } else {
    regDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const rawBizName = (b.company_name || u.name || '').toString().trim();
  const rawOwnerName = (u.name || '').toString().trim();
  const cleanBizName = (rawBizName && !/^\d+$/.test(rawBizName)) ? rawBizName : 'Verified Supplier';
  const cleanOwnerName = (rawOwnerName && !/^\d+$/.test(rawOwnerName)) ? rawOwnerName : 'Verified Supplier';

  return {
    seller_id: sellerId,
    user_id: u.id || b.user_id,
    business_name: cleanBizName,
    owner_name: cleanOwnerName,
    phone: u.phone || '',
    email: u.email || '',
    business_type: b.business_type || 'Manufacturer & Wholesaler',
    category: b.category || 'General Industrial',
    year_est: b.year_est || '2015',
    gst_number: b.gst_number || 'Verified Entity',
    city: b.city || u.city || 'Industrial Hub',
    country: b.country || 'India',
    address: b.address || '',
    subscription: (u.subscription || 'free').toUpperCase(),
    is_paid_trusted: isPaid ? 'YES (Verified)' : 'NO',
    website_url: websiteUrl,
    subdomain: subdomain,
    products_count: typeof productCount === 'number' ? productCount : 0,
    about: b.about || '',
    registered_at: regDate,
    last_updated: nowStr
  };
}

async function syncSellerToGoogleSheet(sellerUserId) {
  if (!sellerUserId) return;
  try {
    const webhookUrl = await getWebhookUrl();
    if (!webhookUrl) {
      return { success: false, reason: 'no_webhook_configured' };
    }

    // 1. Fetch User
    const uRes = await db.query('SELECT * FROM users WHERE id = $1', [sellerUserId]);
    const user = (uRes.rows && uRes.rows.length > 0) ? uRes.rows[0] : null;

    // 2. Fetch Business
    const bRes = await db.query('SELECT * FROM businesses WHERE user_id = $1 OR id = $1', [sellerUserId]);
    const business = (bRes.rows && bRes.rows.length > 0) ? bRes.rows[0] : null;

    if (!user && !business) {
      return { success: false, reason: 'seller_not_found' };
    }

    // 3. Fetch Products Count
    let prodCount = 0;
    try {
      const pRes = await db.query('SELECT COUNT(*) as cnt FROM products WHERE supplier_id = $1', [sellerUserId]);
      prodCount = parseInt((pRes.rows && pRes.rows[0] && pRes.rows[0].cnt) || 0, 10);
    } catch(e) {}

    const record = buildSellerRecord(user || { id: sellerUserId, name: business.company_name }, business, prodCount);

    // 4. Send to Google Sheet Webhook
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(12000)
    });

    const text = await res.text();
    console.log(`📊 [Google Sheets Auto-Sync] Seller #${sellerUserId} synced. Status: ${res.status}`);
    return { success: true, status: res.status, response: text };
  } catch(err) {
    console.warn(`⚠️ [Google Sheets Auto-Sync] Error syncing seller #${sellerUserId}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function getAllSellersRecords() {
  // Query all users
  let users = [];
  try {
    const uRes = await db.query("SELECT * FROM users ORDER BY id ASC");
    users = uRes.rows || [];
  } catch(e) {}

  let businesses = [];
  try {
    const bRes = await db.query("SELECT * FROM businesses ORDER BY id ASC");
    businesses = bRes.rows || [];
  } catch(e) {}

  let prodCountsMap = {};
  try {
    const pRes = await db.query("SELECT supplier_id, COUNT(*) as cnt FROM products GROUP BY supplier_id");
    (pRes.rows || []).forEach(r => {
      prodCountsMap[r.supplier_id] = parseInt(r.cnt, 10);
    });
  } catch(e) {}

  const sellersList = [];
  const processedUserIds = new Set();

  // First, all users with role 'supplier'
  users.filter(u => u.role === 'supplier').forEach(u => {
    processedUserIds.add(u.id);
    const b = businesses.find(biz => biz.user_id == u.id) || null;
    const cnt = prodCountsMap[u.id] || 0;
    sellersList.push(buildSellerRecord(u, b, cnt));
  });

  // Second, any businesses whose user might not be role='supplier' yet
  businesses.forEach(b => {
    if (b.user_id && !processedUserIds.has(b.user_id)) {
      processedUserIds.add(b.user_id);
      const u = users.find(usr => usr.id == b.user_id) || { id: b.user_id, name: b.company_name, role: 'supplier' };
      const cnt = prodCountsMap[b.user_id] || prodCountsMap[b.id] || 0;
      sellersList.push(buildSellerRecord(u, b, cnt));
    }
  });

  return sellersList;
}

async function syncAllSellersToGoogleSheet() {
  const webhookUrl = await getWebhookUrl();
  if (!webhookUrl) {
    return { success: false, error: 'Google Sheet Webhook URL is not configured. Please paste your Apps Script URL in Platform Settings.' };
  }

  const sellers = await getAllSellersRecords();
  if (sellers.length === 0) {
    return { success: true, count: 0, message: 'No registered sellers found to sync.' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellers }),
      signal: AbortSignal.timeout(25000)
    });

    const responseText = await res.text();
    const lastSync = await setLastSyncTime();

    return {
      success: true,
      count: sellers.length,
      lastSync,
      status: res.status,
      response: responseText
    };
  } catch(err) {
    console.error('Error during batch Google Sheets sync:', err);
    return { success: false, error: err.message };
  }
}

function generateSellersCsv(sellers) {
  const headers = [
    'Seller ID', 'Business Name', 'Owner Name', 'Phone', 'Email',
    'Business Type', 'Category', 'Year Established', 'GST Number', 'City',
    'Country', 'Address', 'Membership Plan', 'Paid Verified', 'Website URL',
    'Products Count', 'About', 'Registered At', 'Last Updated'
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = [headers.map(escapeCell).join(',')];

  sellers.forEach(s => {
    const row = [
      s.seller_id,
      s.business_name,
      s.owner_name,
      s.phone,
      s.email,
      s.business_type,
      s.category,
      s.year_est,
      s.gst_number,
      s.city,
      s.country,
      s.address,
      s.subscription,
      s.is_paid_trusted,
      s.website_url,
      s.products_count,
      s.about,
      s.registered_at,
      s.last_updated
    ];
    rows.push(row.map(escapeCell).join(','));
  });

  // Return with UTF-8 BOM so Excel & Sheets open Hindi/Unicode cleanly
  return '\uFEFF' + rows.join('\r\n');
}

function getAppsScriptTemplate() {
  return `/**
 * ==============================================================================
 * FLENKO B2B PLATFORM - GOOGLE SHEETS SELLER AUTO-SYNC SCRIPT
 * ==============================================================================
 * How to setup:
 * 1. In your Google Sheet, click Extensions > Apps Script
 * 2. Delete any code in the editor, and paste this entire code.
 * 3. Click Deploy > New deployment.
 * 4. Select type: "Web app"
 * 5. Set Description: "Flenko Seller Sync"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone"
 * 8. Click Deploy, Authorize access, and COPY the Web App URL (ends with /exec).
 * 9. Paste that URL into Flenko Admin Dashboard > Settings > Google Sheets Setup.
 * ==============================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    var headers = [
      "Seller ID", "Business Name", "Owner Name", "Phone / Mobile", "Email",
      "Business Type", "Category", "Year Established", "GST Number", "City",
      "Country", "Address", "Membership Plan", "Paid Verified", "Website URL",
      "Products Count", "About", "Registered At", "Last Updated"
    ];
    
    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0F4C9B");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
    
    // Support single seller payload or batch array
    var sellers = [];
    if (Array.isArray(data)) {
      sellers = data;
    } else if (data.sellers && Array.isArray(data.sellers)) {
      sellers = data.sellers;
    } else {
      sellers = [data];
    }
    
    var rows = sheet.getDataRange().getValues();
    
    for (var i = 0; i < sellers.length; i++) {
      var s = sellers[i];
      var rowData = [
        s.seller_id || ("FLK-SUP-" + (s.user_id || "")),
        s.business_name || s.company_name || "",
        s.owner_name || s.name || "",
        s.phone || "",
        s.email || "",
        s.business_type || "",
        s.category || "",
        s.year_est || "",
        s.gst_number || "",
        s.city || "",
        s.country || "India",
        s.address || "",
        (s.subscription || "FREE").toUpperCase(),
        s.is_paid_trusted || "NO",
        s.website_url || "",
        (s.products_count !== undefined) ? s.products_count : 0,
        s.about || "",
        s.registered_at || new Date().toLocaleString(),
        new Date().toLocaleString()
      ];
      
      var targetId = String(s.seller_id || ("FLK-SUP-" + s.user_id)).trim();
      var targetPhone = String(s.phone || "").replace(/[^0-9]/g, '');
      var targetEmail = String(s.email || "").trim().toLowerCase();
      
      var foundRow = -1;
      for (var r = 1; r < rows.length; r++) {
        var rowId = String(rows[r][0]).trim();
        var rowPhone = String(rows[r][3]).replace(/[^0-9]/g, '');
        var rowEmail = String(rows[r][4]).trim().toLowerCase();
        
        if ((targetId && rowId === targetId) ||
            (targetPhone && targetPhone.length >= 10 && rowPhone.endsWith(targetPhone.slice(-10))) ||
            (targetEmail && rowEmail === targetEmail)) {
          foundRow = r + 1; // 1-indexed row in sheet
          break;
        }
      }
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
        rows.push(rowData); // Keep in-memory cache updated for next item in loop
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: sellers.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Flenko Seller Sync Webhook",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}

module.exports = {
  getWebhookUrl,
  saveWebhookUrl,
  getLastSyncTime,
  setLastSyncTime,
  buildSellerRecord,
  syncSellerToGoogleSheet,
  getAllSellersRecords,
  syncAllSellersToGoogleSheet,
  generateSellersCsv,
  getAppsScriptTemplate
};
