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
  length  = 4
  upper   = false
  numeric  = true
  special = false
}


resource "azurerm_storage_account" "sa" {
  name                     = "${var.storage_account_name_}${random_string.pg_suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
}

# Container data (quizz etc.)
resource "azurerm_storage_container" "data" {
  name                  = "data"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}

# Container content (PDF)
resource "azurerm_storage_container" "content" {
  name                  = "content"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}

# Upload de ton PDF evaluation.pdf
resource "azurerm_storage_blob" "evaluation_pdf" {
  name                   = "pdf/evaluation.pdf"
  storage_account_name   = azurerm_storage_account.sa.name
  storage_container_name = azurerm_storage_container.content.name
  type                   = "Block"
  source                 = "${path.module}/files/pdf/evaluation.pdf"
}

########################
# PostgreSQL Flexible Server
########################

resource "azurerm_postgresql_flexible_server" "pg" {
  name                = "pg-elearning_${random_string.pg_suffix.result}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location

  sku_name = "B_Standard_B1ms"

  administrator_login    = var.postgres_admin_login
  administrator_password = var.postgres_admin_password

  storage_mb = 32768
  version    = "16"

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  zone = 1

  authentication {
    password_auth_enabled = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = "elearningdb"
  server_id = azurerm_postgresql_flexible_server.pg.id
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.pg.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
