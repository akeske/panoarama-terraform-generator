# Palo Alto best practice
# https://docs.paloaltonetworks.com/best-practices/internet-gateway-best-practices/best-practice-internet-gateway-security-policy/create-best-practice-security-profiles

# https://github.com/romarroca/palo-alto-best-practice/tree/main

# https://github.com/romarroca/palo-alto-best-practice/tree/main?tab=readme-ov-file

# provider "panos" {
#   hostname = "192.168.121.132"
#   # hostname           = "192.168.233.132"
#   username           = "admin"
#   password           = "Cc123456"
#   verify_certificate = false
#   timeout            = 180
# }

terraform {
  backend "azurerm" {
    resource_group_name  = "rg-paloalto"
    storage_account_name = "stpaloaltoprdweu"
    container_name       = "default"
    key                  = "default.tfstate"
  }
}

provider "panos" {
  hostname           = "192.168.233.132"
  api_key            = var.api_key
  timeout            = 180
  logging            = ["action", "op", "uid", "osx_curl"]
  verify_certificate = false
}

resource "panos_panorama_administrative_tag" "tag_basic_default" {
  name         = "Basic-Default"
  device_group = "Default"
  color        = "color41"
  comment      = "Basic default set of rules"

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_panorama_administrative_tag" "tag_default" {
  name         = "Default"
  device_group = "Default"
  color        = "color41"
  comment      = "Default tag group"

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_panorama_address_object" "default_sinkhole" {
  name         = "default-sinkhole-ip"
  device_group = "Default"
  description  = "sinkhole address"
  type         = "ip-netmask"
  value        = "172.18.0.250"
  tags         = [panos_panorama_administrative_tag.tag_default.name]

  lifecycle {
    create_before_destroy = true
  }
}

# https://github.com/romarroca/palo-alto-best-practice/blob/main/config/best-practice-spyware.json
resource "panos_anti_spyware_security_profile" "az_default_antispyware_profile" {
  name                  = "Az-Default-Anti-Spyware-Profile"
  device_group          = "Default"
  description           = "Azure Default Anti-Spyware Profile"
  sinkhole_ipv4_address = "172.18.0.250"
  sinkhole_ipv6_address = "::1"
  # botnet_list {
  #   name           = "default-paloalto-dns"
  #   action         = "sinkhole"
  #   packet_capture = "disable"
  # }
  # botnet_list {
  #   name           = "default-paloalto-cloud"
  #   action         = "allow"
  #   packet_capture = "disable"
  # }
  rule {
    name           = "simple-critical"
    threat_name    = "any"
    category       = "any"
    action         = "reset-both"
    packet_capture = "single-packet"
    severities     = ["critical"]
  }
  rule {
    name           = "simple-high"
    threat_name    = "any"
    category       = "any"
    action         = "reset-both"
    packet_capture = "single-packet"
    severities     = ["high"]
  }
  rule {
    name           = "simple-medium"
    threat_name    = "any"
    category       = "any"
    action         = "alert" # "reset-both"
    packet_capture = "single-packet" # "single-packet"
    severities     = ["medium"]
  }
  rule {
    name           = "simple-low"
    threat_name    = "any"
    category       = "any"
    action         = "default"
    packet_capture = "disable"
    severities     = ["low"]
  }
  rule {
    name           = "simple-informational"
    threat_name    = "any"
    category       = "any"
    action         = "default"
    packet_capture = "disable"
    severities     = ["informational"]
  }

  dns_category {
    name           = "pan-dns-sec-adtracking"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "single-packet"
  }
  dns_category {
    name           = "pan-dns-sec-cc"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "extended-capture"
  }
  dns_category {
    name           = "pan-dns-sec-ddns"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "single-packet"
  }
  dns_category {
    name           = "pan-dns-sec-grayware"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "single-packet"
  }
  dns_category {
    name           = "pan-dns-sec-malware"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "single-packet"
  }
  dns_category {
    name           = "pan-dns-sec-parked"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "disable"
  }
  dns_category {
    name           = "pan-dns-sec-phishing"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "disable"
  }
  dns_category {
    name           = "pan-dns-sec-proxy"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "single-packet"
  }
  dns_category {
    name           = "pan-dns-sec-recent"
    log_level      = "default"
    action         = "sinkhole"
    packet_capture = "disable"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_url_filtering_security_profile" "az_default_url_filtering_profile" {
  name                    = "Az-Default-URL-Filtering-Profile"
  device_group            = "Default"
  description             = "Azure Default URL Filtering Profile"
  ucd_log_severity        = "medium"
  log_container_page_only = true
  alert_categories = [
    "computer-and-internet-info",
    "content-delivery-networks",
    "medium-risk",
    "artificial-intelligence"
  ]
  block_categories = [
    "abortion",
    "alcohol-and-tobacco",
    "auctions",
    "business-and-economy",
    "cryptocurrency",
    # "scanning-activity",
    "dating",
    "educational-institutions",
    "encrypted-dns",
    "entertainment-and-arts",
    "financial-services",
    "games",
    "government",
    "health-and-medicine",
    "high-risk",
    "home-and-garden",
    "hunting-and-fishing",
    "internet-communications-and-telephony",
    "internet-portals",
    "job-search",
    "legal",
    # "low-risk",
    "military",
    "motor-vehicles",
    # "marijuana",
    "music",
    "news",
    "nudity",
    "online-storage-and-backup",
    "personal-sites-and-blogs",
    "philosophy-and-political-advocacy",
    "private-ip-addresses",
    "real-estate",
    "real-time-detection",
    "recreation-and-hobbies",
    "reference-and-research",
    "religion",
    "search-engines",
    "sex-education",
    "shareware-and-freeware",
    "shopping",
    "social-networking",
    "society",
    "sports",
    "stock-advice-and-tools",
    "streaming-media",
    "swimsuits-and-intimate-apparel",
    "training-and-tools",
    "translation",
    "travel",
    "web-advertisements",
    "web-based-email",
    "web-hosting",
    "abused-drugs",
    "adult",
    "command-and-control",
    "copyright-infringement",
    "dynamic-dns",
    "extremism",
    "gambling",
    "grayware",
    "hacking",
    "insufficient-content",
    "malware",
    "newly-registered-domain",
    "not-resolved",
    "parked",
    "peer-to-peer",
    "phishing",
    "proxy-avoidance-and-anonymizers",
    "questionable",
    "ransomware",
    "unknown",
    "weapons"
  ]
  ucd_block_categories = [
    "abortion",
    "alcohol-and-tobacco",
    "auctions",
    # "artificial-intelligence",
    # "scanning-activity",
    "business-and-economy",
    "content-delivery-networks",
    "cryptocurrency",
    "dating",
    "educational-institutions",
    "encrypted-dns",
    "entertainment-and-arts",
    "financial-services",
    "games",
    "government",
    "health-and-medicine",
    "high-risk",
    "home-and-garden",
    "hunting-and-fishing",
    "internet-communications-and-telephony",
    "internet-portals",
    "job-search",
    "legal",
    # "low-risk",
    # "medium-risk",
    "military",
    "motor-vehicles",
    "music",
    "news",
    "nudity",
    "online-storage-and-backup",
    "personal-sites-and-blogs",
    "philosophy-and-political-advocacy",
    "private-ip-addresses",
    "real-estate",
    "real-time-detection",
    "recreation-and-hobbies",
    "reference-and-research",
    "religion",
    "search-engines",
    "sex-education",
    "shareware-and-freeware",
    "shopping",
    "social-networking",
    "society",
    "sports",
    "stock-advice-and-tools",
    "streaming-media",
    "swimsuits-and-intimate-apparel",
    "training-and-tools",
    "translation",
    "travel",
    "web-advertisements",
    "web-based-email",
    "web-hosting",
    "abused-drugs",
    "adult",
    "command-and-control",
    "copyright-infringement",
    "dynamic-dns",
    "extremism",
    "gambling",
    "grayware",
    "hacking",
    "insufficient-content",
    "malware",
    "newly-registered-domain",
    "not-resolved",
    "parked",
    "peer-to-peer",
    "phishing",
    "proxy-avoidance-and-anonymizers",
    "questionable",
    "ransomware",
    "unknown",
    "weapons"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_edl" "az_external_dynamic_list_1" {
  name         = "EDL-Block-List-De-IPs"
  device_group = "Default"
  description  = "List from blocklist.de"
  type         = "ip"
  source       = "https://lists.blocklist.de/lists/all.txt"
  repeat       = "every five minutes"

  lifecycle {
    create_before_destroy = true
  }

}

resource "panos_edl" "az_external_dynamic_list_2" {
  name         = "EDL-Emerging-Threats-Net-IPs"
  device_group = "Default"
  description  = "List from emergingthreats.net"
  type         = "ip"
  source       = "https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt"
  repeat       = "every five minutes"

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_vulnerability_security_profile" "az_default_vulnerability_profile" {
  name         = "Az-Default-Vulnerability-Porfile"
  device_group = "Default"
  description  = "Azure Default Vulnerability Profile"
  rule {
    name           = "critical-high"
    category       = "any"
    threat_name    = "any"
    action         = "reset-both"
    host           = "any"
    severities     = ["critical", "high"]
    cves           = ["any"]
    vendor_ids     = ["any"]
    packet_capture = "single-packet"
  }
  rule {
    name           = "medium-low"
    category       = "any"
    threat_name    = "any"
    action         = "default"
    host           = "any"
    severities     = ["medium", "low"]
    cves           = ["any"]
    vendor_ids     = ["any"]
    packet_capture = "single-packet"
  }
  rule {
    name           = "informational"
    category       = "any"
    threat_name    = "any"
    action         = "default"
    host           = "any"
    severities     = ["informational"]
    cves           = ["any"]
    vendor_ids     = ["any"]
    packet_capture = "disable"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_antivirus_security_profile" "az_default_antivirus_profile" {
  name           = "Az-Default-Antivirus-Profile"
  device_group   = "Default"
  description    = "Azure Default Antivirus Profile"
  packet_capture = true
  decoder {
    name                    = "smtp"
    action                  = "reset-both"
    wildfire_action         = "reset-both"
    machine_learning_action = "reset-both"
  }
  decoder { name = "smb" }
  decoder {
    name                    = "pop3"
    action                  = "reset-both"
    wildfire_action         = "reset-both"
    machine_learning_action = "reset-both"
  }
  decoder {
    name                    = "imap"
    action                  = "reset-both"
    wildfire_action         = "reset-both"
    machine_learning_action = "reset-both"
  }
  decoder {
    name   = "http"
    action = "alert"
  }
  decoder {
    name = "http2"
    action = "alert"
  }
  decoder {
    name   = "ftp"
    action = "reset-both"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_security_rule_group" "porifiling_rules" {
  device_group     = "Default"
  rulebase         = "pre-rulebase"
  position_keyword = "top"

  rule {
    name                  = "Block-Malicious-IPs-1"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    source_zones          = ["Public"]
    source_addresses 	  = [panos_edl.az_external_dynamic_list_1.name, panos_edl.az_external_dynamic_list_2.name, " Palo Alto Networks - High risk IP addresses", " Palo Alto Networks - Known malicious IP addresses"]
    source_users          = ["any"]
    destination_zones     = ["Private"]
    destination_addresses = ["any"]
    applications          = ["any"]
    services              = ["any"]
    categories            = ["any"]
    action                = "allow"
    log_start             = true
    log_setting           = "Panorama-Logs"
  }
  rule {
    name                  = "Block-Malicious-IPs-2"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    source_zones          = ["Private"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["Public"]
    destination_addresses = [panos_edl.az_external_dynamic_list_1.name, panos_edl.az_external_dynamic_list_2.name, " Palo Alto Networks - High risk IP addresses", " Palo Alto Networks - Known malicious IP addresses"]
    applications          = ["any"]
    services              = ["any"]
    categories            = ["any"]
    action                = "drop"
    log_start             = true
    log_setting           = "Panorama-Logs"
  }
  rule {
    name                  = "Block-Sinkhole"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    description           = "Block sinkhole IP"
    source_zones          = ["any"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["any"]
    destination_addresses = [panos_panorama_address_object.default_sinkhole.name]
    applications          = ["dns"]
    services              = ["any"]
    categories            = ["any"]
    action                = "drop"
    log_start             = true
    log_setting           = "Panorama-Logs"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_security_rule_group" "cleanup_rules" {
  device_group     = "Default"
  rulebase         = "post-rulebase"
  position_keyword = "top"

  rule {
    name                  = "Block-Quic-Protocol"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    description           = "Block quic protocol"
    source_zones          = ["any"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["any"]
    destination_addresses = ["any"]
    applications          = ["quic"]
    services              = ["any"]
    categories            = ["any"]
    action                = "deny"
    log_start             = true
    log_setting           = "Panorama-Logs"
  }
  rule {
    name                  = "Block-URL-filtering"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    description           = "Block depends on URL filtering"
    source_zones          = ["Private"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["Public"]
    destination_addresses = ["any"]
    applications          = ["web-browsing", "ssl"]
    services              = ["application-default"]
    categories            = ["any"]
    action                = "allow"
    spyware               = panos_anti_spyware_security_profile.az_default_antispyware_profile.name
    vulnerability         = panos_vulnerability_security_profile.az_default_vulnerability_profile.name
    virus                 = panos_antivirus_security_profile.az_default_antivirus_profile.name
    url_filtering         = panos_url_filtering_security_profile.az_default_url_filtering_profile.name
    log_setting           = "Panorama-Logs"
  }
  rule {
    name                  = "Clean-Up-Internal"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    description           = "Block internal traffic"
    source_zones          = ["Private"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["Private"]
    destination_addresses = ["any"]
    applications          = ["any"]
    services              = ["any"]
    categories            = ["any"]
    action                = "deny"
    log_setting           = "Panorama-Logs"
  }
  rule {
    name                  = "Clean-Up-Any"
    group_tag             = panos_panorama_administrative_tag.tag_default.name
    tags                  = [panos_panorama_administrative_tag.tag_basic_default.name]
    type                  = "universal"
    description           = "Block default any"
    source_zones          = ["any"]
    source_addresses      = ["any"]
    source_users          = ["any"]
    destination_zones     = ["any"]
    destination_addresses = ["any"]
    applications          = ["any"]
    services              = ["any"]
    categories            = ["any"]
    action                = "drop"
    log_setting           = "Panorama-Logs"
  }

  lifecycle {
    create_before_destroy = true
  }
}