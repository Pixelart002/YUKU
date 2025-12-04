document.addEventListener('DOMContentLoaded', () => {
    let authToken = null;
    
    const app = {
        currentPageScript: null,
        config: {
            API_BASE_URL: 'https://giant-noell-pixelart002-1c1d1fda.koyeb.app'
        },
        
        
        
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
        await navigator.serviceWorker.ready;
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
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });
    },
        
        
        elements: {
            authPage: document.getElementById('auth-page'),
            dashboardPage: document.getElementById('dashboard-page'),
            loginFormAction: document.getElementById('loginFormAction'),
            signupFormAction: document.getElementById('signupFormAction'),
            // START: YEH LINE ADD KAREIN
forgotPasswordFormAction: document.getElementById('forgotPasswordFormAction'),
// END: YEH LINE ADD KAREIN



            logoutBtn: document.getElementById('logoutBtn'),
            authErrorBox: document.getElementById('auth-error-box'),
            showSignupBtn: document.getElementById('show-signup'),
            showLoginBtn: document.getElementById('show-login'),
            
            
            // START: YEH DO LINES ADD KAREIN
showForgotPasswordBtn: document.getElementById('show-forgot-password'),
backToLoginBtn: document.getElementById('back-to-login'),
// END: YEH DO LINES ADD KAREIN


            hamburgerBtn: document.getElementById('hamburgerBtn'),
            closeBtn: document.getElementById('closeBtn'),
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('overlay'),
            navLinks: document.querySelectorAll('.nav-link'),
            contentPanels: document.querySelectorAll('.content-panel'),
            headerTitle: document.getElementById('header-title'),
            profileInitials: document.getElementById('profile-initials'),
            timestamp: document.getElementById('timestamp'),
            // START: YEH LINES ADD KAREIN
            headerActions: document.getElementById('header-actions'),
            profileBtn: document.getElementById('profile-btn'),
            profilePopup: document.getElementById('profile-popup'),
            popupName: document.getElementById('popup-name'),
            popupUsername: document.getElementById('popup-username'),
            popupEmail: document.getElementById('popup-email'),
            // END: YEH LINES ADD KAREIN
       
       
        },
        
        init() {
            this.addEventListeners();
            this.updateTimestamp();
            setInterval(() => this.updateTimestamp(), 1000);
            
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                authToken = savedToken;
                this.showDashboard('yuku-ai');
            }
        },
        
        addEventListeners() {
            this.elements.signupFormAction.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup();
            });
            this.elements.loginFormAction.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            
            
            
            
            
            // START: YEH LINES ADD KAREIN
this.elements.forgotPasswordFormAction.addEventListener('submit', (e) => { e.preventDefault(); this.handleForgotPassword(); });
this.elements.showForgotPasswordBtn.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthForms('forgot'); });
this.elements.backToLoginBtn.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthForms('login'); });
// END: YEH LINES ADD KAREIN
            
            
            
            this.elements.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAuthPage();
            });
            this.elements.showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForms('signup');
            });
            this.elements.showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAuthForms('login');
            });
            this.elements.hamburgerBtn.addEventListener('click', () => this.openSidebar());
            this.elements.closeBtn.addEventListener('click', () => this.closeSidebar());
            this.elements.overlay.addEventListener('click', () => this.closeSidebar());
            this.elements.navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.navigateTo(link.getAttribute('data-page'));
                    if (window.innerWidth < 768) this.closeSidebar();
                });
            });
            // START: YEH LINES ADD KAREIN
    this.elements.profileBtn.addEventListener('mouseenter', () => this.showProfilePopup());
    this.elements.profileBtn.addEventListener('mouseleave', () => this.hideProfilePopup());
    this.elements.profileBtn.addEventListener('click', () => { this.navigateTo('profile'); if (window.innerWidth < 768) this.closeSidebar(); });
    // END: YEH LINES ADD KAREIN
        },
        
        getAuthToken() {
            return authToken;
        },
        
        async navigateTo(pageId) {
            if (this.currentPageScript) {
                document.body.removeChild(this.currentPageScript);
                this.currentPageScript = null;
            }
            
            let activeLinkText = '';
            this.elements.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('active');
                    activeLinkText = link.textContent.trim();
                }
            });
            this.elements.headerTitle.textContent = activeLinkText;
            
            this.elements.contentPanels.forEach(p => p.classList.remove('active'));
            const contentContainer = document.getElementById(`${pageId}-content`);
            if (!contentContainer) return;
            
            if (pageId === 'profile') {
                await this.fetchAndDisplayProfile();
                contentContainer.classList.add('active');
                return;
            }
            
            try {
                const response = await fetch(`pages/${pageId}.html`);
                if (!response.ok) throw new Error(`Could not load page: ${response.statusText}`);
                const html = await response.text();
                contentContainer.innerHTML = html;
                contentContainer.classList.add('active');
                
                const scriptPath = `js/pages/${pageId}.js`;
                const scriptCheck = await fetch(scriptPath);
                
                if (scriptCheck.ok) {
                    const script = document.createElement('script');
                    script.src = scriptPath;
                    this.currentPageScript = script;
                    
                    script.onload = () => {
                        const functionName = 'init' + pageId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') + 'Page';
                        if (typeof window[functionName] === 'function') {
                            window[functionName]();
                        }
                    };
                    document.body.appendChild(script);
                }
            } catch (error) {
                contentContainer.innerHTML = `<p class="text-red-400 text-center">[ERROR]: Could not load content.</p>`;
                contentContainer.classList.add('active');
            }
        },
        
       // --- SNIPPET: Is poore function ko apne purane 'handleApiRequest' function se replace karein ---

async handleApiRequest(endpoint, options = {}, button = null) {
    if (button) button.disabled = true;
    this.elements.authErrorBox.classList.add('hidden');
    
    try {
        const response = await fetch(`${this.config.API_BASE_URL}/${endpoint}`, options);
        
        // Agar response successful nahi hai (e.g., status 422, 401, 500)
        if (!response.ok) {
            const errorData = await response.json().catch(() => {
                // Agar server se JSON mein error nahi aaya
                throw new Error(`Request failed with status: ${response.status}`);
            });
            
            // YEH HAI "ULTRA GOD MODE" LOGIC
            // Agar 'detail' ek array hai (validation errors ke liye)
            if (Array.isArray(errorData.detail)) {
                // Har error message ko extract karke ek line mein jodo
                const readableError = errorData.detail.map(err => err.msg).join('. ');
                throw new Error(readableError);
            }
            
            // Agar 'detail' ek simple string hai
            if (typeof errorData.detail === 'string') {
                throw new Error(errorData.detail);
            }
            
            throw new Error('An unknown error occurred.');
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            return { success: true };
        }
        
    } catch (error) {
        // Ab yahan hamesha ek readable error message hi aayega
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
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullname, username, email, password })
            };
            const result = await this.handleApiRequest('signup', options, button);
            if (result) {
                this.handleLogin(email, password);
            }
        },
        
        async handleLogin(emailOverride = null, passwordOverride = null) {
            const button = this.elements.loginFormAction.querySelector('button');
            const email = emailOverride || document.getElementById('login-email-address').value;
            const password = passwordOverride || document.getElementById('login-password').value;
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            };
            const result = await this.handleApiRequest('login', options, button);
            if (result && result.user) {
                authToken = result.token.access_token;
                localStorage.setItem('authToken', authToken);
                this.updateUserInfo(result.user);
                this.showDashboard('yuku-ai');
            }
        },
        
       
// --- SNIPPET: Is function ko apne purane 'handleAiQuery' function se replace karein ---
        async handleAiQuery(body) {
            const executeBtn = document.getElementById("ai-execute-btn");
            if (executeBtn) executeBtn.disabled = true;

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(body) // Stringify the JSON body
            };

            // /ai/ask endpoint par call karne ke liye handleApiRequest ka istemaal karein
            const result = await this.handleApiRequest('ai/ask', options, executeBtn);
            
            if (executeBtn) executeBtn.disabled = false;
            return result; // handleApiRequest error ko handle karega
        }, 
        // Is poore function ko apne purane 'updateUserInfo' function se replace karein
updateUserInfo(user) {
    const { fullname, username, email } = user;
    const initials = fullname ? fullname.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
    
    this.elements.profileInitials.textContent = initials;
    this.elements.popupName.textContent = fullname || '';
    this.elements.popupUsername.textContent = username ? `@${username}` : '';
    this.elements.popupEmail.textContent = email || '';
},
        
        // --- SNIPPET 1: ISSE REPLACE KAREIN ---
showAuthError(error) {
    let errorMessage = 'An unknown error occurred.'; // Default message
    
    if (typeof error === 'string') {
        // Agar error pehle se hi ek string hai
        errorMessage = error;
    } else if (error instanceof Error) {
        // Agar yeh ek standard JavaScript Error object hai
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
        // Agar yeh ek custom object hai, to uske andar se message dhoondhein
        errorMessage = error.detail || error.message || JSON.stringify(error);
    }
    
    this.elements.authErrorBox.textContent = `[ERROR]: ${errorMessage}`;
    this.elements.authErrorBox.classList.remove('hidden');
},
        
        showDashboard(defaultPage) {
            this.fetchAndDisplayProfile();
            this.elements.authPage.classList.replace('page-visible', 'page-hidden');
            this.elements.dashboardPage.classList.replace('page-hidden', 'page-visible');
            this.navigateTo(defaultPage);
            
            
            
    // DASHBOARD DIKHNE KE 5 SECONDS BAAD PROMPT CALL HOGA
    setTimeout(() => {
        promptForNotifications();
    }, 5000); // 5000 milliseconds = 5 seconds
        },
        
        showAuthPage() {
            authToken = null;
            localStorage.removeItem('authToken');
            this.closeSidebar();
            this.updateUserInfo({ fullname: '', email: '' });
            document.getElementById('loginFormAction').reset();
            document.getElementById('signupFormAction').reset();
            this.elements.dashboardPage.classList.replace('page-visible', 'page-hidden');
            this.elements.authPage.classList.replace('page-hidden', 'page-visible');
        },
        
        updateTimestamp() {
            this.elements.timestamp.textContent = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        },
        
        // File: js/main.js -> Is poore function ko replace karein
toggleAuthForms(formToShow) {
    ['login-form', 'signup-form', 'forgot-password-form'].forEach(formId => {
        const formEl = document.getElementById(formId);
        if (formEl) {
            formEl.classList.toggle('form-visible', formId.startsWith(formToShow));
            formEl.classList.toggle('form-hidden', !formId.startsWith(formToShow));
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
      
        },
        
        // START: YEH DO FUNCTIONS ADD KAREIN
showProfilePopup() {
    this.elements.profilePopup.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
},

hideProfilePopup() {
    this.elements.profilePopup.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
},
// END: YEH DO FUNCTIONS ADD KAREIN
        async fetchAndDisplayProfile() {
            const options = {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${authToken}` }
            };
            const userData = await this.handleApiRequest('users/me', options);
            if (userData) {
                this.updateUserInfo(userData);
                const contentContainer = document.getElementById('profile-content');
                contentContainer.innerHTML = `
<div class="glass-panel relative p-8 rounded-2xl max-w-2xl mx-auto border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden group">
    
    <!-- Ambient Background Glow (Visual Theory) -->
    <div class="absolute top-0 right-0 w-40 h-40 bg-accent-green/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

    <!-- Header Section -->
    <div class="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
        <div class="flex items-center gap-3">
            <!-- Status Indicator -->
            <div class="w-1 h-8 bg-accent-green rounded-full shadow-[0_0_15px_#00ff7f]"></div>
            <div>
                <h3 class="text-xl font-orbitron tracking-[0.2em] text-white">AGENT <span class="text-accent-green">DOSSIER</span></h3>
                <p class="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Classified Personnel Record</p>
            </div>
        </div>

        <!-- Edit Action with Hover Micro-interaction -->
        <a href="/misc/update-profile.html" title="Update Config" class="group/btn p-2 rounded-lg hover:bg-white/5 transition-all duration-300">
            <svg class="w-5 h-5 text-gray-400 group-hover/btn:text-accent-green group-hover/btn:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
        </a>
    </div>

    <!-- Data Grid (Responsiveness Theory) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        <!-- Codename -->
        <div class="space-y-1">
            <p class="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">Codename</p>
            <div class="font-mono text-xl text-accent-green tracking-wide flex items-center gap-2">
                <span class="opacity-50">@</span>${userData.username}
            </div>
            <div class="h-px w-full bg-gradient-to-r from-accent-green/50 to-transparent"></div>
        </div>

        <!-- Full Name -->
        <div class="space-y-1">
            <p class="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">Operative Identity</p>
            <div class="font-mono text-lg text-white tracking-wide">${userData.fullname}</div>
            <div class="h-px w-full bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>

        <!-- Email (Full Width) -->
        <div class="md:col-span-2 space-y-1 pt-2">
            <p class="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-1">Secure Comm Channel</p>
            <div class="font-mono text-sm text-gray-300 tracking-widest flex items-center gap-2 p-3 bg-black/20 rounded border border-white/5">
                <svg class="w-4 h-4 text-accent-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                ${userData.email}
            </div>
        </div>
    </div>

    <!-- Footer / Status -->
    <div class="mt-8 pt-4 flex items-center gap-3 border-t border-white/5 opacity-60">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
        </span>
        <span class="text-[9px] font-mono text-accent-green uppercase tracking-widest">Active Status: Verified</span>
    </div>
</div>`;
            } else {
                this.showAuthPage();
            }
        },
        
        
        
        
        // File: js/main.js -> inside the 'app' object
async handleFeedbackSubmit(rating, comment) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ rating, comment })
    };
    const result = await this.handleApiRequest('feedback/', options);
    return result !== null;
},
        
   
   
   
   
   // File: js/main.js -> inside the 'app' object

// This is a helper function to generate star HTML
_createStarsHtml(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="text-2xl ${i <= rating ? 'text-accent-green' : 'text-gray-600'}">&star;</span>`;
        }
        return `<div class="flex">${stars}</div>`;
    },
    
    // File: js/main.js -> handleLogin ke baad is function ko add karein
async handleForgotPassword() {
    const button = this.elements.forgotPasswordFormAction.querySelector('button');
    const email = document.getElementById('forgot-email-input').value;
    const messageEl = document.getElementById('forgot-message');
    
    messageEl.textContent = 'Processing...';
    messageEl.className = 'text-center p-2 rounded-md mb-4 text-yellow-400';
    
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    };
    
    const result = await this.handleApiRequest('forgot-password', options, button);
    
    if (result) {
        messageEl.textContent = result.message || "Password reset link sent successfully.";
        messageEl.className = 'text-center p-2 rounded-md mb-4 text-green-400';
    } else {
        // handleApiRequest already shows the main error, this is a fallback.
        messageEl.textContent = 'Failed. Please check the error message at the top.';
        messageEl.className = 'text-center p-2 rounded-md mb-4 text-red-400';
    }
},
    async handleFetchTestimonials() {
        const container = document.getElementById('testimonials-list');
        if (!container) return;
        
        container.innerHTML = `<p class="text-center text-text-secondary">Loading testimonials...</p>`;
        
        const testimonials = await     this.handleApiRequest('feedback/');
        
        if (testimonials && testimonials.length > 0) {
            container.innerHTML = ''; // Clear loading message
            testimonials.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const card = `
                <div class="glass-panel p-6 rounded-xl border-l-4 border-accent-green bg-[rgba(26,26,26,0.8)] shadow-lg backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-2xl duration-300 break-words">
    <!-- Comment Text -->
    <p class="text-text-primary italic text-sm md:text-base leading-relaxed mb-4">"${item.comment}"</p>

    <!-- User Info + Stars -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between">
        <!-- Username & Date -->
        <div class="text-sm flex items-center gap-2">
            <span class="font-bold text-accent-green">@${item.username}</span>
            <span class="text-text-secondary ml-0 md:ml-2">${date}</span>
        </div>

        <!-- Star Rating -->
        <div class="flex items-center space-x-1 mt-2 md:mt-0">
            ${this._createStarsHtml(item.rating)}
        </div>
    </div>
</div>    `;
                container.innerHTML += card;
            });
        } else if (testimonials) {
            container.innerHTML = `<p class="text-center text-text-secondary">No testimonials submitted yet.</p>`;
        } else {
            container.innerHTML = `<p class="text-center text-red-400">[ERROR] Could not load testimonials.</p>`;
        }
    },
   
   
   
   

// SNIPPET: YEH NAYA FUNCTION 'app' OBJECT KE ANDAR ADD KAREIN
async handleFeedbackUpdate(rating, comment) {
    const options = {
        method: 'PUT', // Use PUT for updating
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ rating, comment })
    };
    return await this.handleApiRequest('feedback/', options);
},
        
    };
    
    window.app = app;
    app.init();
});