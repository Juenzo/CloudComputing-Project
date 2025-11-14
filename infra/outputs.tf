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

output "postgres_server_fqdn" {
  value = azurerm_postgresql_flexible_server.pg.fqdn
}

output "postgres_database_name" {
  value = azurerm_postgresql_flexible_server_database.db.name
}

output "postgres_admin_user" {
  value = "${var.postgres_admin_login}@${azurerm_postgresql_flexible_server.pg.name}"
}
