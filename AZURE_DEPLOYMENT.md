# Hosting Investment Tracker on Microsoft Azure

This guide details the architecture and steps required to deploy the Investment Tracker application to Microsoft Azure. To achieve a secure, scalable, and fully-managed production environment, we will utilize three primary Azure services.

## Core Azure Services

To host this Django + PostgreSQL application, we will use the following minimum three services:

1. **Azure App Service (Linux)**
   * **Purpose:** Hosts the core Django Python web application.
   * **Why:** App Service provides a fully managed Platform as a Service (PaaS) environment. It natively supports Python (via Gunicorn), automatically handles SSL certificates, load balancing, and scaling without needing to manage the underlying virtual machines.

2. **Azure Database for PostgreSQL (Flexible Server)**
   * **Purpose:** Hosts the relational database for the application.
   * **Why:** A fully managed database service that provides automated backups, high availability, and easy scaling. It perfectly replaces the local PostgreSQL instance used during development.

3. **Azure Key Vault**
   * **Purpose:** Securely stores application secrets.
   * **Why:** Hardcoding passwords or secrets in configuration files is a security risk. Key Vault will securely store your Django `SECRET_KEY` and PostgreSQL database password, allowing the App Service to retrieve them securely at runtime.

---

## Deployment Steps

### Step 1: Create the Resource Group
Group all related resources together for easier management and billing.
* Go to the Azure Portal and create a new **Resource Group** (e.g., `rg-investment-tracker`).

### Step 2: Provision Azure Database for PostgreSQL
1. Search for **Azure Database for PostgreSQL servers** and create a new **Flexible Server**.
2. **Configuration:**
   * Choose a compute tier that fits your needs (Burstable B1ms is fine for starting out).
   * Note down the **Server name**, **Admin username**, and **Password**.
3. **Networking:**
   * Under Networking, ensure you select **Allow public access from any Azure service within Azure to this server** so your App Service can connect to it.
4. **Database Creation:**
   * Once deployed, go to the "Databases" blade and create a new database named `investment_tracker`.

### Step 3: Set up Azure Key Vault
1. Create a new **Key Vault** in your resource group.
2. Go to the **Secrets** section and add the following secrets:
   * `DjangoSecretKey`: (Generate a long, random string)
   * `DatabasePassword`: (The password you set for your PostgreSQL server)
3. Under **Access policies** (or RBAC depending on your setup), you will later need to grant your App Service permission to read these secrets.

### Step 4: Create the Azure App Service
1. Create a new **Web App**.
2. **Configuration:**
   * **Publish:** Code
   * **Runtime stack:** Python 3.11 (or your matching version)
   * **Operating System:** Linux
   * **App Service Plan:** Choose a suitable plan (e.g., Basic B1).
3. **Enable Managed Identity:**
   * Once created, go to **Identity** in the left menu and turn **System assigned** to **On**.
   * Go back to your Key Vault's Access Policies and grant this new Managed Identity "Get" permissions for Secrets.

### Step 5: Configure Application Settings (Environment Variables)
In your App Service, go to **Configuration** -> **Application settings** and add the following variables (replacing values with your specifics):

* `DATABASE_NAME`: `investment_tracker`
* `DATABASE_USER`: `<your-admin-username>`
* `DATABASE_HOST`: `<your-postgres-server-name>.postgres.database.azure.com`
* `DATABASE_PORT`: `5432`
* `DEBUG`: `False`
* `ALLOWED_HOSTS`: `<your-app-name>.azurewebsites.net`
* `SCM_DO_BUILD_DURING_DEPLOYMENT`: `true` (Tells Azure to install requirements.txt)

**To link Key Vault Secrets:**
Instead of typing the actual passwords, use Key Vault references:
* `DATABASE_PASSWORD`: `@Microsoft.KeyVault(SecretUri=https://<your-vault-name>.vault.azure.net/secrets/DatabasePassword/)`
* `SECRET_KEY`: `@Microsoft.KeyVault(SecretUri=https://<your-vault-name>.vault.azure.net/secrets/DjangoSecretKey/)`

### Step 6: Deploy the Code
You can deploy your code in several ways. The most common are:
1. **GitHub Actions / CI-CD:** Connect your GitHub repository directly in the Azure App Service **Deployment Center**. Azure will automatically create a workflow file to build and deploy your app every time you push to the `main` branch.
2. **Local Git / Azure CLI:** Use the `az webapp up` command from your local terminal to push the code directly.

### Step 7: Run Migrations
Once the code is deployed and the environment variables are set, you need to set up the database tables.
1. In the App Service, go to **SSH** to open a terminal into your container.
2. Run the migration command:
   ```bash
   python manage.py migrate
   ```
3. Create an admin user:
   ```bash
   python manage.py createsuperuser
   ```

## Conclusion
Your application is now running securely on Azure! The App Service handles serving your Python code (and Whitenoise serves your static files), Azure Database for PostgreSQL safely stores your data, and Azure Key Vault ensures your sensitive credentials are never exposed.



data base 
server name : investmenttracker
user name   : dbadmin
password    : MyDatabase@2026


Create Azure Key Vault

Vault Name : investmentkeyvault

PostgreSQL password
Secret Name : DatabasePassword
PostgreSQL password. : DatabasePassword


Django SECRET_KEY
Secret Name : DjangoSecretKey
Django password : DjangoSecretKey