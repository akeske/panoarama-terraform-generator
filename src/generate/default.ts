import { writeFile } from "../shared";

/**
 * Generate the main.tf file.
 * @param {string} folderPath - The folder path to generate the file in.
 * @param {string} environment - The environment, 'prod' or 'dev'.
 * @param {string} firewallName - The firewall name, e.g., 'az-company-we'.
 */
export function generateMain(
  folderPath: string,
  environment: string,
  firewallName: string
): void {
  const fileName = "main.tf";

  const devProviderConfig = `
provider "panos" {
#  hostname           = "192.168.121.132"
  hostname           = "192.168.233.132"
  username           = "admin"
  password           = "Cc123456"
  verify_certificate = false
  timeout            = 180
}
`;

  const prodProviderConfig = `
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-paloalto"
    storage_account_name = "stpaloaltoprdweu"
    container_name       = "${firewallName}"
    key                  = "${firewallName}.tfstate"
  }
}

provider "panos" {
  hostname           = "172.18.4.197"
  api_key            = var.api_key
  timeout            = 180
  logging            = ["action", "op", "uid", "osx_curl"]
  verify_certificate = false
}
`;

  const terraformConfig = environment.includes("p")
    ? prodProviderConfig
    : devProviderConfig;

  writeFile(folderPath, fileName, terraformConfig);
}

/**
 * Generate the versions.tf file.
 * @param {string} folderPath - The folder path to generate the file in.
 */
export function generateVersion(folderPath: string): void {
  const fileName = "versions.tf";

  const terraformVersionConfig = `
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    panos = {
      source  = "PaloAltoNetworks/panos"
      version = ">= 1.11.1"
    }
  }
}
`;

  writeFile(folderPath, fileName, terraformVersionConfig);
}

/**
 * Generate the variables.tf file.
 * @param {string} folderPath - The folder path to generate the file in.
 * @param {string} environment - The environment, 'prod' or 'dev'.
 */
export function generateVariables(folderPath: string, environment: string): void {
  const fileName = "variables.tf";

  const commonVariables = `
variable "tags" {
  type = list(object({
    name        = string
    deviceGroup = string
    color       = optional(string)
    comment     = optional(string)
  }))
}

variable "services" {
  type = list(object({
    name             = string
    deviceGroup      = string
    description      = optional(string)
    destinationPort  = optional(string)
    protocol         = optional(string)
    tags             = optional(list(string))
  }))
}

variable "addresses" {
  type = list(object({
    name        = string
    description = optional(string)
    type        = optional(string)
    value       = string
    deviceGroup = optional(string)
    tags        = optional(list(string))
  }))
}

variable "address_groups" {
  type = list(object({
    name        = string
    description = optional(string)
    deviceGroup = optional(string)
    addresses   = list(string)
    tags        = optional(list(string))
  }))
}

variable "url_categories" {
  type = list(object({
    name        = string
    deviceGroup = optional(string)
    description = optional(string)
    sites       = list(string)
  }))
}

variable "rule_groups" {
  type = list(object({
    deviceGroup = string
    rulebase    = optional(string)
    rules = list(object({
      name                 = string
      disabled             = string
      description          = string
      groupTag             = string
      sourceZones          = list(string)
      sourceAddresses      = list(string)
      destinationZones     = list(string)
      destinationAddresses = list(string)
      services             = list(string)
      applications         = list(string)
      categories           = list(string)
      action               = string
      spyware              = optional(string)
      vulnerability        = optional(string)
      virus                = optional(string)
      url_filtering        = optional(string)
      tags                 = list(string)
      log                  = string
    }))
  }))
}
`;

  writeFile(folderPath, fileName, commonVariables);

  if (environment.includes("p")) {
    const prodVariables = `
variable "api_key" {
  description = "API key for Panorama"
  type        = string
}

variable "storage_key" {
  description = "Storage Account key for tfstate"
  type        = string
}
`;

    writeFile(folderPath, fileName, prodVariables);
  }
}

/**
 * @deprecated Generate a deprecated tfvars for device groups.
 * @param {string} company - Company name.
 * @param {string} application - Application name.
 */
// export function generateDeviceGroupTfvars(company: string, application: string): void {
//   const fileName = 'terraform_device_group.auto.tfvars';

//   const deviceGroupTfvars = `
// company_device_group     = "${company}"
// application_device_group = "${application}"
// `;

//   // This function is deprecated, consider removing or updating its use-case.
//   // writeFile(company + "/" + application, fileName, deviceGroupTfvars);
// }
