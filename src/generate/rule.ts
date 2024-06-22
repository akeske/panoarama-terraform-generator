import * as Model from "../model";
import { writeFile, convertObj2String, MyError, findDuplicateByValue } from "../shared";

const fileName = "terraform_rules.auto.tfvars";

/**
 * Check if the given address names exist in the list of addresses or address groups.
 * @param values - The list of address names to check.
 * @param addresses - The list of Model.Address objects.
 * @param addressGroups - The list of Model.AddressGroup objects.
 * @returns True if all address names exist, otherwise false.
 */
function addressObjectsExist(
  values: string[],
  addresses: Model.Address[] = [],
  addressGroups: Model.AddressGroup[] = []
): boolean {
  if (values.includes("any")) {
    return true;
  }

  // Ensure addresses and addressGroups are arrays
  if (!Array.isArray(addresses) || !Array.isArray(addressGroups)) {
    throw new Error("Addresses or AddressGroups must be valid arrays");
  }

  const inAddresses = values.every((val) => addresses.some((addr) => addr.name === val));
  const inAddressGroups = values.every((val) =>
    addressGroups.some((group) => group.name === val)
  );
  return inAddresses || inAddressGroups;
}

/**
 * Standardize source and destination addresses in a rule.
 * @param addresses - List of Model.Address objects.
 * @returns A standardized list of addresses.
 */
function standardizeAddresses(addressList: Model.Address[]): string[] {
  if (!addressList || addressList.length === 0) {
    return ["any"];
  }

  const firstAddress = addressList[0] as Model.Address;
  if (firstAddress.addressGroups.length > 0) {
    const sameGroup = addressList.every(
      (addr) =>
        (addr as Model.Address).addressGroups[0]?.name ===
        firstAddress.addressGroups[0]?.name
    );

    if (sameGroup) {
      return [firstAddress.addressGroups[0].name];
    }
  }

  return convertObj2String(addressList, "name");
}

/**
 * Generates the terraform variable file for Rule objects in JSON format.
 * @param folderPath - Directory path to generate the file in.
 * @param firewallName - Name of the firewall, used to filter tags.
 * @param applicationName - Name of the application.
 * @param devGroup - The device group where the rules will be added.
 * @param rules - List of Model.Rule objects to include in the file.
 * @param addrObject - Address object containing addresses and address groups.
 */
export function generateTfvars(
  folderPath: string,
  firewallName: string,
  applicationName: string,
  devGroup: Model.DeviceGroup,
  rules: Model.Rule[],
  addrObject: { addresses: Model.Address[]; addressGroups: Model.AddressGroup[] }
): void {
  let addresses: Model.Address[] = [];
  for (const rule of rules) {
    addresses = [...addresses, ...(rule.sourceAddresses as Model.Address[])];
    addresses = [...addresses, ...(rule.destinationAddresses as Model.Address[])];
  }

  for (let rule of rules) {
    for (let addr of addresses) {
      let exists = [...(addresses as Model.Address[])].find(
        (obj) => obj.value === addr.value && obj.nameByUser === true
      );
      if (exists) {
        const index = (rule.sourceAddresses as Model.Address[]).findIndex(
          (ad) => ad.name === addr.name
        );
        if (index !== -1) {
          // Replace the object at the found index
          rule.sourceAddresses[index] = exists;
        }
        const index2 = (rule.destinationAddresses as Model.Address[]).findIndex(
          (ad) => ad.name === addr.name
        );
        if (index2 !== -1) {
          // Replace the object at the found index
          rule.destinationAddresses[index2] = exists;
        }
      }
    }
  }

  // Process each rule to standardize its attributes
  for (const rule of rules) {
    // source
    rule.sourceZones =
      rule.sourceZones.length > 0 ? convertObj2String(rule.sourceZones, "name") : ["any"];

    // Standardize source addresses
    if (rule.sourceIsAddressGroup) {
      rule.sourceAddresses = rule.sourceAddressGroupNames as string[];
    } else {
      rule.sourceAddresses = standardizeAddresses(
        rule.sourceAddresses as Model.Address[]
      );
    }

    // console.error(rule.name);
    // Ensure all source addresses are valid
    if (
      !addressObjectsExist(
        rule.sourceAddresses,
        addrObject.addresses,
        addrObject.addressGroups
      )
    ) {
      throw new MyError("The source address is wrong configured.", rule.name);
    }

    // Standardize destination zones
    rule.destinationZones =
      rule.destinationZones.length > 0
        ? convertObj2String(rule.destinationZones, "name")
        : ["any"];

    // Standardize destination addresses
    if (rule.destinationIsAddressGroup) {
      rule.destinationAddresses = rule.destinationAddressGroupNames as string[];
    } else {
      rule.destinationAddresses = standardizeAddresses(
        rule.destinationAddresses as Model.Address[]
      );
    }

    // Ensure all destination addresses are valid
    if (
      !addressObjectsExist(
        rule.destinationAddresses,
        addrObject.addresses,
        addrObject.addressGroups
      )
    ) {
      throw new MyError("The destination address is wrong configured.", rule.name);
    }

    // Standardize services
    if (typeof rule.services[0] === "object") {
      rule.services = convertObj2String(rule.services, "name");
      if (rule.services[0] === "*") {
        rule.services[0] = "any";
      }
    } else {
      rule.services = ["application-default"];
    }

    // Applications
    rule.applications = rule.applications ?? ["any"];

    // Standardize tags
    const lowercaseApplicationName = applicationName.toLowerCase();
    const lowercaseFirewallName = firewallName.toLowerCase();
    rule.tags = rule.tags ? convertObj2String(rule.tags, "name") : [];
    rule.tags = rule.tags.filter(
      (_tag, index, self) =>
        self.findIndex((t) => t.toLowerCase() === lowercaseApplicationName) !== index &&
        self.findIndex((t) => t.toLowerCase() === lowercaseFirewallName) !== index
    );

    // URL Categories
    rule.categories = rule.categories
      ? convertObj2String(rule.categories, "name")
      : ["any"];

    // find duplicates
    let duplicates = findDuplicateByValue(rules, "name");
    if (duplicates.length !== 0) {
      throw new MyError(
        `There are duplicate rule names, please check the csv file.`,
        JSON.stringify(convertObj2String(duplicates, "name"))
      );
    }

    // validate rule
    if (
      (rule.sourceAddresses as string[]).includes("any") &&
      (rule.destinationAddresses as string[]).includes("any")
    ) {
      throw new MyError("The source and destination are any.", rule.name);
    }
    if (
      (rule.destinationAddresses as string[]).includes("any") &&
      (rule.destinationZones as string[]).includes("any")
    ) {
      throw new MyError(
        "The rule must not connect to any network, be more strict.",
        rule.name
      );
    }
    // if any application/service for internal network throw error
    // if (
    //   (rule.applications as string[]).includes('any') &&
    //   (rule.services as string[]).includes('any') &&
    //   (rule.destinationZones as string[]).includes('Private') &&
    //   rule.groupTag?.toLowerCase() !== 'baseline'
    // ) {
    //   throw new MyError(
    //     'The rule must have more strict services and not any.',
    //     rule.name,
    //   );
    // }
  }

  // Create a RuleGroup for output
  const ruleGroup: Model.RuleGroup = {
    deviceGroup: devGroup.name,
    rulebase: "pre-rulebase",
    rules: rules,
  };

  // Prepare the output string in Terraform format
  const terraString = JSON.stringify({ rule_groups: [ruleGroup] }, null, 1)
    .replace(/"([^"]+)":/g, "$1:")
    .slice(1)
    .slice(0, -1)
    .replace(/:/g, "=");

  // Write to file
  writeFile(folderPath, fileName, terraString);
}

/**
 * Generates a Terraform configuration for a resource file.
 * @param folderPath - Path to write the Terraform configuration.
 * @param applicationName - Name of the application.
 * @param env - Environment name (to determine log settings).
 * @param rulePosition - Desired position of the rules (top or bootom of pre-rules section).
 * @param useChatgpt - Use or not ChatGPT to descrive the rule else will leave it empty.
 */
export function generateTerraform(
  folderPath: string,
  applicationName: string,
  env: string,
  rulePosition: string,
  useChatgpt: string
): void {
  let terraString = `
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
      description           = rule.value.description
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
      log_setting           = "Panorama-Logs"
    }
  }
}
`;

  if (
    !useChatgpt.toLowerCase().startsWith("y") &&
    !useChatgpt.toLowerCase().startsWith("t")
  ) {
    terraString = terraString.replace("description", `# description`);
  }

  if (!env.includes("p")) {
    terraString = terraString.replace("log_setting", `# log_setting`);
  }
  if (
    !applicationName.includes("baseline") &&
    !(rulePosition && rulePosition.includes("top"))
  ) {
    terraString = terraString.replace("position_keyword", `# position_keyword`);
  }

  // Write to main Terraform configuration
  writeFile(folderPath, "main.tf", terraString);
}
