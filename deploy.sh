#!/bin/bash

# ============================================
# DEPLOYMENT SCRIPT - PRODUCTION
# ============================================
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "📦 Installing Node dependencies..."
npm ci --production

# 3. Build frontend
echo "🏗️  Building frontend assets..."
npm run build

# 4. Clear caches
echo "🧹 Clearing caches..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 5. Optimize
echo "⚡ Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 6. Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# 7. Restart services
echo "🔄 Restarting services..."
php artisan queue:restart
php artisan octane:reload  # If using Octane

# 8. Clear OPcache
echo "🧹 Clearing OPcache..."
php artisan opcache:clear

# 9. Health check
echo "🏥 Running health check..."
php artisan health:check

echo "✅ Deployment completed successfully!"
echo "🎉 Application is now live!"
