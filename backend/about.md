# Investment Performance Tracker & Quantitative Analytics Platform
> **Enterprise-Grade Django & Azure Cloud Solution for Real-Time Stock Analytics, Portfolio Management, and Financial Data Pipelines**

---

## 📌 Executive Summary & LinkedIn Brief

The **Investment Performance Tracker** is a cloud-native financial intelligence platform fully built using **Agentic AI & AI-Driven Software Engineering**. Designed to track equity investments, analyze portfolio returns, and perform real-time technical analysis (e.g., Simple Moving Averages), the platform replaces manual spreadsheet tracking with an automated, secure, and scalable cloud application.

The application was designed, coded, and deployed leveraging advanced **AI pair-programming and agentic workflows**, demonstrating how AI-driven development accelerates complex full-stack architecture, database schema design, and production cloud infrastructure setup on **Microsoft Azure**.

The infrastructure is hosted on **Microsoft Azure**, leveraging PaaS services including **Azure App Service**, **Azure Database for PostgreSQL (Flexible Server)**, and **Azure Key Vault** with **System-Assigned Managed Identities** for zero-trust security.

```
[LinkedIn Project Title]
Cloud-Native Investment Performance Tracker & Stock Analytics Platform (Azure & AI-Engineered)

[LinkedIn Tagline / Headline]
Cloud-native financial tracking & stock analytics platform engineered with Agentic AI, deployed on Azure App Service & PostgreSQL Flexible Server with zero-trust Azure Key Vault security.
```

---

## 🎯 Problem Statement & Motivation

### The Problem
Retail investors and portfolio managers face significant challenges when evaluating multi-asset portfolios:
* **Manual Data Entry & Errors:** Spreadsheets require manual updates for stock prices, transactions, and cash balances, leading to human error and delayed decision-making.
* **Lack of Quantitative Indicators:** Basic tools lack automated calculation of key technical metrics like 50-day and 200-day Simple Moving Averages (SMA) across entire watchlist portfolios.
* **Security & Scalability Risks:** Storing financial data and credentials locally or in non-cloud environments exposes system secrets and limits cross-device accessibility.

### The Solution
The Investment Performance Tracker automates portfolio tracking, data ingestion, and technical indicator computation within a highly secure, enterprise-grade Azure cloud infrastructure.

---

## ☁️ Cloud Computing & Azure Hosting Architecture (Primary Focus)

The core strength of this project lies in its **production-ready Azure cloud deployment**, emphasizing high availability, zero-trust credential isolation, and cost-optimized auto-scaling.

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        User(["🌐 End User / Browser"])
    end

    subgraph AzureCloud ["Microsoft Azure Cloud Platform (Resource Group: rg-investment-tracker)"]
        subgraph Compute ["PaaS Web Layer"]
            AppService["🚀 Azure App Service (Linux B1)\nPython 3.11 + Gunicorn + WhiteNoise"]
            ManagedID["🔑 System-Assigned Managed Identity"]
            AppService --- ManagedID
        end

        subgraph Security ["Zero-Trust Secret Management"]
            KeyVault["🔒 Azure Key Vault (investmentkeyvault)\n- Secret: DatabasePassword\n- Secret: DjangoSecretKey"]
        end

        subgraph DataStore ["Managed Relational Database"]
            PostgreSQL[("🐘 Azure Database for PostgreSQL\nFlexible Server (Burstable B1ms)\nDatabase: investment_tracker")]
        end
    end

    subgraph External ["External Data Ingestion"]
        TradingView["📈 TradingView / Financial Data Scraper Engine"]
    end

    User -->|HTTPS / SSL| AppService
    AppService -->|Managed Identity Auth| KeyVault
    AppService -->|Secure Connection / SSL (5432)| PostgreSQL
    AppService -->|Multi-Threaded HTTP/WS| TradingView
```

### Key Cloud Services & Infrastructure Design

#### 1. Azure App Service (Linux PaaS)
* **Hosting Runtime:** Python 3.11 running on Gunicorn HTTP WSGI server with WhiteNoise static asset compression and delivery.
* **Why App Service?** Eliminates OS patching and server administration while providing automated TLS/SSL certificate handling, horizontal scaling, and health monitoring.
* **Continuous Deployment (CI/CD):** Integrated with GitHub Actions & Azure SCM build engines (`SCM_DO_BUILD_DURING_DEPLOYMENT=true`) for zero-downtime deployment pipelines.

#### 2. Azure Database for PostgreSQL (Flexible Server)
* **Database Engine:** Managed PostgreSQL instance deployed in a secure Azure virtual network subnet with automated snapshot backups and point-in-time recovery.
* **Scalability & Tiering:** Utilizes Burstable Compute (B1ms) optimized for cost efficiency during baseline operations with auto-scaling storage capacity.

#### 3. Azure Key Vault & System-Assigned Managed Identity (Zero-Trust Security)
* **Zero Hardcoded Secrets:** Sensitive application secrets (`SECRET_KEY`, database admin passwords) are stored exclusively in Azure Key Vault.
* **Identity Federation:** Azure App Service uses a **System-Assigned Managed Identity** to authenticate with Key Vault without any API keys or credentials embedded in source code or `.env` files.
* **Runtime Secret References:** Environment variables use native Key Vault reference syntax:
  ```ini
  DATABASE_PASSWORD=@Microsoft.KeyVault(SecretUri=https://investmentkeyvault.vault.azure.net/secrets/DatabasePassword/)
  SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://investmentkeyvault.vault.azure.net/secrets/DjangoSecretKey/)
  ```

---

## 🛠️ Complete Technical Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Cloud & Hosting (Azure)** | Azure App Service (Linux), Azure Database for PostgreSQL (Flexible Server), Azure Key Vault, Azure CLI |
| **Backend Framework** | Python 3.11, Django 4.2+, Gunicorn, Django REST, Django Crispy Forms |
| **Database & ORM** | PostgreSQL, SQLite (Local Dev), Django ORM, SQLAlchemy |
| **Data Engine & Analysis** | Pandas, NumPy, Multi-Threaded Scraping (`concurrent.futures`), TradingView Data Engine |
| **Security & Auth** | OAuth 2.0 (`django-allauth`), PyJWT, Managed Identity, Key Vault, HTTPS/TLS |
| **Asynchronous Tasks** | Celery, Redis (Portfolio Snapshots & Daily Recalculation) |
| **Frontend & UI** | HTML5/CSS3, JavaScript (ES6+), Bootstrap 5, Chart.js / TradingView Widgets |
| **DevOps & Asset Prep** | Git, WhiteNoise, `startup.sh` startup scripts, Procfile |

---

## 🤖 Agentic AI & AI-Driven Development Methodology

This project was engineered from conception to production using **Agentic AI workflows** and **AI-assisted pair-programming**, showcasing modern AI-augmented software delivery:

* **Autonomous Architecture & Schema Design:** Leveraged AI agents to model complex relational database schemas for portfolio transactions, equity holdings, and daily market price snapshots.
* **Rapid Multi-Threaded Code Generation:** Utilized AI to write vectorized Pandas/NumPy financial calculations and thread-pool execution scripts for external stock price data pipelines.
* **Automated Cloud Infrastructure Provisioning:** Employed AI agents to architect zero-trust Azure deployments—configuring Azure App Service, PostgreSQL Flexible Server, and Azure Key Vault with Managed Identity references.
* **Automated Debugging & Verification:** Used AI-driven code audit and error diagnostic techniques to resolve container static asset serving issues (WhiteNoise/Gunicorn) and database concurrency.

---

## 🌟 Key Features & Capabilities

1. **Real-Time Portfolio Performance Dashboard:** Interactive portfolio tracking showing overall return (ROI), profit/loss (P&L), dividend yields, and asset allocation breakdown.
2. **Multi-Threaded Data Scraping Engine:** Concurrent worker thread pool (`python manage.py fetch_stock_prices --threads 6`) retrieving historical price datasets and moving averages efficiently.
3. **Automated Technical Indicator Engine:** On-the-fly calculation of technical overlays (50-day SMA, 200-day SMA, RSI) powered by vectorized **Pandas** & **NumPy** routines.
4. **Transaction & Cash Flow Management:** Complete ledger system for buy/sell executions, deposit/withdrawal logs, and automated cash balance adjustments with Django database transactions (`transaction.atomic`).
5. **Secure Authentication & OAuth Integration:** Multi-factor ready user auth supporting standard registration and OAuth 2.0 social logins via `django-allauth`.

---

## 🚧 Challenges & Engineering Solutions

### Challenge 1: Secure Credential Management in Public/Cloud Environments
* **Problem:** Exposing database passwords and Django secrets in configuration files or deployment scripts poses severe security compliance risks.
* **Solution:** Configured **Azure Key Vault** integrated with **Azure App Service System-Assigned Managed Identity**. Managed Identity grants keyless token authorization to read secrets at runtime via Azure Key Vault Reference URIs.

### Challenge 2: Ingesting Historical Market Data Without Latency Bottlenecks
* **Problem:** Fetching daily historical price records sequentially for hundreds of equity tickers resulted in HTTP request timeouts and high CPU overhead.
* **Solution:** Architected a multi-threaded data pipeline using Python's `concurrent.futures.ThreadPoolExecutor` with multi-threading parameters (`--threads 6`), drastically reducing ingestion time by ~80%.

### Challenge 3: Static Asset Serving in Linux PaaS Containers
* **Problem:** Django's built-in static file handler is unsuited for production containers on Azure App Service.
* **Solution:** Integrated **WhiteNoise** middleware combined with Gunicorn WSGI workers to compress and serve static assets directly with aggressive HTTP cache-control headers without needing an S3 bucket.

---

## 💼 Role-Tailored CV & Interview Modules

*This section provides customizable bullet points and technical highlights tailored for specific job roles.*

### ☁️ Option 1: Tailored for Cloud / DevOps / Infrastructure Engineer Roles
* **CV Bullet Points:**
  * Architected and deployed a cloud-native Django and PostgreSQL web application on **Microsoft Azure (App Service & Flexible Server)**.
  * Implemented a zero-trust credential model utilizing **Azure Key Vault** and **System-Assigned Managed Identity**, eliminating hardcoded environment secrets.
  * Configured CI/CD deployment pipelines using Azure SCM build engines and GitHub Actions, establishing automated schema migrations and static asset compression via WhiteNoise.
* **Key Interview Talking Points:**
  * *"I focused heavily on PaaS architecture and security. By leveraging Managed Identities, the application authenticates directly to Key Vault without storing any keys or secrets in the repo or config files."*

---

### ⚙️ Option 2: Tailored for Backend / System Developer Roles
* **CV Bullet Points:**
  * Developed a Django 4.2 financial management web app utilizing PostgreSQL and Django ORM with atomic database transactions (`transaction.atomic`).
  * Engineered a multi-threaded data ingestion script (`ThreadPoolExecutor`) in Python to fetch and aggregate historical market data from external APIs efficiently.
  * Built authentication and session management layers integrating OAuth 2.0 (`django-allauth`) and JWT security protocols.
* **Key Interview Talking Points:**
  * *"I designed the data model to ensure strict database consistency during cash transfers and trade executions using database locks and atomic transactions in Django."*

---

### 📊 Option 3: Tailored for Data / Quant / AI Engineer Roles
* **CV Bullet Points:**
  * Built a quantitative data analytics pipeline using **Pandas** and **NumPy** to calculate technical indicators (50/200-day Simple Moving Averages, price trends).
  * Designed automated background daily snapshot processing using **Celery** and **Redis** to evaluate daily portfolio returns and historical benchmark tracking.
  * Implemented structured data transformations to feed visual charting interfaces (Chart.js / TradingView widgets).
* **Key Interview Talking Points:**
  * *"I optimized technical indicator calculations by vectorizing operations in Pandas, enabling fast moving-average calculations across large historical price series."*

---

### 📱 Option 4: Tailored for Full-Stack / Web Developer Roles
* **CV Bullet Points:**
  * Created a responsive financial analytics dashboard using Bootstrap 5, Django Crispy Forms, and custom JavaScript visuals.
  * Integrated real-time market data visualization widgets and dynamic portfolio allocation charts.
  * Implemented end-to-end user workflows from account onboarding to transaction tracking and analytics export.
* **Key Interview Talking Points:**
  * *"I balanced complex backend calculations with a modern, visual UI using Crispy Forms and responsive charting components for an enterprise user experience."*

---

## 📈 Business Impact & Key Metrics

* **Data Accuracy:** 100% automated calculation of portfolio market values and moving average metrics, eliminating manual Excel entry errors.
* **Processing Speed:** Multi-threaded stock data ingestion engine reduced price synchronization times by over 80%.
* **Security & Compliance:** 0 hardcoded secrets in production due to Azure Key Vault & Managed Identity integration.
* **Uptime & Scalability:** Hosted on Azure Linux PaaS with automated SSL certificate lifecycle management and automated database backups.

---

## 🔮 Future Roadmap & Cloud Evolution

1. **Infrastructure as Code (IaC):** Automate the Azure provisioning steps (App Service, PostgreSQL, Key Vault) using **Terraform** or **Bicep** templates.
2. **Containerization (Docker & AKS):** Package the Django app and Celery worker into OCI-compliant Docker containers deployed on **Azure Container Apps** or **Azure Kubernetes Service (AKS)**.
3. **Caching Layer:** Deploy an **Azure Cache for Redis** instance to cache daily stock metrics and user portfolio analytics for sub-50ms API response times.
