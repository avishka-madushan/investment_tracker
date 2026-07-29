# Azure Deployment Troubleshooting Log

This document records every issue encountered when deploying the Investment Tracker Django app to Azure App Service, and the exact steps used to fix each one.

---

## Issue 1: Database Connection Failure — Password Auth + No SSL

### Error
```
psycopg2.OperationalError: connection to server at "investmenttrackerdb.postgres.database.azure.com"
FATAL: password authentication failed for user "dbadmin"
FATAL: no pg_hba.conf entry for host "52.140.85.23", user "dbadmin", database "investment_tracker", no encryption
```

### Root Cause
Two combined problems:
1. `DJANGO_SETTINGS_MODULE` was not set, so Django used `config.settings.local` (no SSL).
2. Azure PostgreSQL Flexible Server **requires SSL**, but `local` settings have no `sslmode: require`.

### Fix
Run `migrate` with explicit env vars to force production settings and the correct password:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MyDatabase@2026' python manage.py migrate
```

**Permanent fix:** Set `DJANGO_SETTINGS_MODULE=config.settings.production` in Azure App Service → Configuration → Application settings.

---

## Issue 2: Accidentally Pasting Traceback Into Terminal

### Error
```
-bash: syntax error near unexpected token 'root@...'
-bash: System: command not found
```

### Root Cause
The Python traceback was copy-pasted directly into the bash terminal instead of only the command.

### Fix
This does not damage anything. The terminal resets automatically. Just wait for the `$` prompt and continue.

---

## Issue 3: GitHub Push Blocked — Secrets Detected

### Error
```
remote: - GITHUB PUSH PROTECTION
remote: Push cannot contain secrets
remote: —— Google OAuth Client ID ————
remote: —— Google OAuth Client Secret ————
```

### Root Cause
The `.env` file containing `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` was committed to git and pushed to a public repository. GitHub's secret scanning blocked it.

### Fix
1. Remove `.env` from git tracking:
   ```bash
   git rm --cached .env
   ```
2. Create a `.gitignore` file with `.env` listed.
3. Commit the `.gitignore`.
4. Visit the GitHub secret scanning unblock URLs provided in the error message, select **"I'll fix this later"**, and allow the push.
5. Push again:
   ```bash
   git push origin main
   ```

> ⚠️ **Important:** Since the credentials were exposed publicly, regenerate your Google OAuth client secret in [Google Cloud Console](https://console.cloud.google.com/) and update the Azure App Service environment variables.

---

## Issue 4: `relation "django_site" does not exist`

### Error
```
ProgrammingError at /accounts/login/
relation "django_site" does not exist
```

### Root Cause
`django.contrib.sites` was in `INSTALLED_APPS` but its migrations had never been applied to the Azure PostgreSQL database.

### Fix
Run in Azure SSH:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MyDatabase@2026' python manage.py migrate sites
```

Then set the correct site domain:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MyDatabase@2026' python manage.py shell
```
```python
from django.contrib.sites.models import Site
site = Site.objects.get_or_create(id=1)[0]
site.domain = 'investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net'
site.name = 'Investment Tracker'
site.save()
exit()
```

---

## Issue 5: App Using `config.settings.local` on Azure (Bad Request 400)

### Error
```
Bad Request (400)
Settings Module: config.settings.local
```

### Root Cause
`config/wsgi.py` hardcoded `local` as the default settings fallback:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
```

### Fix
Changed `wsgi.py` to default to `production`:
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
```

---

## Issue 6: Server Error 500 — Missing allauth Migrations

### Error
```
Server Error (500)
```

### Root Cause
The `account` and `socialaccount` allauth tables were never created because the first `migrate` run did not include them.

### Fix
Run full migrate again in Azure SSH:
```bash
DJANGO_SETTINGS_MODULE=config.settings.production DATABASE_PASSWORD='MyDatabase@2026' python manage.py migrate
```

---

## Issue 7: Google OAuth — `redirect_uri_mismatch` (Error 400)

### Error
```
Access blocked: This app's request is invalid
Error 400: redirect_uri_mismatch
```

### Root Cause
The redirect URI added to Google Cloud Console used a short hostname (`investmenttracker.azurewebsites.net`) but the actual Azure URL has a full hostname with a random suffix (`investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net`).

### Fix
In Google Cloud Console → APIs & Services → Credentials → OAuth client, add:

**Authorized JavaScript Origins:**
```
https://investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net
```

**Authorized Redirect URIs:**
```
https://investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net/accounts/google/login/callback/
```

---

## Summary — Azure App Service Environment Variables Required

| Variable | Value |
|----------|-------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `DATABASE_NAME` | `investment_tracker` |
| `DATABASE_USER` | `dbadmin` |
| `DATABASE_HOST` | `investmenttrackerdb.postgres.database.azure.com` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_PASSWORD` | `<your-db-password>` |
| `SECRET_KEY` | `<long-random-string>` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `investmenttracker-dgg5cphfa7bbasby.centralindia-01.azurewebsites.net` |
| `GOOGLE_CLIENT_ID` | `<your-google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | `<your-google-client-secret>` |

---

## Key Lessons Learned

1. **Never commit `.env` files** — always add `.gitignore` with `.env` before the first commit.
2. **`wsgi.py` default settings** should point to `production`, not `local`.
3. **Run `migrate` with all env vars** explicitly in SSH when App Service env vars aren't confirmed working.
4. **Azure PostgreSQL requires SSL** — always use `config.settings.production` which has `sslmode: require`.
5. **Google OAuth redirect URIs** must exactly match the full Azure hostname including random suffixes.
6. **Run full `migrate`** after every new app install to avoid missing table errors.
