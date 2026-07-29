# Azure Deployment Guide — Investment Tracker

This is a complete, tested deployment guide for the Investment Tracker Django app on Microsoft Azure.
Every step is explained with the **why**, and all known issues from real deployments are pre-solved here so you can deploy without errors.

---

## Prerequisites

Before starting, make sure you have:
- An **Azure account** with an active subscription
- Your code pushed to a **GitHub repository**
- A **Google Cloud Console** project (for Google OAuth login)

---

## Architecture Overview

```
User Browser
     │
     ▼
Azure App Service (Linux)          ← Hosts the Django app (Python/Gunicorn)
     │
     ▼
Azure Database for PostgreSQL      ← Stores all app data (users, stocks, etc.)
```

> **Why these services?**
> - **App Service** handles SSL, scaling, and Python natively. No server management needed.
> - **PostgreSQL Flexible Server** is a fully managed database with automatic backups.

---

## Step 1: Create a Resource Group

A Resource Group is a logical container for all your Azure resources.

1. Go to [portal.azure.com](https://portal.azure.com)
2. Search for **Resource Groups** → Click **+ Create**
3. Fill in:
   - **Subscription:** Your subscription
   - **Resource group name:** `rg-investment-tracker`
   - **Region:** `Central India` (or closest to your users)
4. Click **Review + Create** → **Create**

> **Why?** Grouping resources makes it easy to manage billing, delete everything at once, and see related services together.

---

## Step 2: Create Azure Database for PostgreSQL

This is where all your app data lives.

1. Search for **Azure Database for PostgreSQL** → Click **+ Create**
2. Choose **Flexible Server** → Click **Create**
3. Fill in:
   - **Resource group:** `rg-investment-tracker`
   - **Server name:** `investmenttrackerdb` *(becomes `investmenttrackerdb.postgres.database.azure.com`)*
   - **Region:** Same as your resource group
   - **PostgreSQL version:** `16`
   - **Workload type:** Development (cheapest)
   - **Admin username:** `dbadmin`
   - **Password:** Choose a strong password, e.g. `MySecureDb@2026`
   - **Confirm password:** Same as above

4. Go to the **Networking** tab:
   - **Connectivity method:** Public access
   - ✅ Check **Allow public access from any Azure service within Azure to this server**
   - ✅ Click **+ Add current client IP address** (so you can connect from your local machine if needed)

5. Click **Review + Create** → **Create** (takes 2–3 minutes)

6. Once deployed, go to the resource → **Databases** → **+ Add**
   - **Database name:** `investment_tracker`
   - Click **Save**

> **Why allow Azure services?** Your App Service needs to reach the database. Without this, you get: `no pg_hba.conf entry for host` error.
> **Why SSL?** Azure PostgreSQL Flexible Server enforces SSL by default. Your `production.py` already has `sslmode: require` to handle this.

---

## Step 3: Create the Azure App Service

This hosts your Django application.

1. Search for **App Services** → Click **+ Create** → **Web App**
2. Fill in:
   - **Resource group:** `rg-investment-tracker`
   - **Name:** `investmenttracker` *(your URL will be `investmenttracker-xxxx.centralindia-01.azurewebsites.net`)*
   - **Publish:** Code
   - **Runtime stack:** Python 3.11
   - **Operating System:** Linux
   - **Region:** Same as your database
   - **Pricing plan:** Basic B1 (minimum recommended)

3. Click **Review + Create** → **Create**

> **Why Linux?** Django with Gunicorn runs best on Linux. Azure's Linux App Service uses the same environment as most Python production servers.

---

## Step 4: Configure Application Settings (Environment Variables)

This is the most critical step. These replace your local `.env` file in production.

1. Go to your App Service → **Configuration** → **Application settings**
2. Click **+ New application setting** for each variable below:

| Name | Value | Why |
|------|-------|-----|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | **Critical.** Without this, Django uses local settings and the app breaks with 400/500 errors |
| `DATABASE_NAME` | `investment_tracker` | Name of the PostgreSQL database you created |
| `DATABASE_USER` | `dbadmin` | The admin username you set in Step 2 |
| `DATABASE_PASSWORD` | `MySecureDb@2026` | The password you set in Step 2 |
| `DATABASE_HOST` | `investmenttrackerdb.postgres.database.azure.com` | Full server hostname (not just the short name) |
| `DATABASE_PORT` | `5432` | Standard PostgreSQL port |
| `SECRET_KEY` | `django-prod-x9k2mj7vqn4pw8yz1abc3de5fg` | Any long random string — **never use the default** |
| `DEBUG` | `False` | Must be False in production — never expose debug info publicly |
| `ALLOWED_HOSTS` | *(fill in after Step 5 — see note below)* | The exact Azure domain for your app |
| `GOOGLE_CLIENT_ID` | `your-google-client-id.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-your-google-secret` | From Google Cloud Console |

> ⚠️ **For `ALLOWED_HOSTS`:** After creating the App Service, find your exact URL in **App Service → Overview → Default domain**. It will look like:
> `investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net`
> Use that **full** hostname — not just `investmenttracker.azurewebsites.net`.

3. Click **Save** at the top after adding all settings.

> **Why not use `.env` file?** The `.env` file is excluded from git (in `.gitignore`) for security. Azure App Service Configuration settings are injected as environment variables at runtime, which is the correct production approach.

---

## Step 5: Set Up Startup Command

1. Go to **App Service → Configuration → General settings**
2. Find **Startup Command** and enter:
   ```
   startup.sh
   ```
3. Click **Save**

> **Why?** The `startup.sh` script starts the cron daemon for scheduled stock updates and then starts Gunicorn. Without this, Azure uses its default startup which may not work correctly.

---

## Step 6: Connect GitHub for Auto-Deployment

1. Go to **App Service → Deployment Center**
2. **Source:** GitHub
3. Sign in to GitHub if prompted
4. Fill in:
   - **Organization:** Your GitHub username
   - **Repository:** `investment_tracker`
   - **Branch:** `main`
5. Click **Save**

Azure will automatically create a GitHub Actions workflow file and push it to your repository. From now on, every push to `main` triggers a new deployment.

> **Why GitHub Actions?** It gives you CI/CD — your app automatically updates when you push new code. No manual uploads needed.

---

## Step 7: Get Your Exact App URL

1. Go to **App Service → Overview**
2. Find **Default domain** — it will look like:
   ```
   investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net
   ```
3. Copy this full URL.
4. Go back to **Configuration → Application settings** and update `ALLOWED_HOSTS` with this exact domain.
5. Click **Save** → **Restart** the App Service.

---

## Step 8: Configure Google OAuth

Google OAuth requires knowing exactly which URLs your app uses.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project → **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID

4. Under **Authorized JavaScript origins**, add:
   ```
   https://investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net
   ```

5. Under **Authorized redirect URIs**, add:
   ```
   https://investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net/accounts/google/login/callback/
   ```

6. Click **Save** and wait **2–5 minutes** for Google to apply the change.

> **Why the full hostname?** Google checks the redirect URI exactly. `investmenttracker.azurewebsites.net` and `investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net` are **different URLs** and both must be registered.

---

## Step 9: Run Database Migrations via SSH

Migrations create all the database tables your app needs. This must be done once after first deployment.

1. Go to **App Service → SSH** (in the left sidebar under Development Tools)
2. A browser terminal opens. Run:

```bash
# Run ALL migrations (creates all tables including allauth, sites, etc.)
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MySecureDb@2026' python manage.py migrate
```

You should see output like:
```
Applying account.0001_initial... OK
Applying socialaccount.0001_initial... OK
Applying sites.0001_initial... OK
...
```

> **Why prefix with env vars?** This ensures the SSH session uses production settings and the correct password, even if Azure env vars aren't loaded in the SSH session.

3. Set the correct site domain for allauth:

```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MySecureDb@2026' python manage.py shell
```

Inside the Python shell, run:
```python
from django.contrib.sites.models import Site
site = Site.objects.get_or_create(id=1)[0]
site.domain = 'investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net'
site.name = 'Investment Tracker'
site.save()
exit()
```

> **Why set the site domain?** Django's allauth uses the `Sites` framework to know what domain it's running on. The default is `example.com` which must be changed or you'll get `relation "django_site" does not exist` errors.

---

## Step 10: Create Admin Superuser

```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MySecureDb@2026' python manage.py createsuperuser
```

Enter a username, email, and strong password when prompted. This account lets you access `/admin/`.

---

## Step 11: Collect Static Files

```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MySecureDb@2026' python manage.py collectstatic --noinput
```

> **Why?** WhiteNoise serves static files in production. `collectstatic` compresses and copies all CSS/JS files to `staticfiles/` so WhiteNoise can serve them.

---

## Step 12: Verify the App is Running

1. Visit your app URL:
   ```
   https://investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net/
   ```
2. You should see the login page — not a 400/500 error.
3. Test Google login — it should redirect to Google and return successfully.
4. Test email/password signup and login.

---

## How to Update the App (Push New Code)

Every time you make changes to the code locally:

```bash
# 1. Stage your changes
git add .

# 2. Commit with a description
git commit -m "describe what you changed"

# 3. Push to GitHub — this triggers automatic Azure deployment
git push origin main
```

Then:
1. Go to **https://github.com/your-username/investment_tracker/actions**
2. Watch the workflow run — it takes 3–5 minutes
3. Once the workflow shows ✅ green, your changes are live

> ⚠️ If you add new Django models after deployment, you must also:
> 1. Run `python manage.py makemigrations` locally
> 2. Commit and push the migration files
> 3. SSH into Azure and run `python manage.py migrate` again

---

## Troubleshooting Quick Reference

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `400 Bad Request` | `ALLOWED_HOSTS` wrong or `DJANGO_SETTINGS_MODULE` not set | Check App Service config settings |
| `500 Server Error` | Missing migrations (allauth tables) | SSH → run `python manage.py migrate` |
| `relation "django_site" does not exist` | Sites migrations not applied | SSH → run `migrate sites` + set domain in shell |
| `password authentication failed` | Wrong `DATABASE_PASSWORD` in config | Check App Service → Configuration |
| `no pg_hba.conf entry ... no encryption` | Using local settings (no SSL) | Ensure `DJANGO_SETTINGS_MODULE=config.settings.production` |
| `redirect_uri_mismatch` | Wrong URL in Google Console | Add full Azure hostname to Google OAuth redirect URIs |
| `staticfiles.W004` | `static/` folder missing | Run `mkdir static` or `collectstatic` |

---

## Full List of Required Azure App Service Environment Variables

Copy this table and fill in your real values:

| Variable | Example Value | Required |
|----------|--------------|----------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | ✅ Yes |
| `DATABASE_NAME` | `investment_tracker` | ✅ Yes |
| `DATABASE_USER` | `dbadmin` | ✅ Yes |
| `DATABASE_PASSWORD` | `MySecureDb@2026` | ✅ Yes |
| `DATABASE_HOST` | `investmenttrackerdb.postgres.database.azure.com` | ✅ Yes |
| `DATABASE_PORT` | `5432` | ✅ Yes |
| `SECRET_KEY` | `django-prod-x9k2mj7vqn4pw8yz1abc` | ✅ Yes |
| `DEBUG` | `False` | ✅ Yes |
| `ALLOWED_HOSTS` | `investmenttracker-xxxx.centralindia-01.azurewebsites.net` | ✅ Yes |
| `GOOGLE_CLIENT_ID` | `183547705538-xxxx.apps.googleusercontent.com` | ✅ For Google login |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | ✅ For Google login |

---

*This guide was written based on the real deployment of this project and covers all errors encountered during that process.*