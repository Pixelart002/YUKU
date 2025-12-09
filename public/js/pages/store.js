// js/pages/store.js

async function initStorePage() {
 console.log("Initializing Store Protocol...");
 
 // 1. Get Elements
 const els = {
  loading: document.getElementById('store-loading'),
  createView: document.getElementById('create-store-view'),
  dashboardView: document.getElementById('store-dashboard-view'),
  form: document.getElementById('createStoreForm'),
  
  // Dashboard Fields
  name: document.getElementById('dash-store-name'),
  slug: document.getElementById('dash-store-slug'),
  cat: document.getElementById('dash-store-category'),
  date: document.getElementById('dash-store-date'),
  desc: document.getElementById('dash-store-desc'),
  link: document.getElementById('dash-store-link')
 };
 
 // 2. Initial Fetch: Check if store exists
 // We use a manual fetch here to handle the 404 (Not Found) gracefully
 // without triggering a global error alert.
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
   // Store Found -> Show Dashboard
   const data = await response.json();
   renderDashboard(data);
  } else if (response.status === 404) {
   // No Store -> Show Create Form
   showCreateView();
  } else {
   // Other Error (500 etc) -> Show global error
   throw new Error(`Server Status: ${response.status}`);
  }
  
 } catch (error) {
  window.app.showAuthError(error.message);
 }
 
 // 3. Helper Functions to Switch Views
 function showCreateView() {
  els.loading.classList.add('hidden');
  els.createView.classList.remove('hidden');
 }
 
 function renderDashboard(data) {
  els.loading.classList.add('hidden');
  els.dashboardView.classList.remove('hidden');
  
  // Populate Data
  els.name.textContent = data.name;
  els.slug.textContent = data.slug;
  els.cat.textContent = data.category;
  els.desc.textContent = data.description || "No manifest details provided.";
  
  const d = new Date(data.created_at);
  els.date.textContent = d.toLocaleDateString() + " " + d.toLocaleTimeString();
  
  // Update Link (Assuming your backend runs on port 8000 or similar for testing)
  // You might need to adjust the URL base depending on where your frontend store is hosted
  els.link.href = data.store_url;
 }
 
 // 4. Handle Create Form Submit
 els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const btn = els.form.querySelector('button');
  
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
  
  // Use the global handler for creation (so we get nice error alerts if validation fails)
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
   // Switch to Dashboard immediately
   els.createView.classList.add('hidden');
   renderDashboard(result);
  }
 });
}