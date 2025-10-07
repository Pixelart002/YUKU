   <script>
        document.addEventListener('DOMContentLoaded', () => {
            let authToken = null;
            const app = {
                // SNIPPET 1: Paste this right after `const app = {`
                // ===========================================
                urlBase64ToUint8Array(base64String) {
                    const padding = '='.repeat((4 - base64String.length % 4) % 4);
                    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
                    const rawData = window.atob(base64);
                    const outputArray = new Uint8Array(rawData.length);
                    for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                    }
                    return outputArray;
                },
                
                async subscribeUserToPush() {
                    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                        throw new Error('Push notifications are not supported by this browser.');
                    }
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    const permission = await Notification.requestPermission();
                    if (permission !== 'granted') {
                        throw new Error('Notification permission was not granted.');
                    }
                    const response = await fetch(`${this.config.API_BASE_URL}/webpush/vapid-public-key`);
                    if (!response.ok) {
                        throw new Error('Failed to get VAPID key from server.');
                    }
                    const { public_key } = await response.json();
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(public_key)
                    });
                    await fetch(`${this.config.API_BASE_URL}/webpush/subscribe`, {
                        method: 'POST',
                        body: JSON.stringify(subscription),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        }
                    });
                    alert('Notifications have been enabled successfully!');
                },
                // ===========================================
                
                
                
                
                
                
                
                
                
                config: {
                    API_BASE_URL: 'https://open-feliza-pixelart002-78fb4fe8.koyeb.app'
                },
                elements: {
                    authPage: document.getElementById('auth-page'),
                    dashboardPage: document.getElementById('dashboard-page'),
                    loginForm: document.getElementById('login-form'),
                    loginFormAction: document.getElementById('loginFormAction'),
                    signupForm: document.getElementById('signup-form'),
                    signupFormAction: document.getElementById('signupFormAction'),
                    forgotPasswordForm: document.getElementById('forgot-password-form'),
                    forgotPasswordFormAction: document.getElementById('forgotPasswordFormAction'),
                    showForgotPasswordBtn: document.getElementById('show-forgot-password'),
                    backToLoginBtn: document.getElementById('back-to-login'),
                    showSignupBtn: document.getElementById('show-signup'),
                    showLoginBtn: document.getElementById('show-login'),
                    logoutBtn: document.getElementById('logoutBtn'),
                    authErrorBox: document.getElementById('auth-error-box'),
                    hamburgerBtn: document.getElementById('hamburgerBtn'),
                    closeBtn: document.getElementById('closeBtn'),
                    sidebar: document.getElementById('sidebar'),
                    overlay: document.getElementById('overlay'),
                    navLinks: document.querySelectorAll('.nav-link'),
                    contentPanels: document.querySelectorAll('.content-panel'),
                    headerTitle: document.getElementById('header-title'),
                    profileContainer: document.getElementById('profile-container'),
                    profileBtn: document.getElementById('profile-btn'),
                    profilePopup: document.getElementById('profile-popup'),
                    profileInitials: document.getElementById('profile-initials'),
                    popupName: document.getElementById('popup-name'),
                    popupEmail: document.getElementById('popup-email'),
                    timestamp: document.getElementById('timestamp'),
                },
                
                
                
                
                
                
                init() {
                    this.addEventListeners();
                    this.updateTimestamp();
                    setInterval(() => this.updateTimestamp(), 1000);
                },
                
                addEventListeners() {
                    const { elements } = this;
                    elements.signupFormAction.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleSignup();
                    });
                    elements.loginFormAction.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleLogin();
                    });
                    elements.logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showAuthPage();
                    });
                    elements.showSignupBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms('signup');
                    });
                    elements.showLoginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms('login');
                    });
                    elements.showForgotPasswordBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms('forgot');
                    });
                    elements.backToLoginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleAuthForms('login');
                    });
                    elements.forgotPasswordFormAction.addEventListener('submit', (e) => {
                        e.preventDefault();
                        this.handleForgotPassword();
                    });
                    elements.hamburgerBtn.addEventListener('click', () => this.openSidebar());
                    elements.closeBtn.addEventListener('click', () => this.closeSidebar());
                    elements.overlay.addEventListener('click', () => this.closeSidebar());
                    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeSidebar(); });
                    elements.navLinks.forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.navigateTo(link.getAttribute('data-page'));
                            if (window.innerWidth < 768) this.closeSidebar();
                        });
                    });
                    elements.profileBtn.addEventListener('mouseenter', () => this.showProfilePopup());
                    elements.profileBtn.addEventListener('mouseleave', () => this.hideProfilePopup());
                    elements.profileBtn.addEventListener('click', () => { this.navigateTo('profile'); if (window.innerWidth < 768) this.closeSidebar(); });
                },
                // Replace your old function with this one
                
                
                async handleApiRequest(endpoint, body, button) {
                    if (button) button.disabled = true;
                    this.elements.authErrorBox.classList.add('hidden');
                    try {
                        const response = await fetch(`${this.config.API_BASE_URL}/${endpoint}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        });
                        const data = await response.json();
                        if (!response.ok) { throw new Error(data.detail || 'An unknown error occurred.'); }
                        return data;
                    } catch (error) {
                        this.showAuthError(error.message);
                        return null;
                    } finally {
                        if (button) button.disabled = false;
                    }
                },
                
                async handleSignup() {
                    const button = this.elements.signupFormAction.querySelector('button');
                    const fullname = document.getElementById('signup-fullname').value;
                    const username = document.getElementById('signup-username').value;
                    const email = document.getElementById('signup-email-address').value;
                    const password = document.getElementById('signup-password').value;
                    const result = await this.handleApiRequest('signup', { fullname, username, email, password }, button);
                    if (result) { this.handleLogin(email, password); }
                },
                
                async handleLogin(emailOverride = null, passwordOverride = null) {
                    const button = this.elements.loginFormAction.querySelector('button');
                    const email = emailOverride || document.getElementById('login-email-address').value;
                    const password = passwordOverride || document.getElementById('login-password').value;
                    const result = await this.handleApiRequest('login', { email, password }, button);
                    if (result && result.user) {
                        authToken = result.token.access_token;
                        localStorage.setItem('authToken', authToken);
                        this.updateUserInfo(result.user);
                        this.showDashboard('yuku-ai');
                    }
                },
                
                async handleForgotPassword() {
                    const button = this.elements.forgotPasswordFormAction.querySelector('button');
                    const email = document.getElementById('forgot-email-input').value;
                    const messageEl = document.getElementById('forgot-message');
                    messageEl.textContent = 'Processing...';
                    messageEl.style.color = 'var(--text-secondary)';
                    const result = await this.handleApiRequest('forgot-password', { email }, button);
                    if (result) {
                        messageEl.textContent = result.message;
                        messageEl.style.color = 'var(--accent-green)';
                    } else {
                        messageEl.textContent = 'Failed. Please check the error message above.';
                        messageEl.style.color = 'red';
                    }
                },
                
                updateUserInfo(user) {
                    const { fullname, email, username, userId } = user;
                    const initials = fullname ? fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '';
                    this.elements.profileInitials.textContent = initials;
                    this.elements.popupName.textContent = fullname;
                    const popupUsernameEl = document.getElementById('popup-username');
                    if (popupUsernameEl && username) {
                        popupUsernameEl.textContent = `@${username}`;
                    } else if (popupUsernameEl) {
                        popupUsernameEl.textContent = '';
                    }
                    this.elements.popupEmail.textContent = email;
                },
                
                showAuthError(message) {
                    this.elements.authErrorBox.textContent = `[ERROR]: ${message}`;
                    this.elements.authErrorBox.classList.remove('hidden');
                },
                
                showDashboard(defaultPage) {
                    this.elements.authErrorBox.classList.add('hidden');
                    this.elements.authPage.classList.replace('page-visible', 'page-hidden');
                    this.elements.dashboardPage.classList.replace('page-hidden', 'page-visible');
                    this.navigateTo(defaultPage);
                },
                
                showAuthPage() {
                    authToken = null;
                    localStorage.removeItem('authToken');
                    this.closeSidebar();
                    this.updateUserInfo({ fullname: '', email: '' });
                    this.elements.loginFormAction.reset();
                    this.elements.signupFormAction.reset();
                    this.elements.forgotPasswordFormAction.reset();
                    setTimeout(() => {
                        this.elements.dashboardPage.classList.replace('page-visible', 'page-hidden');
                        this.elements.authPage.classList.replace('page-hidden', 'page-visible');
                    }, 300);
                },
                
                updateTimestamp() {
                    this.elements.timestamp.textContent = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                },
                
                // SNIPPET 2: PURANE navigateTo FUNCTION KO ISSE REPLACE KAREIN
                async navigateTo(pageId) {
                    
                    // Pehle active link aur header title set karein
                    let activeLinkText = '';
                    this.elements.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-page') === pageId) {
                            link.classList.add('active');
                            activeLinkText = link.textContent.trim();
                        }
                    });
                    this.elements.headerTitle.textContent = activeLinkText;
                    
                    // Saare content panels hide karein
                    this.elements.contentPanels.forEach(p => p.classList.remove('active'));
                    
                    const contentContainer = document.getElementById(`${pageId}-content`);
                    if (!contentContainer) {
                        console.error(`Content container for page '${pageId}' not found.`);
                        return;
                    }
                    
                   
                    
                    
                    
                    
                    try {
                        // Agar profile page hai, to seedhe data fetch karein
                        if (pageId === 'profile') {
                            await this.fetchAndDisplayProfile();
                            contentContainer.classList.add('active');
                            return; // Yahan se return ho jaayein
                        }
                        
                        
     // Find your 'admin-notify' block inside the navigateTo function and REPLACE it with this:

if (pageId === 'admin-notify') {
    try {
        const response = await fetch(`pages/admin-notify.html`);
        if (!response.ok) throw new Error(`Could not load page: ${response.statusText}`);
        const html = await response.text();
        contentContainer.innerHTML = html;

        const sendBtn = contentContainer.querySelector('#send-custom-notif-btn');
        const statusEl = contentContainer.querySelector('#notif-status');

        sendBtn.addEventListener('click', () => {
            const targetEmail = contentContainer.querySelector('#target-email').value;
            const title = contentContainer.querySelector('#notif-title').value;
            const body = contentContainer.querySelector('#notif-body').value;
            const imageUrl = contentContainer.querySelector('#image-url').value; // Get image URL

            if (!title || !body) {
                statusEl.textContent = '[ERROR]: Title and Body are required.';
                statusEl.className = 'text-red-400';
                return;
            }

            const isBroadcast = !targetEmail.trim();
            const endpoint = isBroadcast ? 'broadcast' : 'send-custom';
            
            // Build the payload dynamically
            let payload = { title, body };
            if (!isBroadcast) {
                payload.target_email = targetEmail;
            }
            if (imageUrl.trim()) {
                payload.image = imageUrl; // Add image to payload
            }

            statusEl.textContent = 'Dispatching notification...';
            statusEl.className = 'text-yellow-400';

            fetch(`${this.config.API_BASE_URL}/webpush/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.detail || 'Request failed');
                statusEl.textContent = data.message || 'Dispatch successful!';
                statusEl.className = 'text-green-400';
            })
            .catch(err => {
                statusEl.textContent = `[ERROR]: ${err.message}`;
                statusEl.className = 'text-red-400';
            });
        });

    } catch (err) {
        contentContainer.innerHTML = `<p class="text-red-400">Error loading admin panel: ${err.message}</p>`;
    }
    contentContainer.classList.add('active');
    return;
}
                   
                        
                        
                        // Baaki pages ke liye HTML file fetch karein
                        const response = await fetch(`pages/${pageId}.html`);
                        if (!response.ok) {
                            throw new Error(`Could not load page: ${response.statusText}`);
                        }
                        const html = await response.text();
                        
                        // Fetched HTML ko container mein daalein
                        contentContainer.innerHTML = html;
                        contentContainer.classList.add('active');
                        
                        
                        // HTML load hone ke baad event listeners attach karein
                        if (pageId === 'yuku-ai') {
                            document.getElementById('ai-execute-btn').addEventListener('click', () => this.handleAiQuery());
                        }
                        if (pageId === 'settings') {
                            const enableBtn = document.getElementById('enable-notifications-btn');
                            if (enableBtn) {
                                enableBtn.addEventListener('click', () => {
                                    this.subscribeUserToPush().catch(err => {
                                        console.error('Failed to subscribe:', err);
                                        alert(`Error: ${err.message}`);
                                    });
                                });
                            }
                                          
                        }
        
                    } catch (error) {
                        console.error('Failed to navigate:', error);
                        contentContainer.innerHTML = `<p class="text-red-400 text-center">[ERROR]: Could not load content for this page.</p>`;
                        contentContainer.classList.add('active');
                    }
                },
                async handleAiQuery() {
                    const prompt = document.getElementById("ai-prompt-input").value;
                    const responseContainer = document.getElementById("ai-response-container");
                    const executeBtn = document.getElementById("ai-execute-btn");
                    if (!prompt.trim()) {
                        responseContainer.innerHTML = "<p class='text-yellow-400'>[ERROR: Directive cannot be empty.]</p>";
                        return;
                    }
                    if (!authToken) {
                        responseContainer.innerHTML = "<p class='text-red-500'>[ERROR: Authentication required. Please log in again.]</p>";
                        return;
                    }
                    executeBtn.disabled = true;
                    executeBtn.textContent = "Processing...";
                    responseContainer.innerHTML = "<div class='flex items-center space-x-2'><div class='w-4 h-4 rounded-full animate-pulse bg-accent-green'></div><p class='text-text-secondary'>[TRANSMITTING TO YUKU CORE...]</p></div>";
                    try {
                        const res = await fetch(`${this.config.API_BASE_URL}/ai/ask`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                            body: JSON.stringify({ prompt: prompt })
                        });
                        const data = await res.json();
                        if (!res.ok) { throw new Error(data.detail || `API call failed with status: ${res.status}`); }
                        const answer = data.response;
                        responseContainer.innerHTML = `<h5 class="font-orbitron text-accent-green">YUKU RESPONSE:</h5><p class="mt-2 whitespace-pre-wrap">${answer.trim()}</p>`;
                    } catch (error) {
                        console.error("AI Core Error:", error);
                        responseContainer.innerHTML = `<p class='text-red-500'>[CONNECTION FAILED]: ${error.message}</p>`;
                    } finally {
                        executeBtn.disabled = false;
                        executeBtn.textContent = "Execute";
                    }
                },
                
                toggleAuthForms(formToShow = 'login') {
                    this.elements.authErrorBox.classList.add("hidden");
                    const { loginForm, signupForm, forgotPasswordForm } = this.elements;
                    const allForms = [loginForm, signupForm, forgotPasswordForm];
                    allForms.forEach(form => {
                        if (form.id.startsWith(formToShow)) {
                            form.classList.replace("form-hidden", "form-visible");
                        } else {
                            form.classList.replace("form-visible", "form-hidden");
                        }
                    });
                },
                
                openSidebar() {
                    this.elements.sidebar.classList.remove('-translate-x-full');
                    this.elements.overlay.classList.remove('hidden');
                },
                closeSidebar() {
                    this.elements.sidebar.classList.add('-translate-x-full');
                    this.elements.overlay.classList.add('hidden');
                    this.hideProfilePopup();
                },
                showProfilePopup() {
                    this.elements.profilePopup.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
                },
                hideProfilePopup() {
                    this.elements.profilePopup.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                },
                
                
                
                async fetchAndDisplayProfile() {
                    const contentContainer = document.getElementById('profile-content');
                    if (!authToken) {
                        this.showAuthPage();
                        return;
                    }
                    try {
                        const response = await fetch(`${this.config.API_BASE_URL}/users/me`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });
                        if (response.status === 401) {
                            this.showAuthPage();
                            return;
                        }
                        if (!response.ok) { throw new Error('Failed to fetch agent dossier.'); }
                        const userData = await response.json();
                        this.updateUserInfo(userData);
                        contentContainer.innerHTML = `
                            <div class="glass-panel p-6 rounded-lg max-w-2xl mx-auto">
                                <h3 class="text-2xl font-orbitron text-accent-green mb-6">AGENT DOSSIER</h3>
                                <div class="space-y-4"> 
                                    <div>
                                        <p class="text-sm text-text-secondary">USERNAME</p>
                                        <p class="text-lg text-text-primary">@${userData.username}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-text-secondary">FULL NAME</p>
                                        <p class="text-lg text-text-primary">${userData.fullname}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-text-secondary">AGENT ID (EMAIL)</p>
                                        <p class="text-lg text-text-primary">${userData.email}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-text-secondary">USER ID</p>
                                        <p class="text-xs text-text-secondary">${userData.userId}</p>
                                    </div>
                                </div>
                                <div class="mt-6 text-center">
                                    <a href="/misc/update-profile.html" class="tactical-btn py-2 px-6 rounded-md">Edit Profile</a>
                                </div>
                            </div>`;
                    } catch (error) {
                        contentContainer.innerHTML = `<p class="text-red-500">[ERROR: ${error.message}]</p>`;
                    }
                },
            };
            
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                authToken = savedToken;
                app.fetchAndDisplayProfile();
                app.showDashboard('yuku-ai');
            }
            
            app.init();
        });
    </script>