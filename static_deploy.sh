#!/bin/bash
# Vivento Static Deployment for Shared Hosting
# Bu script yalnız frontend-i static olaraq deploy edir

echo "🚀 Vivento Static Deployment başladı..."

# 1. Frontend build
echo "📦 React app build edilir..."
cd frontend
npm install
npm run build

# 2. Backend API-sini external service-lə əvəzləyir
echo "🔄 Backend URL-ni external service-ə yönləndir..."
cd build

# API calls-u external service-ə redirect et
cat > api-redirect.js << 'EOF'
// Bu file API calls-u external service-ə yönləndirir
window.BACKEND_URL = 'https://api.jsonbin.io/v3/b/YOUR_BIN_ID';

// localStorage simulasiyası
const mockAPI = {
  async login(email, password) {
    // Mock authentication
    if (email && password) {
      localStorage.setItem('user', JSON.stringify({
        id: '1', 
        name: 'Demo User',
        email: email
      }));
      return { success: true, user: { email, name: 'Demo User' } };
    }
    return { success: false };
  },
  
  async createEvent(eventData) {
    // Local storage-da saxla
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const newEvent = {
      ...eventData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    events.push(newEvent);
    localStorage.setItem('events', JSON.stringify(events));
    return newEvent;
  },
  
  async getEvents() {
    return JSON.parse(localStorage.getItem('events') || '[]');
  }
};

window.mockAPI = mockAPI;
EOF

# 3. HTML-ə mock API əlavə et
sed -i 's|</head>|<script src="./api-redirect.js"></script></head>|g' index.html

# 4. Deployment package hazırla
cd ..
echo "📁 Deployment package yaradılır..."
zip -r vivento-static-deploy.zip build/

echo "✅ Static deployment hazırdır!"
echo "📁 Fayl: vivento-static-deploy.zip"
echo "🌐 Bu zip-i shared hosting-ə upload edin"
echo ""
echo "📋 Upload təlimatı:"
echo "1. cPanel File Manager aç"
echo "2. public_html folder-ə daxil ol"
echo "3. vivento-static-deploy.zip upload et"
echo "4. Extract et"
echo "5. yourdomain.com/index.html aç"