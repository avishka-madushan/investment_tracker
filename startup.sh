#!/bin/bash

# ──────────────────────────────────────────────────────────
# Azure App Service Startup Script
# Starts cron daemon for scheduled tasks, then launches Gunicorn
# ──────────────────────────────────────────────────────────

# Create the static directory if it doesn't exist (fixes the staticfiles warning)
mkdir -p /tmp/8dedad0ef1cd66b/static 2>/dev/null || true

# ── Set up the cron job for daily stock data update ──
# 3:00 PM Sri Lanka (UTC+5:30) = 9:30 AM UTC
# Runs Monday to Friday only (stock market days)

# Ensure cron is installed
apt-get update -qq && apt-get install -y -qq cron > /dev/null 2>&1

# Write the cron job
CRON_LOG="/home/LogFiles/daily_update.log"
APP_DIR=$(pwd)

# Build the cron entry
echo "30 9 * * 1-5 cd $APP_DIR && /opt/python/latest/bin/python manage.py daily_update --settings=config.settings.production >> $CRON_LOG 2>&1" > /etc/cron.d/daily-update

# Set correct permissions
chmod 0644 /etc/cron.d/daily-update

# Apply the cron job
crontab /etc/cron.d/daily-update

# Start the cron daemon in the background
service cron start

echo "✅ Cron job scheduled: daily_update at 9:30 AM UTC (3:00 PM Sri Lanka)"
echo "📄 Logs will be written to: $CRON_LOG"

# ── Start Gunicorn (the main web server) ──
gunicorn --bind=0.0.0.0 --timeout 600 --workers=4 config.wsgi:application
