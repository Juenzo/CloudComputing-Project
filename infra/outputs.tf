output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "storage_account_name" {
  value = azurerm_storage_account.sa.name
}

output "content_container_name" {
  value = azurerm_storage_container.content.name
}

output "evaluation_pdf_url" {
  value = azurerm_storage_blob.evaluation_pdf.url
}

output "api_hostname" {
  value = azurerm_linux_web_app.api.default_hostname
}

output "api_url" {
  value = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "api_name" {
  value = azurerm_linux_web_app.api.name
}

output "sql_server_fqdn" {
  description = "L'adresse du serveur SQL pour s'y connecter (ex: avec DBeaver)"
  value       = azurerm_mssql_server.sqlserver.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Le nom de la BDD"
  value       = azurerm_mssql_database.db.name
}