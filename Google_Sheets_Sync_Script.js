/**
 * ==============================================================================
 * FLENKO B2B PLATFORM - GOOGLE SHEETS SELLER AUTO-SYNC SCRIPT
 * ==============================================================================
 * 
 * 📌 SETUP INSTRUCTIONS (5 Simple Steps):
 * ------------------------------------------------------------------------------
 * 1. Open Google Sheets (https://sheets.google.com) and create a new blank sheet.
 * 2. Click top menu: "Extensions" > "Apps Script".
 * 3. Delete any default code in the editor, and PASTE this entire script.
 * 4. Click the Save icon (💾) at the top.
 * 5. Click top-right button: "Deploy" > "New deployment".
 *    - Click the Gear icon (⚙️) next to "Select type" and select "Web app".
 *    - Description: "Flenko Seller Sync"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (IMPORTANT: select Anyone so Flenko can sync)
 * 6. Click "Deploy", approve permissions, and COPY the Web App URL (ends in /exec).
 * 7. Open Flenko Admin Dashboard > Settings > Paste the Webhook URL > Click Save!
 * 
 * Done! Now all sellers are synced automatically whenever they register or update.
 * ==============================================================================
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = e.postData.contents;
    var data = JSON.parse(contents);

    // 1. Handle Products Sync to a separate "Products" Tab
    if (data.type === 'products_sync' || (data.products && Array.isArray(data.products))) {
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet) {
        prodSheet = ss.insertSheet("Products");
      }
      var pHeaders = [
        "Product ID", "Supplier ID", "Supplier Phone", "Product Name", "Price (INR)",
        "Category", "MOQ", "Unit", "Country", "Image URL", "Stock Quantity", "Last Updated"
      ];
      if (prodSheet.getLastRow() === 0) {
        prodSheet.appendRow(pHeaders);
        var pHeaderRange = prodSheet.getRange(1, 1, 1, pHeaders.length);
        pHeaderRange.setFontWeight("bold");
        pHeaderRange.setBackground("#0F4C9B");
        pHeaderRange.setFontColor("#FFFFFF");
        prodSheet.setFrozenRows(1);
        prodSheet.autoResizeColumns(1, pHeaders.length);
      }
      var prods = data.products || [];
      var pRows = prodSheet.getDataRange().getValues();
      for (var pi = 0; pi < prods.length; pi++) {
        var p = prods[pi];
        var pRowData = [
          p.id || "",
          p.supplier_id || "",
          p.supplier_phone || "",
          p.name || "",
          p.price || "",
          p.category || "General B2B",
          p.moq || 1,
          p.unit || "Pieces",
          p.country || "India",
          p.image_url || "",
          p.stock_quantity || 500,
          new Date().toLocaleString()
        ];
        var pTargetName = String(p.name || "").trim().toLowerCase();
        var pTargetSupp = String(p.supplier_id || "").trim();
        var pFoundRow = -1;
        for (var pr = 1; pr < pRows.length; pr++) {
          if (String(pRows[pr][0]).trim() === String(p.id) || 
             (String(pRows[pr][1]).trim() === pTargetSupp && String(pRows[pr][3]).trim().toLowerCase() === pTargetName)) {
            pFoundRow = pr + 1;
            break;
          }
        }
        if (pFoundRow > 0) {
          prodSheet.getRange(pFoundRow, 1, 1, pRowData.length).setValues([pRowData]);
        } else {
          prodSheet.appendRow(pRowData);
          pRows.push(pRowData);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: prods.length,
        type: "products_synced"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Handle Sellers Sync (Default Sheet or "Sellers" tab)
    var sheet = ss.getSheetByName("Sellers") || ss.getActiveSheet();
    
    // Standard Column Headers
    var headers = [
      "Seller ID", "Business Name", "Owner Name", "Phone / Mobile", "Email",
      "Business Type", "Category", "Year Established", "GST Number", "City",
      "Country", "Address", "Membership Plan", "Paid Verified", "Website URL",
      "Products Count", "About", "Registered At", "Last Updated"
    ];
    
    // Automatically create and format header row if sheet is brand new
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0F4C9B");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setHorizontalAlignment("center");
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
        
        // Match existing seller by ID, Phone (last 10 digits), or Email
        if ((targetId && rowId === targetId) ||
            (targetPhone && targetPhone.length >= 10 && rowPhone.endsWith(targetPhone.slice(-10))) ||
            (targetEmail && rowEmail === targetEmail)) {
          foundRow = r + 1; // 1-indexed row number in Google Sheets
          break;
        }
      }
      
      if (foundRow > 0) {
        // Update existing row in-place
        sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Append brand new row at the bottom
        sheet.appendRow(rowData);
        rows.push(rowData);
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
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    if (action === 'get_all_products' || action === 'export_products') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var prodSheet = ss.getSheetByName("Products");
      if (!prodSheet || prodSheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          count: 0,
          products: []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var pData = prodSheet.getDataRange().getValues();
      var products = [];
      for (var pr = 1; pr < pData.length; pr++) {
        var prow = pData[pr];
        if (!prow[3]) continue;
        products.push({
          id: prow[0] || pr,
          supplier_id: prow[1] || 1,
          supplier_phone: prow[2] || "",
          name: prow[3],
          price: prow[4] !== "" ? prow[4] : null,
          category: prow[5] || "General B2B",
          moq: prow[6] || 1,
          unit: prow[7] || "Pieces",
          country: prow[8] || "India",
          image_url: prow[9] || "assets/images/logo.png",
          stock_quantity: prow[10] || 500
        });
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: products.length,
        products: products
      })).setMimeType(ContentService.MimeType.JSON);
    }
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var sellers = [];
      if (data && data.length > 1) {
        for (var r = 1; r < data.length; r++) {
          var row = data[r];
          if (!row[0] && !row[1] && !row[3]) continue;
          sellers.push({
            seller_id: row[0],
            company_name: row[1],
            owner_name: row[2],
            phone: row[3],
            email: row[4],
            business_type: row[5],
            category: row[6],
            year_est: row[7],
            gst_number: row[8],
            city: row[9],
            country: row[10],
            address: row[11],
            subscription: row[12],
            is_paid_trusted: row[13],
            website_url: row[14],
            products_count: row[15],
            about: row[16],
            registered_at: row[17],
            last_updated: row[18]
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        count: sellers.length,
        sellers: sellers
      })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {}

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Flenko Seller Sync Webhook",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
