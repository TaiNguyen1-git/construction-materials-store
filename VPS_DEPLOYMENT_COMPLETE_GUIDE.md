# 🚀 Hướng Dẫn Deploy Lên VPS - Chi Tiết

**Project:** Construction Materials Store  
**Last Updated:** 2025-10-28

---

## 📋 Yêu Cầu VPS

### Minimum Requirements
- **OS:** Ubuntu 20.04/22.04 LTS (recommended)
- **RAM:** 2GB minimum (4GB recommended)
- **CPU:** 2 cores minimum
- **Storage:** 20GB SSD minimum
- **Bandwidth:** Unlimited recommended

### Software Requirements
- Node.js 18+ (hoặc 20 LTS)
- PostgreSQL 14+
- Nginx (as reverse proxy)
- PM2 (process manager)
- Git

---

## 🔧 Bước 1: Chuẩn Bị VPS

### 1.1 SSH vào VPS
```bash
ssh root@your-vps-ip
# hoặc
ssh username@your-vps-ip
```

### 1.2 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Cài đặt Node.js
```bash
# Cài Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # Should be v20.x.x
npm --version
```

### 1.4 Cài đặt PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
sudo systemctl status postgresql
```

### 1.5 Cài đặt Nginx
```bash
sudo apt install -y nginx

# Start service
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### 1.6 Cài đặt PM2
```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

---

## 🗄️ Bước 2: Setup Database

### 2.1 Tạo Database và User
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL console:
CREATE DATABASE construction_materials_store;
CREATE USER your_db_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE construction_materials_store TO your_db_user;
\q
```

### 2.2 Test Connection
```bash
psql -h localhost -U your_db_user -d construction_materials_store
# Enter password when prompted
# If connected successfully, type \q to exit
```

---

## 📦 Bước 3: Upload Code Lên VPS

### Option A: Sử dụng Git (Recommended)

#### 3.1 Setup Git trên VPS
```bash
# Tạo thư mục project
cd /var/www
sudo mkdir construction-store
sudo chown $USER:$USER construction-store
cd construction-store

# Clone từ repository
git clone https://github.com/your-username/construction-materials-store.git .

# Hoặc nếu chưa có Git repo, xem Option B
```

#### 3.2 Setup Git Repository (nếu chưa có)
**Trên máy local:**
```bash
cd D:\construction-materials-store

# Initialize git (nếu chưa có)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab
git remote add origin https://github.com/your-username/construction-materials-store.git
git push -u origin master
```

**Trên VPS:**
```bash
cd /var/www/construction-store
git clone https://github.com/your-username/construction-materials-store.git .
```

---

### Option B: Sử dụng FTP/SCP

#### 3.1 Sử dụng SCP (từ máy local)
```bash
# Trên Windows (PowerShell)
scp -r D:\construction-materials-store\* username@your-vps-ip:/var/www/construction-store/

# Trên Linux/Mac
scp -r /path/to/construction-materials-store/* username@your-vps-ip:/var/www/construction-store/
```

#### 3.2 Sử dụng FileZilla
1. Download FileZilla Client
2. Connect to VPS (SFTP)
   - Host: your-vps-ip
   - Username: your-username
   - Password: your-password
   - Port: 22
3. Upload toàn bộ folder project lên `/var/www/construction-store/`

---

## ⚙️ Bước 4: Cấu Hình Environment

### 4.1 Tạo .env file trên VPS
```bash
cd /var/www/construction-store
nano .env
```

### 4.2 Paste nội dung sau (chỉnh sửa theo VPS của bạn):
```bash
# Database Configuration
DATABASE_URL="postgresql://your_db_user:your_strong_password@localhost:5432/construction_materials_store"

# Application Environment
NEXT_PUBLIC_BASE_URL="https://your-domain.com"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# CSRF Protection
CSRF_SECRET="your-csrf-secret-change-this"

# AI Services
GEMINI_API_KEY="AIzaSyC7Fu9Wlfr4dPLmX-pQ50FFCQPnBq7ishw"
GEMINI_MODEL="models/gemini-2.0-flash-exp"
GEMINI_TEMPERATURE="0.7"

# OCR Configuration
TESSERACT_LANGUAGES="eng,vie"

# Email Service (Configure your SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="SmartBuild AI <noreply@smartbuild.com>"

# Payment Gateways (Configure when ready)
MOMO_PARTNER_CODE=""
MOMO_ACCESS_KEY=""
MOMO_SECRET_KEY=""
MOMO_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/create"

VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_TMN_CODE=""
VNPAY_HASH_SECRET=""
VNPAY_RETURN_URL="https://your-domain.com/api/payment/vnpay/return"

# Logging
LOG_LEVEL="info"

# WebSocket (Optional)
WS_PORT="8080"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-change-this"
NEXTAUTH_URL="https://your-domain.com"
```

**Lưu file:** Ctrl+X, Y, Enter

### 4.3 Generate Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output và paste vào JWT_SECRET

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output và paste vào JWT_REFRESH_SECRET

# Làm tương tự cho CSRF_SECRET và NEXTAUTH_SECRET
```

---

## 🏗️ Bước 5: Build Project

### 5.1 Install Dependencies
```bash
cd /var/www/construction-store
npm install --production
# hoặc nếu gặp lỗi:
npm install
```

### 5.2 Generate Prisma Client
```bash
npx prisma generate
```

### 5.3 Push Database Schema
```bash
npx prisma db push
```

### 5.4 Seed Database (Optional - tạo dữ liệu mẫu)
```bash
npm run db:seed
```

### 5.5 Build Next.js
```bash
npm run build
```

**Đợi build hoàn thành (khoảng 1-2 phút)**

---

## 🚀 Bước 6: Chạy Application với PM2

### 6.1 Tạo PM2 Ecosystem File
```bash
cd /var/www/construction-store
nano ecosystem.config.js
```

### 6.2 Paste nội dung:
```javascript
module.exports = {
  apps: [{
    name: 'construction-store',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/var/www/construction-store',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/construction-store/logs/pm2-error.log',
    out_file: '/var/www/construction-store/logs/pm2-out.log',
    log_file: '/var/www/construction-store/logs/pm2-combined.log',
    time: true
  }]
}
```

**Lưu file:** Ctrl+X, Y, Enter

### 6.3 Tạo thư mục logs
```bash
mkdir -p logs
```

### 6.4 Start Application
```bash
pm2 start ecosystem.config.js

# Verify app is running
pm2 status
pm2 logs construction-store

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Copy và chạy command mà PM2 suggest
```

---

## 🌐 Bước 7: Cấu Hình Nginx

### 7.1 Tạo Nginx Config
```bash
sudo nano /etc/nginx/sites-available/construction-store
```

### 7.2 Paste nội dung:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (sau khi setup SSL)
    # return 301 https://$server_name$request_uri;

    # For now, proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://localhost:3000;
        proxy_cache STATIC;
        proxy_cache_valid 200 1d;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Client body size (for file uploads)
    client_max_body_size 10M;
}

# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=STATIC:10m inactive=7d use_temp_path=off;
```

**Lưu file:** Ctrl+X, Y, Enter

### 7.3 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/construction-store /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 Bước 8: Setup SSL (HTTPS)

### 8.1 Cài đặt Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Follow the prompts:**
- Enter email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

### 8.3 Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
```

---

## 🔥 Bước 9: Setup Firewall

### 9.1 Configure UFW
```bash
# Allow SSH
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Bước 10: Verification

### 10.1 Check Services
```bash
# Check PM2
pm2 status
pm2 logs construction-store --lines 50

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql

# Check if app is listening
sudo netstat -tulpn | grep :3000
```

### 10.2 Test Website
```bash
# Test từ VPS
curl http://localhost:3000

# Test từ browser
# Mở: http://your-domain.com hoặc http://your-vps-ip
```

### 10.3 Check Logs
```bash
# PM2 logs
pm2 logs construction-store

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/www/construction-store/logs/pm2-combined.log
```

---

## 🔄 Bước 11: Deploy Updates

### Khi có code mới:

```bash
cd /var/www/construction-store

# Pull latest code
git pull origin master

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Restart PM2
pm2 restart construction-store

# Or restart with no downtime
pm2 reload construction-store

# Check status
pm2 logs construction-store --lines 20
```

---

## 🛠️ Troubleshooting

### Issue 1: Build Failed
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Issue 2: Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U your_db_user -d construction_materials_store

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue 3: PM2 App Crashed
```bash
# Check logs
pm2 logs construction-store --lines 100

# Restart app
pm2 restart construction-store

# Check app status
pm2 status
```

### Issue 4: Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 status
curl http://localhost:3000

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart construction-store
sudo systemctl restart nginx
```

### Issue 5: Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/construction-store

# Fix permissions
sudo chmod -R 755 /var/www/construction-store
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# CPU/Memory usage
pm2 status

# Detailed info
pm2 info construction-store
```

### Setup PM2 Web Dashboard (Optional)
```bash
# Install PM2 Plus
pm2 install pm2-server-monit

# Link to PM2 Plus (create account at pm2.io)
pm2 link <secret_key> <public_key>
```

---

## 🔐 Security Best Practices

### 1. Change Default SSH Port
```bash
sudo nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
sudo systemctl restart sshd

# Don't forget to allow new port in firewall:
sudo ufw allow 2222/tcp
```

### 2. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Setup Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Updates
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📝 Useful Commands

### PM2 Commands
```bash
pm2 start ecosystem.config.js    # Start app
pm2 stop construction-store       # Stop app
pm2 restart construction-store    # Restart app
pm2 reload construction-store     # Reload with 0 downtime
pm2 delete construction-store     # Remove from PM2
pm2 logs construction-store       # View logs
pm2 monit                         # Monitor
pm2 save                          # Save current config
```

### Nginx Commands
```bash
sudo nginx -t                     # Test config
sudo systemctl start nginx        # Start
sudo systemctl stop nginx         # Stop
sudo systemctl restart nginx      # Restart
sudo systemctl reload nginx       # Reload config
sudo systemctl status nginx       # Check status
```

### Database Commands
```bash
# Backup database
pg_dump -U your_db_user construction_materials_store > backup.sql

# Restore database
psql -U your_db_user construction_materials_store < backup.sql

# Connect to database
psql -U your_db_user -d construction_materials_store
```

---

## 🎯 Post-Deployment Checklist

- [ ] Website accessible via domain
- [ ] HTTPS working (SSL certificate)
- [ ] Database connected
- [ ] User registration works
- [ ] User login works
- [ ] Product browsing works
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] Admin panel accessible
- [ ] AI Chatbot responsive
- [ ] Payment gateway tested
- [ ] Email notifications working
- [ ] PM2 auto-starts on reboot
- [ ] Firewall configured
- [ ] SSL auto-renewal setup
- [ ] Backup strategy in place
- [ ] Monitoring setup

---

## 📞 Support

Nếu gặp vấn đề:

1. **Check Logs:**
   ```bash
   pm2 logs construction-store
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check Services:**
   ```bash
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   ```

3. **Restart Everything:**
   ```bash
   pm2 restart construction-store
   sudo systemctl restart nginx
   sudo systemctl restart postgresql
   ```

---

**Hoàn thành!** Website của bạn đã live tại: `https://your-domain.com` 🎉
