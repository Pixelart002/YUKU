/**
 * STORE PAGE CONTROLLER
 * Handles Store Creation, Dashboard rendering, and API synchronization.
 */
window.initStorePage = async function() {
 console.log("🚀 Store Module: Initializing...");
 
 // --- 0. SAFETY UTILITIES ---
 // Prevents crash if UI is not fully loaded
 const safeToast = (msg, type) => {
  if (window.UI && window.UI.showToast) {
   window.UI.showToast(msg, type);
  } else {
   console.log(`[${type}] ${msg}`);
   if (type === 'error') alert(msg);
  }
 };
 
 // --- 1. DEPENDENCY CHECK ---
 if (!window.app) {
  console.error("❌ Critical: Main App not loaded.");
  return;
 }
 
 const API_BASE = window.app.config.API_BASE_URL;
 const token = window.app.getAuthToken();
 
 // --- 2. DOM ELEMENTS ---
 const loader = document.getElementById('store-loader');
 const createView = document.getElementById('view-create-store');
 const dashView = document.getElementById('view-dashboard-active');
 const createForm = document.getElementById('create-store-form');
 
 // --- 3. SAFETY TIMEOUT (FAILSAFE) ---
 // If API hangs for 8 seconds, force remove loader and show create view
 const failsafe = setTimeout(() => {
  if (loader && !loader.classList.contains('hidden')) {
   console.warn("⚠️ API Timeout: Forcing loader hide.");
   loader.classList.add('hidden');
   if (createView) createView.classList.remove('hidden');
   safeToast("Sync timed out. Offline mode active.", "error");
  }
 }, 8000);
 
 // --- 4. CORE FUNCTIONS ---
 
 /**
  * Fetch store status from Backend
  */
 async function checkStoreStatus() {
  if (!token) {
   console.warn("No auth token found.");
   clearTimeout(failsafe);
   if (loader) loader.classList.add('hidden');
   return;
  }
  
  console.log("📡 Syncing Store Data...");
  
  try {
   const res = await fetch(`${API_BASE}/store/my-store`, {
    method: 'GET',
    headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
    }
   });
   
   console.log(`Store API Status: ${res.status}`);
   
   if (res.status === 200) {
    // Store exists -> Load Dashboard
    const storeData = await res.json();
    renderDashboard(storeData);
   } else if (res.status === 404) {
    // No store found -> Show Create Form
    console.log("ℹ️ No store found. Initializing creation sequence.");
    switchView('create');
   } else if (res.status === 401) {
    // Auth Error
    safeToast("Session Expired", "error");
    window.app.logout();
   } else {
    throw new Error(`Server Error (${res.status})`);
   }
   
  } catch (e) {
   console.error("Store Sync Error:", e);
   // Only show toast if it's a real error, not just a 404 (expected for new users)
   if (!e.message.includes('404')) {
    safeToast("Data Sync Failed", "error");
   }
   switchView('create'); // Fallback to create view so page isn't blank
  } finally {
   // Stop Loader
   clearTimeout(failsafe);
   if (loader) loader.classList.add('hidden');
  }
 }
 
 /**
  * Switch visible view
  * @param {string} mode - 'create' or 'dashboard'
  */
 function switchView(mode) {
  if (mode === 'create') {
   if (createView) createView.classList.remove('hidden');
   if (dashView) dashView.classList.add('hidden');
  } else {
   if (createView) createView.classList.add('hidden');
   if (dashView) dashView.classList.remove('hidden');
  }
 }
 
 /**
  * Populate Dashboard UI
  */
 function renderDashboard(store) {
  switchView('dashboard');
  
  const nameEl = document.getElementById('dash-store-name');
  const linkEl = document.getElementById('dash-store-link');
  
  if (nameEl) nameEl.innerText = store.name || "My Store";
  
  if (linkEl && store.slug) {
   // Link to the Public Store Host page
   const origin = window.location.origin; // e.g. https://yuku-nine.vercel.app
   // IMPORTANT: Updated path to match your request
   const fullUrl = `${origin}/public/misc/store-host.html?store=${store.slug}`;
   
   linkEl.href = fullUrl;
   
   // Safe inner span update
   const span = linkEl.querySelector('span');
   if (span) {
    // Remove protocol for cleaner display text
    span.innerText = fullUrl.replace(origin, '...');
   }
  }
 }
 
 // --- 5. CREATE FORM HANDLER ---
 if (createForm) {
  createForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   
   const btn = createForm.querySelector('button[type="submit"]');
   const originalHTML = btn ? btn.innerHTML : "DEPLOY";
   
   // Lock UI
   if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> PROCESSING...`;
   }
   
   // Prepare Payload
   const nameInput = document.getElementById('store-name');
   const catInput = document.getElementById('store-category');
   const descInput = document.getElementById('store-desc');
   
   const payload = {
    name: nameInput ? nameInput.value.trim() : "",
    category: catInput ? catInput.value : "General",
    description: descInput ? descInput.value.trim() : ""
   };
   
   if (!payload.name) {
    safeToast("Store Name is required", "error");
    if (btn) {
     btn.disabled = false;
     btn.innerHTML = originalHTML;
    }
    return;
   }
   
   try {
    const res = await fetch(`${API_BASE}/store/create`, {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    
    if (res.ok) {
     safeToast("Store Deployed Successfully", "success");
     renderDashboard(data); // Instant switch to dashboard
    } else {
     throw new Error(data.detail || "Deployment Failed");
    }
   } catch (err) {
    console.error(err);
    safeToast(err.message || "Network Connection Failed", "error");
    if (btn) {
     btn.disabled = false;
     btn.innerHTML = originalHTML;
    }
   }
  });
 }
 
 // --- 6. EXECUTE ---
 checkStoreStatus();
};