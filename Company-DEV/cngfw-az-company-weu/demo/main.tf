
provider "panos" {
#  hostname           = "192.168.121.132"
  hostname           = "192.168.233.132"
  username           = "admin"
  password           = "Cc123456"
  verify_certificate = false
  timeout            = 180
}

resource "panos_panorama_administrative_tag" "tags" {
  count        = length(var.tags)
  name         = var.tags[count.index].name
  device_group = var.tags[count.index].deviceGroup
  color        = var.tags[count.index].color
  comment      = var.tags[count.index].comment

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_custom_url_category" "url_category" {
  count        = length(var.url_categories)
  name         = var.url_categories[count.index].name
  device_group = var.url_categories[count.index].deviceGroup
  description  = var.url_categories[count.index].description
  sites        = var.url_categories[count.index].sites
  type         = "URL List"

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_panorama_service_object" "services" {
  depends_on       = [panos_panorama_administrative_tag.tags]
  count            = length(var.services)
  name             = var.services[count.index].name
  description      = var.services[count.index].description
  device_group     = var.services[count.index].deviceGroup
  protocol         = var.services[count.index].protocol
  destination_port = var.services[count.index].destinationPort
  tags             = var.services[count.index].tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_panorama_address_object" "addresses" {
  depends_on   = [panos_panorama_administrative_tag.tags]
  count        = length(var.addresses)
  name         = var.addresses[count.index].name
  description  = var.addresses[count.index].description
  type         = var.addresses[count.index].type
  value        = var.addresses[count.index].value
  device_group = var.addresses[count.index].deviceGroup
  tags         = var.addresses[count.index].tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_panorama_address_group" "address_groups" {
  depends_on       = [panos_panorama_address_object.addresses, panos_panorama_administrative_tag.tags]
  count            = length(var.address_groups)
  name             = var.address_groups[count.index].name
  description      = var.address_groups[count.index].description
  device_group     = var.address_groups[count.index].deviceGroup
  static_addresses = var.address_groups[count.index].addresses
  tags             = var.address_groups[count.index].tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_security_rule_group" "rule_groups" {
  depends_on       = [panos_panorama_service_object.services, panos_panorama_address_object.addresses, panos_panorama_address_group.address_groups, panos_panorama_administrative_tag.tags]
  count            = length(var.rule_groups)
  device_group     = var.rule_groups[count.index].deviceGroup
  rulebase         = var.rule_groups[count.index].rulebase
  position_keyword = "top"

  dynamic "rule" {
    for_each = var.rule_groups[count.index].rules
    content {
      name                  = rule.value.name
      disabled              = rule.value.disabled
      # description           = rule.value.description
      type                  = "universal"
      group_tag             = rule.value.groupTag
      source_zones          = rule.value.sourceZones
      source_addresses      = rule.value.sourceAddresses
      source_users          = ["any"]
      negate_source         = false
      destination_zones     = rule.value.destinationZones
      destination_addresses = rule.value.destinationAddresses
      negate_destination    = false
      applications          = rule.value.applications
      services              = rule.value.services
      categories            = rule.value.categories
      action                = rule.value.action
      tags                  = rule.value.tags
      log_start             = false
      log_end               = rule.value.log
      spyware               = rule.value.spyware
      vulnerability         = rule.value.vulnerability
      virus                 = rule.value.virus
      url_filtering         = rule.value.url_filtering
      negate_target         = false
      # hip_profiles          = ["any"]
      # log_setting           = "Panorama-Logs"
    }
  }
}
