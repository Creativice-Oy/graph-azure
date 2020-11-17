variable "create_monitor_log_profile" {
  type    = number
  default = 0
}

locals {
  monitor_log_profile_count = var.create_monitor_log_profile == 1 ? 1 : 0
}

resource "azurerm_resource_group" "j1dev_log_profile_resource_group" {
  count    = local.monitor_log_profile_count
  name     = "j1dev_log_profile_resource_group"
  location = "eastus"
}

resource "azurerm_storage_account" "j1dev_log_profile_storage_account" {
  count = local.monitor_log_profile_count
  # The name can only consist of lowercase letters and numbers, and must be between 3 and 24 characters long.
  name                     = "j1devlogprofilestrgacct"
  resource_group_name      = azurerm_resource_group.j1dev_log_profile_resource_group[0].name
  location                 = azurerm_resource_group.j1dev_log_profile_resource_group[0].location
  account_tier             = "Standard"
  account_replication_type = "GRS"
}

resource "azurerm_eventhub_namespace" "j1dev_log_profile_eventhub" {
  count = local.monitor_log_profile_count
  # The eventhub namespace name can contain only letters, numbers and hyphens. The namespace must start with a letter, and it must end with a letter or number and be between 6 and 50 characters long.
  name                = "j1dev-log-profile-eventhub"
  location            = azurerm_resource_group.j1dev_log_profile_resource_group[0].location
  resource_group_name = azurerm_resource_group.j1dev_log_profile_resource_group[0].name
  sku                 = "Standard"
  capacity            = 2
}

resource "azurerm_monitor_log_profile" "j1dev_log_profile" {
  name = "default"

  categories = [
    "Action",
    "Delete",
    "Write",
  ]

  locations = [
    "westus",
    "global",
  ]

  # RootManageSharedAccessKey is created by default with listen, send, manage permissions
  servicebus_rule_id = "${azurerm_eventhub_namespace.j1dev_log_profile_eventhub[0].id}/authorizationrules/RootManageSharedAccessKey"
  storage_account_id = azurerm_storage_account.j1dev_log_profile_storage_account[0].id

  retention_policy {
    enabled = true
    days    = 365
  }
}