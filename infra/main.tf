terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

########################
# Resource Group
########################

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

########################
# Storage Account
########################

resource "random_string" "pg_suffix" {
  length      = 4
  upper       = false
  numeric     = true
  special     = false
  min_numeric = 4
}

resource "azurerm_storage_account" "sa" {
  name                     = "${var.storage_account_name}${random_string.pg_suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html" # Important pour le routing de React Router DOM (pages dynamiques)
  }
}

resource "azurerm_storage_container" "data" {
  name                  = "data"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "content" {
  name                  = "content"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "web" {
  name                  = "$web"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "blob"
}

resource "azurerm_storage_blob" "evaluation_pdf" {
  name                   = "pdf/evaluation.pdf"
  storage_account_name   = azurerm_storage_account.sa.name
  storage_container_name = azurerm_storage_container.content.name
  type                   = "Block"
  source                 = "${path.module}/files/pdf/evaluation.pdf"
}

########################
# SQL Server (MSSQL)
########################

resource "azurerm_mssql_server" "sqlserver" {
  name                         = "sql-srv-${azurerm_resource_group.rg.name}-${random_string.pg_suffix.result}" # Ajout suffixe pour unicité
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = azurerm_resource_group.rg.location
  version                      = "12.0"
  administrator_login          = var.bdd_admin_login
  administrator_login_password = var.bdd_admin_password
}

resource "azurerm_mssql_database" "db" {
  name        = "elearning_bdd"
  server_id   = azurerm_mssql_server.sqlserver.id
  collation   = "SQL_Latin1_General_CP1_CI_AS"
  sku_name    = "Basic"
  max_size_gb = 2
}

resource "azurerm_mssql_firewall_rule" "allow_azure_ips" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.sqlserver.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

########################
# App Service (Backend API Python)
########################

resource "azurerm_service_plan" "api_plan" {
  name                = "plan-${var.app_service_name}-${random_string.pg_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "api" {
  name                = "${var.app_service_name}-${random_string.pg_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.api_plan.id
  https_only          = true

  site_config {
    application_stack {
      python_version = "3.11"
    }
    always_on        = false
    app_command_line = "python3 -m gunicorn backend.main:app -c gunicorn_conf.py"
  }

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true" # Important pour que Azure installe les requirements.txt
    "WEBSITES_PORT"                  = "8000"
    
    # Infos de connexion BDD pour votre code Python
    "DB_SERVER"   = azurerm_mssql_server.sqlserver.fully_qualified_domain_name
    "DB_NAME"     = azurerm_mssql_database.db.name
    "DB_USER"     = var.bdd_admin_login
    "DB_PASSWORD" = var.bdd_admin_password
    
    # Pour lier le stockage si besoin (facultatif pour le moment)
    "STORAGE_ACCOUNT_NAME" = azurerm_storage_account.sa.name
    "STORAGE_ACCOUNT_KEY"  = azurerm_storage_account.sa.primary_access_key
  }
}