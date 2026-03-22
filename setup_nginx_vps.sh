#!/bin/bash
# NativeTalk Nginx Setup Script

echo "🔧 Installing Nginx..."
apt update && apt install nginx -y

echo "📄 Creating Nginx configuration..."
cat > /etc/nginx/sites-available/nativetalk << 'EOF'
server {
    listen 80;
    server_name 82.25.64.9;

    location / {
        root /var/www/nativetalk/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "🔗 Enabling configuration..."
ln -sf /etc/nginx/sites-available/nativetalk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "✅ Testing Nginx..."
nginx -t

echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo "🚀 Nginx setup complete!"
