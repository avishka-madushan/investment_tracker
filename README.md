# Investment Performance Tracker

A comprehensive Django web application for tracking stock investments, analyzing performance, and managing cash balances.

## Setup & Local Development

This project uses SQLite locally for easy testing without configuration. In production, it connects to PostgreSQL.

### 1. Install Dependencies
Make sure you have Python 3.11+ installed.
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database Migrations
Create the local database tables:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Fetch Data (from TradingView)
Fetch the initial list of stocks (e.g. Sri Lankan market):
```bash
python manage.py fetch_stocks
```

Fetch historical daily price data and SMA indicators for the fetched stocks:
```bash
python manage.py fetch_stock_prices --threads 6
```

### 4. Run the Application
Start the Django development server:
```bash
python manage.py runserver
```

Open `http://localhost:8000/` in your browser. You can register an account directly from the UI to start testing.

### 5. Run Daily Snapshot Task (Celery)
To automatically record daily portfolio snapshots at market close:
Make sure Redis is running (`redis-server`), then start the worker and beat process:
```bash
celery -A config.celery_app worker --loglevel=info
celery -A config.celery_app beat --loglevel=info
```

## Production Deployment (Railway / Render)
1. Fork / push this repo to GitHub.
2. Link the repository to Railway.
3. Add a **PostgreSQL Plugin** and **Redis Plugin**.
4. Set the environment variables provided in `.env.example`.
5. Railway will automatically detect the `Procfile` and `runtime.txt` to run the web and worker instances.

email = avishka11121@gmail.com
password = newpassword123#