// Vivento Frontend Application
// Bu JavaScript PHP backend ilə işləyir

class Vivento {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.templates = [];
        this.events = [];
        this.baseURL = window.location.origin; // Shared hosting URL
        
        this.init();
    }

    init() {
        console.log('🚀 Vivento App başladı');
        
        // Check if user is logged in
        this.checkAuth();
        
        // Load initial data
        this.loadTemplates();
        
        // Event listeners
        this.setupEventListeners();
        
        // Route handling
        this.handleRoute();
    }

    // Authentication Management
    checkAuth() {
        const token = localStorage.getItem('vivento_token');
        const user = localStorage.getItem('vivento_user');
        
        if (token && user) {
            this.currentUser = JSON.parse(user);
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            loginBtn.classList.add('hidden');
            registerBtn.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userName.textContent = this.currentUser.name;
            
            // Show dashboard if logged in
            if (this.currentPage === 'home') {
                this.showPage('dashboard');
            }
        } else {
            loginBtn.classList.remove('hidden');
            registerBtn.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }

    // API Calls
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Add auth token if available
        const token = localStorage.getItem('vivento_token');
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            this.showLoading(true);
            const response = await fetch(url, options);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.detail || 'API xətası');
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showToast(error.message, 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Authentication Actions
    async login(email, password) {
        try {
            const result = await this.apiCall('/api/auth/login.php', 'POST', {
                email,
                password
            });

            // Save auth data
            localStorage.setItem('vivento_token', result.access_token);
            localStorage.setItem('vivento_user', JSON.stringify(result.user));
            
            this.currentUser = result.user;
            this.updateAuthUI();
            
            this.closeModal();
            this.showToast('Uğurla daxil oldunuz!', 'success');
            this.showPage('dashboard');
            
        } catch (error) {
            console.error('Login error:', error);
        }
    }

    async register(name, email, password) {
        try {
            const result = await this.apiCall('/api/auth/register.php', 'POST', {
                name,
                email,
                password
            });

            // Save auth data
            localStorage.setItem('vivento_token', result.access_token);
            localStorage.setItem('vivento_user', JSON.stringify(result.user));
            
            this.currentUser = result.user;
            this.updateAuthUI();
            
            this.closeModal();
            this.showToast('Qeydiyyat tamamlandı!', 'success');
            this.showPage('dashboard');
            
        } catch (error) {
            console.error('Register error:', error);
        }
    }

    logout() {
        localStorage.removeItem('vivento_token');
        localStorage.removeItem('vivento_user');
        this.currentUser = null;
        this.updateAuthUI();
        this.showPage('home');
        this.showToast('Çıxış edildi', 'success');
    }

    // Data Loading
    async loadTemplates() {
        try {
            const templates = await this.apiCall('/api/templates/index.php');
            this.templates = templates;
            this.renderTemplates();
        } catch (error) {
            console.error('Templates yüklənmədi:', error);
        }
    }

    async loadEvents() {
        if (!this.currentUser) return;
        
        try {
            const events = await this.apiCall('/api/events/index.php');
            this.events = events;
            this.renderEvents();
        } catch (error) {
            console.error('Events yüklənmədi:', error);
        }
    }

    // UI Rendering
    renderTemplates(category = 'all') {
        const grid = document.getElementById('templatesGrid');
        if (!grid) return;

        const filteredTemplates = category === 'all' 
            ? this.templates 
            : this.templates.filter(t => t.category === category);

        grid.innerHTML = filteredTemplates.map(template => `
            <div class="template-card bg-white rounded-lg shadow-md overflow-hidden" 
                 onclick="app.selectTemplate('${template.id}')">
                <div class="aspect-w-3 aspect-h-4 bg-gray-200">
                    <img src="${template.thumbnail_url || '/images/template-placeholder.jpg'}" 
                         alt="${template.name}"
                         class="w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2">${template.name}</h3>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">${this.getCategoryName(template.category)}</span>
                        ${template.is_premium ? 
                            '<span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Premium</span>' : 
                            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Pulsuz</span>'
                        }
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderEvents() {
        const grid = document.getElementById('eventsGrid');
        if (!grid) return;

        if (this.events.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-calendar-plus text-4xl text-gray-300 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Hələ tədbir yoxdur</h3>
                    <p class="text-gray-500 mb-4">İlk tədbir yaradın və gözəl dəvətnamələr göndərin</p>
                    <button onclick="app.showCreateEvent()" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                        Yeni tədbir yarat
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.events.map(event => `
            <div class="event-card bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-semibold text-lg">${event.name}</h3>
                    <div class="flex space-x-2">
                        <button onclick="app.editEvent('${event.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="app.shareEvent('${event.id}')" class="text-green-600 hover:text-green-800">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(event.date)}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${event.location}</span>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t flex justify-between items-center">
                    <span class="text-xs text-gray-500">
                        ${this.formatDate(event.created_at, true)}
                    </span>
                    <button onclick="app.viewInvitation('${event.id}')" 
                            class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Dəvətnaməni gör →
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Page Navigation
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show selected page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            this.currentPage = pageName;
            
            // Load page-specific data
            if (pageName === 'dashboard') {
                this.loadEvents();
            }
        }
    }

    // Modal Management
    showAuth(type) {
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authTitle');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (type === 'login') {
            title.textContent = 'Hesabınıza daxil olun';
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            title.textContent = 'Yeni hesab yaradın';
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('authModal').classList.add('hidden');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            this.login(email, password);
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            this.register(name, email, password);
        });

        // Close modal on background click
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.closeModal();
            }
        });

        // User menu logout
        document.getElementById('userMenu').addEventListener('click', () => {
            if (confirm('Çıxış etmək istədiyinizə əminsinizmi?')) {
                this.logout();
            }
        });
    }

    // Utility Functions
    formatDate(dateString, withTime = false) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return date.toLocaleDateString('az-AZ', options);
    }

    getCategoryName(category) {
        const names = {
            'toy': '💍 Toy',
            'nişan': '💖 Nişan',
            'doğum_günü': '🎂 Ad günü',
            'korporativ': '🏢 Korporativ'
        };
        return names[category] || category;
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    handleRoute() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.showPage(hash);
        }
    }

    // Template and Event Actions
    selectTemplate(templateId) {
        if (!this.currentUser) {
            this.showAuth('login');
            return;
        }
        
        this.showToast('Template seçildi! Event yaradın...', 'success');
        // Redirect to event creation with template
        this.showCreateEvent(templateId);
    }

    showCreateEvent(templateId = null) {
        // Simple prompt for now - can be enhanced with modal
        const name = prompt('Tədbir adı:');
        const date = prompt('Tarix (YYYY-MM-DD HH:MM):');
        const location = prompt('Məkan:');
        
        if (name && date && location) {
            this.createEvent({
                name,
                date: date + ':00Z',
                location,
                template_id: templateId
            });
        }
    }

    async createEvent(eventData) {
        try {
            const result = await this.apiCall('/api/events/index.php', 'POST', eventData);
            this.showToast('Tədbir yaradıldı!', 'success');
            this.loadEvents(); // Reload events list
        } catch (error) {
            console.error('Event creation error:', error);
        }
    }

    viewInvitation(eventId) {
        const url = `${this.baseURL}/invitation.php?token=demo-${eventId}`;
        window.open(url, '_blank');
    }

    shareEvent(eventId) {
        const url = `${this.baseURL}/invitation.php?token=demo-${eventId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Dəvətnamə',
                text: 'Tədbirimə dəvətlisiniz!',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link panoya kopyalandı!', 'success');
            });
        }
    }
}

// Template filtering
function filterTemplates(category) {
    // Update button states
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Filter templates
    app.renderTemplates(category);
}

// Global functions
function showAuth(type) {
    app.showAuth(type);
}

function closeModal() {
    app.closeModal();
}

function showPage(page) {
    app.showPage(page);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Vivento();
});

// Handle browser back/forward
window.addEventListener('hashchange', () => {
    app.handleRoute();
});
