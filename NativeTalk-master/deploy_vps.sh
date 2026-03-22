#!/bin/bash
set -e

echo "--- STARTING DEPLOYMENT ---"

# Ensure /var/www exists
mkdir -p /var/www

# Check for essential tools
command -v git || (apt-get update && apt-get install -y git)
command -v node || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs)
command -v pm2 || npm install -g pm2
command -v nginx || (apt-get update && apt-get install -y nginx)

# Clone or Update repository
cd /var/www
if [ ! -d "nativetalk" ]; then
    echo "Cloning repository..."
    git clone https://github.com/borgesedson/NativeTalk-master--2- nativetalk
fi

cd nativetalk
echo "Updating code..."
git fetch origin
# Try main first, fallback to master
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || echo "Using existing code"

cd NativeTalk-master

echo "--- BUILDING FRONTEND ---"
cd frontend
npm install
npm run build
echo "Frontend built successfully."

echo "--- CONFIGURING BACKEND ---"
cd ../backend

echo "Installing backend dependencies..."
npm install

# Create/Update .env
echo "Configuring environment variables..."
cat <<ENV > .env
PORT=3000
INSFORGE_BASE_URL=https://7qi47s5n.us-west.insforge.app
INSFORGE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg2NTR9.zAvcnN8b1pR-TEJPOVFHxmLpXUwVXOkhyL1BMmG_s5k
INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzOTg2NTR9.zAvcnN8b1pR-TEJPOVFHxmLpXUwVXOkhyL1BMmG_s5k
STREAM_API_KEY=qqq782vgbvwx
STREAM_API_SECRET=vqcjdey2uetvbq7jqgqt8q33dtaxxfvhjndwkpb24kfd6jcktu9exbx9ksd5ahy7
JWT_SECRET=meusiteseguro
ARGOS_API_URL=http://localhost:5000/translate
WHISPER_API_URL=http://localhost:5001/stt-and-translate
NODE_ENV=production
ENV

# Start/Restart PM2
echo "Managing PM2 processes..."
pm2 delete nativetalk-backend 2>/dev/null || true
pm2 start src/server.js --name nativetalk-backend
pm2 save

# Nginx Configuration
echo "Configuring Nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

cat <<NGINX > /etc/nginx/sites-available/nativetalk
server {
    listen 80;
    server_name nativetalk.duckdns.org;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/nativetalk /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Ensure nginx.conf includes sites-enabled
if ! grep -q "sites-enabled" /etc/nginx/nginx.conf 2>/dev/null; then
    sed -i '/http {/a \    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

echo "Testing Nginx configuration..."
nginx -t
echo "Restarting Nginx..."
systemctl restart nginx

echo "Configuring SSL Certificate..."
certbot --nginx -d nativetalk.duckdns.org --non-interactive --agree-tos -m admin@duckdns.org --redirect || true

echo "--- DEPLOYMENT SUCCESSFUL ---"
