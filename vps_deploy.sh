#!/bin/bash
# Vivento VPS Auto Deployment Script
# Bu script VPS/Cloud server üçün nəzərdə tutulub

echo "🚀 Vivento VPS Deployment başladı..."

# System requirements yoxla
check_requirements() {
    echo "🔍 System requirements yoxlanılır..."
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "📥 Node.js quraşdırılır..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Python
    if ! command -v python3 &> /dev/null; then
        echo "📥 Python3 quraşdırılır..."
        sudo apt update
        sudo apt install -y python3 python3-pip
    fi
    
    # MongoDB
    if ! command -v mongod &> /dev/null; then
        echo "📥 MongoDB quraşdırılır..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        sudo apt update
        sudo apt install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
    fi
    
    # Nginx
    if ! command -v nginx &> /dev/null; then
        echo "📥 Nginx quraşdırılır..."
        sudo apt install -y nginx
    fi
    
    # PM2
    if ! command -v pm2 &> /dev/null; then
        echo "📥 PM2 quraşdırılır..."
        sudo npm install -g pm2
    fi
    
    echo "✅ System requirements hazırdır"
}

# Frontend build və deploy
deploy_frontend() {
    echo "🎨 Frontend deploy edilir..."
    
    cd frontend
    npm install
    npm run build
    
    # Nginx-ə build copy et
    sudo rm -rf /var/www/vivento
    sudo mkdir -p /var/www/vivento
    sudo cp -r build/* /var/www/vivento/
    sudo chown -R www-data:www-data /var/www/vivento
    
    echo "✅ Frontend deploy edildi"
}

# Backend deploy
deploy_backend() {
    echo "🔧 Backend deploy edilir..."
    
    cd ../backend
    pip3 install -r requirements.txt
    
    # PM2 ilə run et
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'vivento-backend',
    script: 'python3',
    args: '-m uvicorn server:app --host 0.0.0.0 --port 8001',
    cwd: '/home/ubuntu/vivento/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      MONGO_URL: 'mongodb://localhost:27017/vivento',
      SECRET_KEY: 'vivento-production-secret-2024'
    }
  }]
};
EOF
    
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    echo "✅ Backend deploy edildi"
}

# Nginx configuration
setup_nginx() {
    echo "🌐 Nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/vivento << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend
    location / {
        root /var/www/vivento;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # File uploads
    location /uploads {
        alias /home/ubuntu/vivento/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    sudo ln -sf /etc/nginx/sites-available/vivento /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl restart nginx
    
    echo "✅ Nginx configuration tamamlandı"
}

# SSL setup (Let's Encrypt)
setup_ssl() {
    echo "🔒 SSL certificate quraşdırılır..."
    
    sudo apt install -y certbot python3-certbot-nginx
    
    # Domain daxil edin
    read -p "🌐 Domain adınızı daxil edin (məs: yourdomain.com): " domain
    
    # SSL certificate al
    sudo certbot --nginx -d $domain -d www.$domain --non-interactive --agree-tos --email admin@$domain
    
    # Auto-renewal setup
    sudo systemctl enable certbot.timer
    
    echo "✅ SSL certificate quraşdırıldı"
}

# Database setup
setup_database() {
    echo "💾 MongoDB database setup..."
    
    # MongoDB user yarat
    mongo << EOF
use vivento
db.createUser({
    user: "vivento_user",
    pwd: "vivento_password_2024",
    roles: [ { role: "readWrite", db: "vivento" } ]
})
EOF
    
    # Sample data əlavə et
    python3 << EOF
import pymongo
import json
from datetime import datetime

client = pymongo.MongoClient('mongodb://localhost:27017/vivento')
db = client.vivento

# Templates collection
templates = [
    {
        "id": "1",
        "name": "Elegant Wedding",
        "category": "toy",
        "thumbnail_url": "/images/elegant-wedding.jpg",
        "is_premium": False,
        "design_data": {
            "canvasSize": {"width": 400, "height": 600, "background": "#f8f4e6"},
            "elements": []
        }
    }
]

db.templates.insert_many(templates)
print("✅ Sample templates əlavə edildi")
EOF
    
    echo "✅ Database setup tamamlandı"
}

# Monitoring setup
setup_monitoring() {
    echo "📊 Monitoring setup..."
    
    # PM2 monitoring
    pm2 install pm2-logrotate
    
    # System monitoring script
    cat > /home/ubuntu/monitor.sh << EOF
#!/bin/bash
# System monitoring script

# Disk space yoxla
df -h | awk 'NR==2{printf "Disk Usage: %s\n", \$5}'

# Memory usage
free -m | awk 'NR==2{printf "Memory Usage: %.2f%%\n", \$3/\$2 * 100.0}'

# CPU load
uptime | awk -F'load average:' '{print "Load Average:", \$2}'

# PM2 status
pm2 list
EOF
    
    chmod +x /home/ubuntu/monitor.sh
    
    # Cron job əlavə et (hər 5 dəqiqədə)
    (crontab -l 2>/dev/null; echo "*/5 * * * * /home/ubuntu/monitor.sh >> /var/log/vivento-monitor.log") | crontab -
    
    echo "✅ Monitoring quraşdırıldı"
}

# Backup script
setup_backup() {
    echo "💾 Backup system setup..."
    
    cat > /home/ubuntu/backup.sh << EOF
#!/bin/bash
# Vivento backup script

BACKUP_DIR="/home/ubuntu/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# MongoDB backup
mongodump --db vivento --out \$BACKUP_DIR/mongodb_\$DATE

# Code backup  
tar -czf \$BACKUP_DIR/code_\$DATE.tar.gz /home/ubuntu/vivento

# Uploads backup
tar -czf \$BACKUP_DIR/uploads_\$DATE.tar.gz /home/ubuntu/vivento/backend/uploads

# Köhnə backup-ları sil (30 gündən köhnə)
find \$BACKUP_DIR -type f -mtime +30 -delete

echo "✅ Backup completed: \$DATE"
EOF
    
    chmod +x /home/ubuntu/backup.sh
    
    # Günlük backup cron
    (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh >> /var/log/vivento-backup.log") | crontab -
    
    echo "✅ Backup system quraşdırıldı"
}

# Main deployment function
main_deploy() {
    echo "🚀 Vivento Full Deployment Başladı!"
    echo "=================================="
    
    # Get project files (assumes they are in current directory)
    if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
        echo "❌ Frontend və Backend folderleri tapılmadı!"
        echo "Vivento project folder-ində run edin"
        exit 1
    fi
    
    # Run all deployment steps
    check_requirements
    deploy_frontend  
    deploy_backend
    setup_nginx
    setup_database
    setup_monitoring
    setup_backup
    
    echo ""
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "========================="
    echo "✅ Frontend: http://yourdomain.com"
    echo "✅ Backend API: http://yourdomain.com/api"
    echo "✅ Database: MongoDB (local)"
    echo "✅ SSL: Ready for setup"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Domain DNS-i server IP-ə yönləndir"
    echo "2. SSL setup_ssl() funksiyasını run et"
    echo "3. Admin hesabla giriş et"
    echo ""
    echo "🔧 Useful Commands:"
    echo "pm2 status           - Backend status yoxla"
    echo "sudo nginx -t        - Nginx config test"
    echo "pm2 logs vivento-backend - Backend logs"
    echo "/home/ubuntu/monitor.sh - System monitoring"
    
    # Setup SSL prompt
    read -p "🔒 İndi SSL setup etmək istəyirsinizmi? (y/n): " setup_ssl_now
    if [ "$setup_ssl_now" = "y" ]; then
        setup_ssl
    fi
    
    echo "🎊 Vivento tamamilə hazırdır!"
}

# Script başlat
main_deploy