/**
 * Represents a group of security rules in a firewall configuration.
 */
export class RuleGroup {
  // resource?: string = 'panos_security_rule_group'
  deviceGroup!: DeviceGroup | string;
  rulebase?: string; // pre-rulebase (default), post-rulebase, or rulebase
  rules!: Rule[];
}

/**
 * Represents a security rule in a firewall configuration.
 */
export class Rule {
  name: string;
  description?: string | null;
  disabled = "Enabled"; // default: enabled
  groupTag?: string;
  sourceType!: "Service" | "Application" | "EDR" | "URL";
  sourceZones!: Zone[] | string[];
  sourceAddresses!: Address[] | string[];
  sourceIsAddressGroup?: boolean;
  sourceAddressGroupNames?: string[];
  destinationType!: "Service" | "Application" | "EDR" | "URL";
  destinationZones!: Zone[] | string[];
  destinationAddresses!: Address[] | string[];
  destinationIsAddressGroup?: boolean;
  destinationAddressGroupNames?: string[];
  services: Service[] | string[] = ["application-default"]; // default: application-default
  applications?: AppliPedia[] | string[];
  categories?: UrlCategory[] | string[];
  action: "allow" | "deny" | "drop" = "deny"; // default: deny
  tags?: Tag[] | string[];
  log = "TRUE"; // default: TRUE
  deviceGroup!: DeviceGroup | string;
  spyware?: string;
  vulnerability?: string;
  virus?: any;
  urlFiltering?: string;

  constructor(name: string) {
    this.name = name;
  }
}

/**
 * Represents a security zone in a firewall configuration.
 */
export class Zone {
  // resource?: string = 'panos_zone'
  name!: string;
  tamplate?: string;
  mode?: string = "layer3"; // default: layer3, other modes: layer2, virtual-wire, tap, or tunnel
  interfaces?: string[];
}

/**
 * Represents a custom URL category in a firewall configuration.
 */
export class UrlCategory {
  // resource?: string = 'panos_custom_url_category'
  name?: string;
  description?: string;
  sites?: string[];
  deviceGroup?: DeviceGroup | string;
}

/**
 * Represents a service in a firewall configuration.
 */
export class Service {
  // resource?: string = 'panos_panorama_service_object'
  name!: string;
  protocol?: "tcp" | "udp";
  description?: string;
  destinationPort?: string;
  deviceGroup?: DeviceGroup | string;
  tags?: Tag[] | string[];
}

/**
 * Represents an address in a firewall configuration.
 */
export class Address {
  // resource?: string = 'panos_panorama_address_object'
  name!: string;
  description?: string;
  deviceGroup?: DeviceGroup | string;
  type?: "ip-netmask" | "ip-range" | "fqdn" | "ip-wildcard";
  value?: string;
  tags?: Tag[] | string[];

  addressGroups: AddressGroup[] = [];
  nameByUser?: boolean;
}

/**
 * Represents an address group in a firewall configuration.
 */
export class AddressGroup {
  // resource?: string = 'panos_panorama_address_group'
  name!: string;
  description?: string;
  deviceGroup?: DeviceGroup | string;
  addresses?: Address[] | string[];
  tags?: Tag[] | string[];
}

/**
 * Represents a tag in a firewall configuration.
 */
export class Tag {
  // resource?: string = 'panos_administrative_tag'
  name!: string;
  color?: string; // color1 - color42
  deviceGroup?: DeviceGroup | string;
  comment?: string;
}

/**
 * Represents a device group in a firewall configuration.
 */
export class DeviceGroup {
  // resource?: string = 'panos_device_group'
  name!: string;
  parentDeviceGroupName?: string;
  description?: string;

  rules?: Rule[];
}

/**
 * Represents a parent-child relationship between device groups in a firewall configuration.
 */
export class DeviceGroupParent {
  // resource?: string = 'panos_device_group_parent'
  device_group!: DeviceGroup;
  parent!: DeviceGroup;
}

/**
 * Application object for Palo Alto Networks.
 */
export interface PAApplication {
  service: string;
  applications: any;
}

/**
 * Profile interface.
 */
export interface Profile {
  entity: string;
  name: string;
  applications: any;
  direction: string;
}

/**
 * CSV model interface.
 */
export interface CSVModel {
  Firewall: "az-company-weu" | "az-company-ne";
  Application: string;
  Status: "Enabled" | "Disabled";
  Enviroment: "Prod" | "Dev" | "Stage" | "UAT" | "Shared" | string;
  Vendor: string;
  RuleName: string;
  SourceGroupName?: any;
  Source?: any;
  DestinationType: "Service" | "URL" | "EDR";
  DestinationGroupName?: any;
  Destination?: any;
  Services?: any;
  Direction: "Inbound" | "Outbound" | "Internal";
  Action: "Allow" | "Deny" | "Drop";
  Tags?: any;
  BusinessPurpose?: string;
  Comment?: string;
  Protocol: any;
  Log: boolean;
  // RuleCollectionName?: string
  // RulePriority?: any
  // ActionType?: 'Allow' | 'Deny'
  // RUleConnectionType?: string
  // Name?: string
  // protocols?: any
  // SourceAddresses?: any
  // SourceIPsGroup?: any
  // Source?: any
  // DestinationAddresses?: any
  // DestinationIPsGroup?: any
  // Destination?: any
  // DestinationPorts?: any
  // DestinationFQDNs?: any
  // Hits?: any
}

/**
 * Represents a service according to the IANA standard.
 */
export class IANAService {
  name!: string;
  port!: string;
  protocol!: string;
  description!: string;
}

/**
 * Represents an application in AppliPedia.
 */
export class AppliPedia {
  name!: string;
  category?: string;
  subCategory?: string;
  risk?: string;
  technology?: string;
  standardPorts?: string;
  description?: string;
}
