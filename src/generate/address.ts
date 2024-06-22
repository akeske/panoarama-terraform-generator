import * as Model from '../model';
import {
  writeFile,
  convertObj2String,
  removeDuplicates,
  MyError,
  deduplicateAndKeepOne,
  findUniqueNameValueDifferences,
  findInconsistentAddressGroups,
} from '../shared';

const fileName = 'terraform_addresses.auto.tfvars';

/**
 * Generate the tfvars file in json format with the Address and AddressGroup objects
 * @param {string} folderPath - The path where will generate the tfvars file
 * @param {Rule[]} rules - The Rule objects
 */
export function generateTfvars(folderPath: string, rules: Model.Rule[]): any {
  let addresses: Model.Address[] = [];
  let addressGroups: Model.AddressGroup[] = [];

  for (const rule of rules) {
    // create a new array with structuredClone and not a referenece
    addresses = [
      ...addresses,
      ...structuredClone(rule.sourceAddresses as Model.Address[]),
    ];
    addresses = [
      ...addresses,
      ...structuredClone(rule.destinationAddresses as Model.Address[]),
    ];
  }
  // Filter addresses with undefined values, dummy objects from rule-generator
  addresses = addresses.filter((addr) => addr.value !== undefined);

  // validate the addresses and address groups
  alertAddressGroup(rules);
  alertAddress(addresses);

  // addresses.forEach((addr) => {
  //   console.error(`${addr.name} - ${addr.value} ${addr.nameByUser} `);
  // });

  // Assuming 'addresses' is an array of objects with these properties
  for (const addr of addresses) {
    for (const scanAddr of addresses) {
      // Check if scanAddr.nameByUser is truthy, addr and scanAddr have the same value, but different names
      if (
        scanAddr.nameByUser &&
        addr.value === scanAddr.value &&
        addr.name !== scanAddr.name
      ) {
        // console.error(`${addr.name}/${addr.value} == ${scanAddr.name}/${scanAddr.value}`);
        // Merge address groups while avoiding nested arrays
        scanAddr.addressGroups = [...scanAddr.addressGroups, ...addr.addressGroups];
        const index = addresses.findIndex((item) => item.name === addr.name);
        if (index !== -1) addresses.splice(index, 1);
      }
    }
  }

  let newAddresses: Model.Address[] = [];
  for (const addr of addresses) {
    let exists = newAddresses.filter((obj) => obj.value === addr.value);
    if (exists.length > 0) {
      continue;
    }
    let tempAddressGroups: Model.AddressGroup[] = [];

    let temp: Model.Address[] = addresses.filter((obj) => obj.value === addr.value);
    let tempName: string = addr.name;
    for (let addr2 of temp) {
      if (addr2.addressGroups) {
        tempAddressGroups = [...tempAddressGroups, ...addr2.addressGroups];
      }
      if (addr2.name !== addr2.value) {
        tempName = addr2.name;
      }
    }
    newAddresses.push({
      name: tempName,
      description: addr.description,
      deviceGroup: (addr.deviceGroup as Model.DeviceGroup).name,
      type: addr.type,
      value: addr.value,
      tags: convertObj2String(addr.tags, 'name'),
      addressGroups: deduplicateAndKeepOne(tempAddressGroups, 'name'),
    });
  }

  // Overall, this script is designed to consolidate address group information,
  // ensuring that each group has a complete list of associated address names without duplicates,
  // and retains key metadata like descriptions and tags.
  for (let addr of newAddresses) {
    let addrGroups = addr.addressGroups;
    if (addrGroups) {
      for (let addrGroup of addrGroups) {
        let addressesString: string[] = [];
        for (let addr2 of newAddresses) {
          let addrGroups2 = addr2.addressGroups;
          if (addrGroups2) {
            for (let addrGroup2 of addrGroups2) {
              if (addrGroup2.name === addrGroup.name) {
                addressesString.push(addr2.name);
              }
            }
          }
        }
        addressGroups.push({
          name: addrGroup.name,
          description: addrGroup.description,
          deviceGroup: addrGroup.deviceGroup,
          addresses: removeDuplicates(addressesString),
          tags: addrGroup.tags,
        });
      }
    }
  }

  // remove duplicates
  addressGroups = addressGroups.filter(
    (obj, index, self) => self.findIndex((o) => o.name === obj.name) === index,
  );
  for (const addrGroup of addressGroups) {
    addrGroup.deviceGroup = addrGroup.deviceGroup
      ? (addrGroup as any).deviceGroup.name
      : 'undefined';

    addrGroup.tags = convertObj2String(addrGroup.tags, 'name');
  }

  // Generate Terraform string
  let terraformString = JSON.stringify({ address_groups: addressGroups }, null, 1)
    .replace(/"([^"]+)":/g, '$1:')
    .slice(1)
    .slice(0, -1)
    .replace(/:/g, '=');
  writeFile(folderPath, fileName, terraformString);

  terraformString = JSON.stringify({ addresses: newAddresses }, null, 1)
    .replace(/"([^"]+)":/g, '$1:')
    .slice(1)
    .slice(0, -1)
    .replace(/:/g, '=');
  writeFile(folderPath, fileName, terraformString);

  return { addressGroups: addressGroups, addresses: newAddresses };
}

/**
 * Append on main.tf the terraform resource
 * @param {string} folderPath - The input string
 */
export function generateTerraform(folderPath: string): void {
  let terraString = `
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
`;

  writeFile(folderPath, 'main.tf', terraString);
}

/**
 * Append on main.tf the terraform resource
 * @param {string} folderPath - The input string
 */
export function generateTerraformGroup(folderPath: string): void {
  let terraString = `
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
`;

  writeFile(folderPath, 'main.tf', terraString);
}

function alertAddress(addresses: Model.Address[]): void {
  const duplicateValues = findUniqueNameValueDifferences(addresses, 'name', 'value');
  // const duplicateNames = findUniqueNameValueDifferences(addresses, 'value', 'name');
  let duplicates: string[] = [];
  duplicateValues.forEach((value) => {
    duplicates.push(...value.names);
    // console.log(` - ${value.value} exist ${value.names.length} times`);
  });
  // duplicateNames.forEach((value, key) => {
  //   duplicates.push(...value.names);
  //   console.log(` -- ${value.value} exist ${value.names.length} times`);
  // });
  if (duplicates.length !== 0) {
    throw new MyError(
      `There are duplicate names on addresses, please check the csv file.\n Check "${duplicates}"`,
    );
  }
}

function alertAddressGroup(rules: Model.Rule[]): void {
  let addrGroup: Model.AddressGroup[] = [];
  rules.forEach((rule) => {
    if (rule.sourceIsAddressGroup) {
      addrGroup = [
        ...addrGroup,
        { name: rule.sourceAddressGroupNames![0], addresses: rule.sourceAddresses },
      ];
    }
    if (rule.destinationIsAddressGroup) {
      addrGroup = [
        ...addrGroup,
        {
          name: rule.destinationAddressGroupNames![0],
          addresses: rule.destinationAddresses,
        },
      ];
    }
  });
  let duplicates = findInconsistentAddressGroups(addrGroup);

  // addrGroup.forEach((addrg) => {
  //   console.error(`${addrg.name}`);
  //   addrg.addresses!.forEach((addr) => {
  //     console.error(` - ${(addr as any).name}`);
  //   });
  // });
  if (duplicates.length !== 0) {
    throw new MyError(
      `There are duplicate names on addresses, please check the csv file.\n Check "${duplicates}"`,
    );
  }
}
