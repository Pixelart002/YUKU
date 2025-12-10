// js/pages/store.js

async function initStorePage() {
 console.log("Initializing Store Protocol...");
 
 // 1. Get Elements (Mapped strictly to your HTML IDs)
 const els = {
  loading: document.getElementById('store-loading'),
  createView: document.getElementById('create-store-view'),
  dashboardView: document.getElementById('store-dashboard-view'),
  form: document.getElementById('createStoreForm'),
  
  // Dashboard Output Fields
  dashName: document.getElementById('dash-store-name'),
  dashSlug: document.getElementById('dash-store-slug'),
  dashCat: document.getElementById('dash-store-category'),
  dashDate: document.getElementById('dash-store-date'),
  dashDesc: document.getElementById('dash-store-desc'),
  dashLink: document.getElementById('dash-store-link')
 };
 
 // 2. View Switcher Helper
 const showView = (viewName) => {
  // Hide all first
  els.loading.classList.add('hidden');
  els.createView.classList.add('hidden');
  els.dashboardView.classList.add('hidden');
  
  // Show specific view
  if (viewName === 'loading') els.loading.classList.remove('hidden');
  if (viewName === 'create') els.createView.classList.remove('hidden');
  if (viewName === 'dashboard') els.dashboardView.classList.remove('hidden');
 };
 
 // 3. Initial Fetch: Check if store exists
 try {
  const token = window.app.getAuthToken();
  const response = await fetch(`${window.app.config.API_BASE_URL}/store/my-store`, {
   method: 'GET',
   headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
   }
  });
  
  if (response.status === 200) {
   // Store Found -> Render Dashboard
   const data = await response.json();
   renderDashboard(data);
  } else if (response.status === 404) {
   // No Store -> Show Create Form
   showView('create');
  } else {
   // Server Error -> Throw to catch block
   throw new Error(`Server Status: ${response.status}`);
  }
  
 } catch (error) {
  window.app.showAuthError(error.message);
 }
 
 // 4. Render Dashboard Function
 function renderDashboard(data) {
  showView('dashboard');
  
  // Populate Text Fields
  els.dashName.textContent = data.name;
  els.dashSlug.textContent = data.slug;
  els.dashCat.textContent = data.category || 'General';
  els.dashDesc.textContent = data.description || "No manifest details provided.";
  
  // Format Date
  const d = new Date(data.created_at);
  els.dashDate.textContent = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Update Link (This will now use the /pages/store.html?store=slug format sent by backend)
  els.dashLink.href = data.store_url || '#';
 }
 
 // 5. Handle Create Form Submit
 if (els.form) {
  els.form.addEventListener('submit', async (e) => {
   e.preventDefault();
   
   const btn = els.form.querySelector('button');
   
   // Gather Data from Inputs (IDs from your HTML)
   const payload = {
    name: document.getElementById('input-store-name').value,
    category: document.getElementById('input-store-category').value,
    description: document.getElementById('input-store-desc').value
   };
   
   const options = {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${window.app.getAuthToken()}`
    },
    body: JSON.stringify(payload)
   };
   
   // Use global handler (handles loading state on button automatically if configured, or we pass btn)
   const result = await window.app.handleApiRequest('store/create', options, btn);
   
   if (result) {
    Swal.fire({
     icon: 'success',
     title: 'NODE ESTABLISHED',
     text: 'Your store has been successfully deployed.',
     background: '#111',
     color: '#fff',
     confirmButtonColor: '#00ff7f'
    });
    
    // Immediately switch to dashboard with new data
    renderDashboard(result);
   }
  });
 }
}