// --- START: SNIPPET 3 ---
// Is poore code ko ek nayi file 'js/pages/store.js' mein paste karein

function initStorePage() {
        const container = document.getElementById('store-content');
        const authToken = window.app.getAuthToken();
        
        const renderCreateStoreForm = () => {
                container.innerHTML = `
            <div class="text-center max-w-lg mx-auto">
                <h2 class="text-3xl font-orbitron text-accent-green">Create Your YUKU Store</h2>
                <p class="text-text-secondary mt-2 mb-8">Claim your decentralized storefront on the YUKU Protocol.</p>
                <form id="create-store-form" class="glass-panel p-6 rounded-lg space-y-4">
                    <input type="text" id="store-name" required class="input-field w-full p-3" placeholder="Store Name">
                    <div class="flex items-center"><input type="text" id="store-subdomain" required class="input-field w-full p-3 rounded-l-md" placeholder="my-awesome-store"><span class="bg-gray-700 p-3 rounded-r-md">.yuku.app</span></div>
                    <button type="submit" class="tactical-btn w-full py-3">Create Store</button>
                    <p id="store-create-status" class="h-5 text-sm"></p>
                </form>
            </div>`;
                
                container.querySelector('#create-store-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const statusEl = container.querySelector('#store-create-status');
                        const name = container.querySelector('#store-name').value;
                        const subdomain = container.querySelector('#store-subdomain').value;
                        const button = e.target.querySelector('button');
                        
                        statusEl.textContent = "Creating...";
                        statusEl.className = 'text-yellow-400';
                        button.disabled = true;
                        
                        try {
                                const response = await fetch(`${window.app.config.API_BASE_URL}/stores/create`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                                        body: JSON.stringify({ name, subdomain })
                                });
                                const data = await response.json();
                                if (!response.ok) throw new Error(data.detail);
                                statusEl.textContent = data.message;
                                statusEl.className = 'text-green-500';
                                setTimeout(initStorePage, 2000);
                        } catch (err) {
                                statusEl.textContent = `[ERROR]: ${err.message}`;
                                statusEl.className = 'text-red-500';
                                button.disabled = false;
                        }
                });
        };
        
        const renderStoreAdmin = (store) => {
                container.innerHTML = `
            <div>
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-2 mb-8">
                    <h2 class="text-3xl font-orbitron text-accent-green">${store.name}</h2>
                    <a href="https://${store.subdomain}.yuku.app" target="_blank" class="text-text-secondary hover:text-accent-green break-all">${store.subdomain}.yuku.app ↗</a>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2">
                        <h3 class="text-xl font-orbitron mb-4">Inventory Management</h3>
                        <div id="product-list" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
                         <h3 class="text-xl font-orbitron mt-8 mb-4">Recent Orders (Billing)</h3>
                        <div id="orders-list" class="space-y-3"></div>
                    </div>
                    <div class="glass-panel p-6 rounded-lg h-fit">
                        <h4 class="font-orbitron text-lg text-accent-green mb-4">Add New Product</h4>
                        <form id="add-product-form" class="space-y-4"><input type="text" id="product-name" required class="input-field w-full p-2" placeholder="Product Name"><input type="number" id="product-price" required class="input-field w-full p-2" placeholder="Price ($)"><input type="number" id="product-stock" required class="input-field w-full p-2" placeholder="Stock Quantity"><input type="url" id="product-image" class="input-field w-full p-2" placeholder="Image URL (Optional)"><button type="submit" class="tactical-btn w-full py-2">Add Product</button><p id="add-product-status" class="h-5 text-sm"></p></form>
                    </div>
                </div>
            </div>`;
                
                const productList = container.querySelector('#product-list');
                if (store.products.length === 0) {
                        productList.innerHTML = '<p class="text-text-secondary sm:col-span-2">No products added yet. Use the form on the right to manage your inventory.</p>';
                } else {
                        store.products.forEach(p => {
                                const productEl = document.createElement('div');
                                productEl.className = 'glass-panel p-4 flex items-center gap-4 rounded-lg';
                                productEl.innerHTML = `<img src="${p.image_url || 'https://placehold.co/64x64/1a1a1a/444?text=IMG'}" class="w-16 h-16 rounded-md object-cover flex-shrink-0"><div class="flex-grow"><p class="font-bold truncate">${p.name}</p><p class="text-accent-green">$${p.price.toFixed(2)}</p><p class="text-xs text-text-secondary">Stock: ${p.stock_quantity}</p></div>`;
                                productList.appendChild(productEl);
                        });
                }
                
                const ordersList = container.querySelector('#orders-list');
                if (store.orders.length === 0) {
                        ordersList.innerHTML = '<p class="text-text-secondary">No recent orders.</p>';
                } else {
                        store.orders.forEach(o => {
                                const orderEl = document.createElement('div');
                                orderEl.className = 'glass-panel p-3 rounded-lg text-sm';
                                orderEl.innerHTML = `<div class="flex justify-between items-center"><p>${o.items.length} item(s) from <span class="font-bold text-text-primary">${o.customer_email}</span></p><p class="font-orbitron text-accent-green">$${o.total_amount.toFixed(2)}</p></div>`;
                                ordersList.appendChild(orderEl);
                        });
                }
                
                container.querySelector('#add-product-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const statusEl = container.querySelector('#add-product-status');
                        const newProduct = {
                                name: container.querySelector('#product-name').value,
                                price: parseFloat(container.querySelector('#product-price').value),
                                stock_quantity: parseInt(container.querySelector('#product-stock').value),
                                image_url: container.querySelector('#product-image').value || null
                        };
                        const button = e.target.querySelector('button');
                        statusEl.textContent = 'Adding...';
                        statusEl.className = 'text-yellow-400';
                        button.disabled = true;
                        try {
                                const response = await fetch(`${window.app.config.API_BASE_URL}/stores/mystore/products`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                                        body: JSON.stringify(newProduct)
                                });
                                const data = await response.json();
                                if (!response.ok) throw new Error(data.detail);
                                statusEl.textContent = data.message;
                                statusEl.className = 'text-green-500';
                                setTimeout(initStorePage, 1000);
                        } catch (err) {
                                statusEl.textContent = `[ERROR]: ${err.message}`;
                                statusEl.className = 'text-red-500';
                                button.disabled = false;
                        }
                });
        };
        
        const checkStoreExists = async () => {
                try {
                        const response = await fetch(`${window.app.config.API_BASE_URL}/stores/mystore`, {
                                headers: { 'Authorization': `Bearer ${authToken}` }
                        });
                        if (response.status === 404) {
                                renderCreateStoreForm();
                        } else if (response.ok) {
                                const storeData = await response.json();
                                renderStoreAdmin(storeData);
                        } else {
                                const err = await response.json();
                                throw new Error(err.detail || "Failed to check store status.");
                        }
                } catch (error) {
                        container.innerHTML = `<p class="text-red-500">${error.message}</p>`;
                }
        };
        
        checkStoreExists();
}
// --- END: SNIPPET 3 ---