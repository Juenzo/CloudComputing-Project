variable "resource_group_name" {
  type        = string
  description = "Nom du resource group"
  default     = "rg-elearning"
}

variable "location" {
  type        = string
  description = "Région Azure (DOIT être autorisée sur ta souscription)"
  default     = "norwayeast"
}

variable "storage_account_name" {
  type        = string
  description = "Nom du storage account (unique, lowercase)"
  default     = "storagelearning"
}

variable "bdd_admin_login" {
  type        = string
  description = "Login admin de la bdd SQL"
  default     = "sqladmin"
}

variable "bdd_admin_password" {
  type        = string
  description = "Mot de passe admin de la bdd SQL"
  sensitive   = true
  default     = "Admin123!"
}

variable "app_service_name" {
  type        = string
  description = "Nom de l'App Service API"
  default     = "api-elearning"
}
