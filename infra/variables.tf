variable "resource_group_name" {
  type        = string
  description = "Nom du resource group"
  default     = "rg-elearning"
}

variable "location" {
  type        = string
  description = "Région Azure (DOIT être autorisée sur ta souscription)"
  default     = "switzerlandnorth"
}

variable "storage_account_name" {
  type        = string
  description = "Nom du storage account (unique, lowercase)"
  default     = "elearningstorage1234"
}

variable "postgres_admin_login" {
  type        = string
  description = "Login admin PostgreSQL"
  default     = "pgadmin"
}

variable "postgres_admin_password" {
  type        = string
  description = "Mot de passe admin PostgreSQL"
  sensitive   = true
}
