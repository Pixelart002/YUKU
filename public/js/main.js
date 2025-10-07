document.addEventListener('DOMContentLoaded', () => {
    let authToken = null;
    
    const app = {
        currentPageScript: null,
        config: {
            API_BASE_URL: 'https://open-feliza-pixelart002-78fb4fe8.koyeb.app'
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
            logoutBtn: document.getElementById('logoutBtn'),
            authErrorBox: document.getElementById('auth-error-box'),
            showSignupBtn: document.getElementById('show-signup'),
            showLoginBtn: document.getElementById('show-login'),
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
        
        async handleApiRequest(endpoint, options = {}, button = null) {
            if (button) button.disabled = true;
            this.elements.authErrorBox.classList.add('hidden');
            try {
                const response = await fetch(`${this.config.API_BASE_URL}/${endpoint}`, options);
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || 'An unknown error occurred.');
                }
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
        
        async handleAiQuery() {
            const prompt = document.getElementById("ai-prompt-input").value;
            const responseContainer = document.getElementById("ai-response-container");
            const executeBtn = document.getElementById("ai-execute-btn");
            if (!prompt.trim()) return;
            
            executeBtn.disabled = true;
            executeBtn.textContent = "Processing...";
            responseContainer.innerHTML = "<p class='text-text-secondary'>[TRANSMITTING...]</p>";
            
            const options = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ prompt })
            };
            const data = await this.handleApiRequest('ai/ask', options);
            
            if (data && data.response) {
                responseContainer.innerHTML = `<h5 class="font-orbitron text-accent-green">YUKU RESPONSE:</h5><p class="mt-2 whitespace-pre-wrap">${data.response.trim()}</p>`;
            } else {
                responseContainer.innerHTML = `<p class='text-red-500'>[CONNECTION FAILED]</p>`;
            }
            executeBtn.disabled = false;
            executeBtn.textContent = "Execute";
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
        
        showAuthError(message) {
            this.elements.authErrorBox.textContent = `[ERROR]: ${message}`;
            this.elements.authErrorBox.classList.remove('hidden');
        },
        
        showDashboard(defaultPage) {
            this.fetchAndDisplayProfile();
            this.elements.authPage.classList.replace('page-visible', 'page-hidden');
            this.elements.dashboardPage.classList.replace('page-hidden', 'page-visible');
            this.navigateTo(defaultPage);
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
        
        toggleAuthForms(formToShow) {
            document.getElementById('login-form').classList.toggle('form-visible', formToShow === 'login');
            document.getElementById('login-form').classList.toggle('form-hidden', formToShow !== 'login');
            document.getElementById('signup-form').classList.toggle('form-visible', formToShow === 'signup');
            document.getElementById('signup-form').classList.toggle('form-hidden', formToShow !== 'signup');
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
                contentContainer.innerHTML = `<div class="glass-panel relative p-6 rounded-lg max-w-2xl mx-auto space-y-4 border border-[var(--border-color)] bg-[var(--bg-medium)]/50 backdrop-blur-md shadow-md">
    <!-- Header with right-aligned edit icon -->
    <div class="flex items-center justify-between">
        <h3 class="text-2xl font-orbitron text-[var(--accent-green)]">AGENT DOSSIER</h3>

        <a 
            href="/misc/update-profile.html" 
            title="Edit Profile"
            class="transition-transform hover:scale-110"
        >
            <img 
                src="https://cdn-icons-png.flaticon.com/512/1782/1782750.png" 
                alt="Edit Profile"
                class="w-6 h-6 opacity-90 hover:opacity-100 drop-shadow-[0_0_6px_var(--accent-green)]"
            >
        </a>
    </div>

    <!-- Profile Info -->
    <div>
        <p class="text-sm text-text-secondary">USERNAME</p>
        <p class="text-lg">@${userData.username}</p>
    </div>

    <div>
        <p class="text-sm text-text-secondary">FULL NAME</p>
        <p class="text-lg">${userData.fullname}</p>
    </div>

    <div>
        <p class="text-sm text-text-secondary">AGENT ID (EMAIL)</p>
        <p class="text-lg">${userData.email}</p>
    </div>
</div>`;
            } else {
                this.showAuthPage();
            }
        },
        
        
    };
    
    window.app = app;
    app.init();
});