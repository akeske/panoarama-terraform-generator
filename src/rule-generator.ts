import {
  CSVModel,
  PAApplication,
  IANAService,
  Rule,
  Zone,
  Tag,
  Address,
  Service,
  DeviceGroup,
  AddressGroup,
  UrlCategory,
  Profile,
} from "./model";
import {
  generateId,
  convert2PascalCase,
  convertToString,
  isIPv4,
  subnetInfo,
  generateDescription,
  isString,
  generateNumberInRange,
  checkIfPortRange,
  MyError,
  findProfileFromCSV,
  findDuplicateObject,
} from "./shared";

/**
 * Create a description for the rule based on CSV data.
 * @param {CSVModel} row - The CSV data row.
 * @returns {string} - The rule description.
 */
function createRuleDescription(row: CSVModel): string {
  let description = `${row.RuleName.trim()}.`;

  if (row.BusinessPurpose) {
    description = `Business purpose: '${row.BusinessPurpose}'.`;
  }

  if (row.Comment) {
    description += ` Comment: '${row.Comment}'`;
  }

  return description;
}

/**
 * Determine the rule action based on the action string.
 * @param {string} action - The action string.
 * @returns {'allow' | 'deny' | 'drop'} - The rule action.
 */
function determineRuleAction(action: string): "allow" | "deny" | "drop" {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("allow")) {
    return "allow";
  }
  if (lowerAction.includes("deny")) {
    return "deny";
  }
  return "drop";
}

/**
 * Determine the source and destination zones based on the direction.
 * @param {string} direction - The direction (inbound, outbound, internal).
 * @returns {{source: Zone[], destination: Zone[]}} - The source and destination zones.
 */
function determineZones(direction: string): { source: Zone[]; destination: Zone[] } {
  const privateZone = { name: "Private" };
  const publicZone = { name: "Public" };

  const lowerDirection = direction.toLowerCase();
  if (lowerDirection.includes("inbound")) {
    return { source: [publicZone], destination: [privateZone] };
  } else if (lowerDirection.includes("outbound")) {
    return { source: [privateZone], destination: [publicZone] };
  } else if (lowerDirection.includes("internal")) {
    return { source: [privateZone], destination: [privateZone] };
  } else {
    return { source: [], destination: [] }; // Set to "any" if undefined
  }
}

/**
 * Determine the color for environment tags.
 * @param {string} env - The environment string.
 * @returns {string} - The color for the environment tag.
 */
function determineEnvironmentColor(env: string): string {
  const lowerEnv = env.toLowerCase();
  if (lowerEnv.includes("prod")) {
    return "color42"; // Chestnut
  } else if (lowerEnv.includes("dev")) {
    return "color4"; // Yellow
  } else if (lowerEnv.includes("stage")) {
    return "color6"; // Purple
    // } else if (row.Application.toLowerCase().includes("baseline")) {
    //   colorTag = "color24"; // azure
    // } else if (row.Application.toLowerCase().includes("company-baseline")) {
    //   colorTag = "color24"; // azure
    // let tagFirewall = {
    //   name: row.Firewall,
    //   color: `color${generateNumberInRange(row.Firewall.trim().toLowerCase())}`,
    //   deviceGroup: parentDG,
    //   comment: "Firewall tag",
    // };
    // tags.push(tagFirewall);
    // rule.groupTag = tagFirewall.name;
  } else {
    return `color${generateNumberInRange(env.trim().toLowerCase())}`;
  }
}

/**
 * Geerate the CSVModel rules from csv file to Rule objects
 * @param {DeviceGroup} parentDG - The device group 'Company'
 * @param {DeviceGroup} deviceGroup - The device group where the rules will be inserted
 * @param {CSVModel[]} csvData - The array of CSVModel objects from csv file
 * @param {IANAService[]} ianaServs - The service objects from IANA if needed
 * @param {PAApplication[]} paApplications - The Palo Alto mapping from service port to AppID
 * @returns {Promise<Rule[]>} - The array of Rule objects
 */
export async function generateRuleObjects(
  useChatgpt: string,
  parentDG: DeviceGroup,
  deviceGroup: DeviceGroup,
  csvData: CSVModel[],
  ianaServs?: IANAService[],
  paApplications?: PAApplication[],
  profilePerApps?: Profile[],
  company?: string
): Promise<Rule[] | undefined> {
  const rules: Rule[] = [];
  let counter = 0;

  // Iterate over the CSV data to create rules
  for (const row of csvData) {
    const ruleName = convert2PascalCase(
      row.RuleName.replace(/[^\w ]/g, " ").substring(0, 55)
    );
    const ruleDescription = createRuleDescription(row);
    const ruleStatus = row.Status.toLowerCase().includes("enabled") ? "false" : "true";
    const ruleAction = determineRuleAction(row.Action);
    const sourceAndDestinationZones = determineZones(row.Direction);

    const rule = new Rule(ruleName);
    console.info(`${row.RuleName}`);
    rule.description = ruleDescription;
    rule.disabled = ruleStatus;
    rule.action = ruleAction;
    rule.log = row.Log ? row.Log.toString().toLowerCase() : "true";
    // Assign zones based on rule direction
    rule.sourceZones = sourceAndDestinationZones.source;
    rule.destinationZones = sourceAndDestinationZones.destination;

    let tags: Tag[] = [];

    // Application Tag
    let applicationTagColor = `color${generateNumberInRange(
      row.Application.trim().toLowerCase()
    )}`;
    let tagApplication = {
      name: convert2PascalCase(row.Application.trim()),
      color: applicationTagColor,
      deviceGroup: parentDG,
      comment: "Application tag",
    };
    tags.push(tagApplication);
    rule.groupTag = tagApplication.name;

    // Environment Tag
    const envColor = determineEnvironmentColor(row.Enviroment);
    let tagEnviroment = {
      name: convert2PascalCase(row.Enviroment.trim()),
      color: envColor,
      deviceGroup: parentDG,
      comment: "Enviroment tag",
    };
    tags.push(tagEnviroment);

    // User-defined Tags
    row.Tags.forEach((tagString: string) => {
      if (tagString.length > 0) {
        const tag: Tag = {
          name: convert2PascalCase(tagString.trim()),
          color: "color11", // Custom tag color
          comment: "User tag",
          deviceGroup: deviceGroup,
        };
        tags.push(tag);
      }
    });
    rule.tags = tags;

    let services: Service[] = [];
    let applications: string[] = [];
    let serviceStrings: string[] = [];
    if (row.Services.length === 0) {
      throw new MyError(
        "You must define a service/application. Use * or ssl for URL rules.",
        rule.name,
        ++counter
      );
    }
    for (let rowService of row.Services) {
      // by pass application and use service instead
      let byPassApplication = false;
      if (rowService.startsWith("!")) {
        rowService = rowService.substring(1);
        byPassApplication = true;
      }
      const paApp = paApplications?.find((app) => {
        return app.service === rowService;
      });
      if (paApp && !byPassApplication) {
        // found the application from convertion of port to applicaiton
        applications.push(...paApp.applications);
      } else if (
        // it is string from Palo Alto Application list
        isString(rowService) &&
        rowService !== "*" &&
        !checkIfPortRange(rowService)
      ) {
        applications.push(rowService);
      } else {
        // * or number or range of ports
        serviceStrings.push(rowService);
      }

      // add some profiles if needs
      rule.virus = findProfileFromCSV(
        "virus",
        applications,
        profilePerApps!,
        row.Direction.toLowerCase(),
        company!
      );
      rule.spyware = findProfileFromCSV(
        "spyware",
        [...applications, ...serviceStrings],
        profilePerApps!,
        row.Direction.toLowerCase(),
        company!
      );
      rule.vulnerability = findProfileFromCSV(
        "vulnerability",
        applications,
        profilePerApps!,
        row.Direction.toLowerCase(),
        company!
      );
      rule.urlFiltering = findProfileFromCSV(
        "urlFiltering",
        [...applications, ...serviceStrings],
        profilePerApps!,
        row.Direction.toLowerCase(),
        company!
      );
    }

    // Apply service or application
    for (let serviceString of serviceStrings) {
      let service: Service;
      if (serviceString === "443") {
        service = {
          name: "service-https",
          destinationPort: "443",
        };
        services.push(service);
      } else if (serviceString === "*") {
        service = {
          name: "*",
        };
        services.push(service);
        // do nothing for * because on creation it will change it to any
      } else {
        let ianaService;
        if (ianaServs !== undefined) {
          ianaService = ianaServs.find((obj) => obj.port === serviceString.trim());
        }
        for (let prot of row.Protocol) {
          prot = prot.toLowerCase();
          if (!prot.includes("tcp") && !prot.includes("udp")) {
            throw new MyError(
              "The protocol is incorrect, please select either TCP or UDP.",
              rule.name,
              ++counter
            );
          }
          service = {
            name: checkIfPortRange(serviceString.trim())
              ? `range-${serviceString}-${prot}`
              : ianaService
              ? ianaService.name === ""
                ? `srv-iana-${generateId(3)}-${prot}`
                : `srv-${ianaService.name}-${prot}`
              : `srv-${serviceString}-${prot}`,
            protocol: prot,
            description: ianaService ? ianaService.description : "",
            destinationPort: serviceString,
            deviceGroup: parentDG,
          };
          services.push(service);
        }
      }
    }

    // set spurce and destination
    if (row.DestinationType.toLowerCase().includes("url")) {
      if (row.Services.length === 0) {
        services.push({ name: "service-https" }, { name: "service-http" });
      }
      let { rowSourceAddresses } = addressFun(
        rules,
        row,
        row.Application.toLowerCase().includes("baseline") ? parentDG : deviceGroup,
        tagApplication
      );
      rule.sourceAddresses = rowSourceAddresses;
      rule.destinationAddresses = [];

      let urls: string[] = [];
      for (let destUrl of row.Destination) {
        urls.push(`${destUrl}/`);
      }
      if (row.DestinationGroupName.length != 1) {
        throw new MyError(
          "You did not set the name of URL Category",
          rule.name,
          ++counter
        );
      }
      let urlCat: UrlCategory = {
        name: row.DestinationGroupName[0].toString(),
        sites: urls,
        deviceGroup: deviceGroup,
      };
      rule.categories = [urlCat];
      if (
        useChatgpt.toLowerCase().includes("y") ||
        useChatgpt.toLowerCase().includes("t")
      ) {
        rule.description = await generateDescription(rule);
      }
    } else if (row.DestinationType.toLowerCase().includes("service")) {
      let { rowSourceAddresses, rowDestinationAddresses } = addressFun(
        rules,
        row,
        row.Application.toLowerCase().includes("baseline") ? parentDG : deviceGroup,
        tagApplication
      );
      rule.sourceAddresses = rowSourceAddresses;
      if (row.SourceGroupName.length !== 0) {
        if (row.Source.length > 1) {
          rule.sourceIsAddressGroup = true;
          rule.sourceAddressGroupNames = row.SourceGroupName;
        }
      }
      if (row.DestinationGroupName.length !== 0) {
        if (row.Destination.length > 1) {
          rule.destinationIsAddressGroup = true;
          rule.destinationAddressGroupNames = row.DestinationGroupName;
        }
      }
      // for (let adr of rowSourceAddresses) {
      //   if (adr.addressGroups) {
      //     for (let gr of adr.addressGroups) {
      //       console.error(`RG: ${adr.name} -> ${gr.name}`);
      //     }
      //   } else {
      //     console.error(`${adr.name}`);
      //   }
      // }
      rule.destinationAddresses = rowDestinationAddresses;
    } else {
      throw new MyError(
        "You have to select between 'Service' and 'Url'",
        rule.name,
        ++counter
      );
    }

    // set application/service
    // create two rules if needed (one for applications and one for services)
    if (applications.length !== 0) {
      let ruleApp: Rule = { ...rule };
      // ruleApp.name = rule.name + "--App";
      ruleApp.tags = [...rule.tags];
      ruleApp.applications = applications;
      if (
        useChatgpt.toLowerCase().includes("y") ||
        useChatgpt.toLowerCase().includes("t")
      ) {
        ruleApp.description = await generateDescription(ruleApp);
      }
      rules.push(ruleApp);
    }

    if (services.length !== 0) {
      rule.services = services;
      let isHttp = services.find((obj) => (obj as Service).name === "srv-http");
      let isHttps = services.find((obj) => (obj as Service).name === "service-https");
      if (!row.DestinationType.toLowerCase().includes("url") && (!isHttp || !isHttps)) {
        rule.name = rule.name + "--Srv";
        if (rule.categories === undefined) {
          // add a "ServiceRule" Tag to help administrator to change this to Application based
          let tag: Tag = {
            name: "ServiceRule",
            color: "color13",
            comment: "!!! Admin replace these Services with Applications !!!",
            deviceGroup: parentDG,
          };
          rule.tags.push(tag);
        }
      }
      if (
        useChatgpt.toLowerCase().includes("y") ||
        useChatgpt.toLowerCase().includes("t")
      ) {
        rule.description = await generateDescription(rule);
      }

      rules.push(rule);

      const duplicateRuleNames = findDuplicateObject(rules, "name");
      if (duplicateRuleNames.length > 0) {
        throw new MyError(
          "Duplicate rule names detected. Please check the CSV data.",
          JSON.stringify(duplicateRuleNames),
          ++counter
        );
      }
    }

    // List of rule properties to check and display
    const ruleProperties = ["virus", "vulnerability", "urlFiltering", "spyware"];

    // console.info(`  source: ${row.Source}`);
    // console.info(`  destination: ${row.Destination}`);
    console.info(`  direction: ${row.Direction.toLowerCase()}`);
    applications.length !== 0
      ? console.info(`  application:  ${Array.from(applications)}`)
      : services.length !== 0
      ? console.info(`  services:  ${services.map((service) => service.name).join(",")}`)
      : null;
    // Iterate over the rule properties and log the ones that are defined
    ruleProperties.forEach((property) => {
      //@ts-ignore
      const propertyValue = rule[property]; // Type-casting required
      if (propertyValue) {
        console.info(`  ${property}:  ${propertyValue}`);
      }
    });

    counter++;
    console.info(`    ${Number((counter / csvData.length) * 100).toFixed(2)}% completed`);
    console.info(`--------------------`);
    // end of loop with csv rules
  }

  return Promise.resolve(rules);
}

/**
 * Create addresses from a CSVModel object for source and destination.
 * @param {Rule[]} rules - The generated rules.
 * @param {CSVModel} row - The CSV data row.
 * @param {DeviceGroup} fwDeviceGroup - The target device group.
 * @param {Tag} tagApplication - The tag of the application.
 * @returns {{ rowSourceAddresses: Address[], rowDestinationAddresses: Address[] }} - The source and destination addresses.
 */
function addressFun(
  rules: Rule[],
  row: CSVModel,
  fwDeviceGroup: DeviceGroup,
  tagApplication: Tag
): any {
  let rowAddressGroupString = [row.SourceGroupName, row.DestinationGroupName];
  let rowAddressesCSV = [row.Source, row.Destination];
  let sourceAddresses: Address[] = [];
  let destinationAddresses: Address[] = [];

  // if i == 0 is for source
  // if i == 1 is for destination
  for (let i = 0; i < 2; i++) {
    const isSource = i === 0;
    let addressNameByUser: string | undefined;

    // check if group name exist
    // if is 1 group with 1 ip then this is the name of address
    if (rowAddressGroupString[i].length != 0 && rowAddressesCSV[i].length == 1) {
      addressNameByUser = rowAddressGroupString[i].toString();
    }
    // if address is empty then the group existed somewhere else (another application)
    // so create dummy objects for this reason
    if (rowAddressesCSV[i].length == 0 && rowAddressGroupString[i].length >= 1) {
      for (let csvAddrGroup of rowAddressGroupString[i]) {
        let addressGroup: AddressGroup = {
          name: csvAddrGroup,
        };
        let address: Address = {
          name: csvAddrGroup,
          addressGroups: [addressGroup],
        };
        if (isSource) {
          sourceAddresses.push(address);
        } else {
          destinationAddresses.push(address);
        }
      }
    }

    // Create addresses from the CSV data
    for (let csvAddr of rowAddressesCSV[i]) {
      csvAddr = csvAddr.trim();
      let address: Address;
      // will add "any" because the result from this function will be empty
      if (csvAddr === "*") {
        break;
      }
      let existedAddrOntheRow = [...sourceAddresses, ...destinationAddresses].find(
        (obj) => obj.value === csvAddr
      );
      let existedAddrOntheRules, existedAddrOntheRulesSource, existedAddrOntheRulesDest;
      for (let rule of rules) {
        if (rule.sourceAddresses || rule.destinationAddresses) {
          existedAddrOntheRulesSource = [...(rule.sourceAddresses as Address[])].find(
            (obj) => obj.value === csvAddr && obj.nameByUser === true
          );
          existedAddrOntheRulesDest = [...(rule.destinationAddresses as Address[])].find(
            (obj) => obj.value === csvAddr && obj.nameByUser === true
          );
        }
        if (
          existedAddrOntheRulesSource !== undefined ||
          existedAddrOntheRulesDest !== undefined
        ) {
          existedAddrOntheRules =
            existedAddrOntheRulesSource ?? existedAddrOntheRulesDest;
          break;
        }
      }
      if (existedAddrOntheRow || existedAddrOntheRules) {
        address = existedAddrOntheRow! ?? existedAddrOntheRules;
      } else {
        let type: "ip-netmask" | "fqdn" | "ip-range";
        const ips = csvAddr.split("-");
        let addrName;
        let description;
        if (isIPv4(csvAddr) === 1) {
          // IPv4
          // dns = await nslookup(csvAddr);
          // dns = dns ?? csvAddr;
          addrName = csvAddr;
          type = "ip-netmask";
        } else if (isIPv4(csvAddr) === 2) {
          // subnet
          addrName = `snet-${convertToString(csvAddr)}`;
          description = subnetInfo(csvAddr);
          type = "ip-netmask";
        } else if (isIPv4(csvAddr) === 4) {
          // range
          addrName = `range-${ips[0]}-to-${ips[1]}`;
          description = `IP range from ${ips[0]} to ${ips[1]}`;
          type = "ip-range";
        } else {
          // DNS
          addrName = csvAddr;
          type = "fqdn";
        }
        address = {
          name: addressNameByUser ?? `${addrName}`.substring(0, 60),
          type: type,
          description: description,
          value: csvAddr,
          tags: [tagApplication],
          deviceGroup: fwDeviceGroup,
          nameByUser: !!addressNameByUser,
          addressGroups: [],
        };
        if (!addressNameByUser && rowAddressGroupString[i].length !== 0) {
          let addressGroup: AddressGroup = {
            name: `${rowAddressGroupString[i]!.toString()}`,
            description: "Address Group",
            deviceGroup: fwDeviceGroup,
            tags: [tagApplication],
          };
          address.addressGroups = [addressGroup];
        }
      }
      if (isSource) {
        sourceAddresses.push(address);
      } else {
        destinationAddresses.push(address);
      }
    }
  }

  return {
    rowSourceAddresses: sourceAddresses,
    rowDestinationAddresses: destinationAddresses,
  };
}
