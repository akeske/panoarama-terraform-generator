
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
