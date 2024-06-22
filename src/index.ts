import {
  DeviceGroup,
  Rule,
  IANAService,
  CSVModel,
  PAApplication,
  Profile,
} from "./model";
import * as TagGen from "./generate/tag";
import * as ServObjGen from "./generate/service";
import * as DefaultGen from "./generate/default";
import * as RuleGen from "./generate/rule";
import * as AddressGen from "./generate/address";
import * as UrlCatGen from "./generate/url-category";
import {
  makeDirSync,
  cleanup,
  readFromFileObject,
  readCSV,
  parseArgs,
  MyError,
  fetchVPaloAltoApplications,
  fetchProfilesPerApplication,
} from "./shared";
import { generateRuleObjects } from "./rule-generator";

// Extracts configuration based on `params.deviceGroupName`
// 3. cngfw-az-company-weu - parent device group Company West
// 4. cngfw-az-company-ne - parent device group Company North
function getDeviceGroupConfig(params: any) {
  let parentDGName = "Error";
  let folderName = "Error";
  let location = "Error";
  let company = "Error";

  switch (params.deviceGroupName.toLowerCase()) {
    case "cngfw-az-company-weu":
      parentDGName = params.env.includes("p") ? "Company" : "Company-DEV";
      folderName = "company-az";
      location = "weu";
      company = "Company";
      break;
    case "cngfw-az-company-ne":
      parentDGName = params.env.includes("p") ? "Company" : "Company-DEV";
      folderName = "company-az";
      location = "neu";
      company = "Company";
      break;
    default:
      console.error("Unknown device group");
      process.exit(1);
  }

  return { parentDGName, folderName, location, company };
}

async function main() {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const config = getDeviceGroupConfig(params);
  if (!config) process.exit(1); // Handle unknown device group

  const { parentDGName, folderName, location, company } = config;

  console.info(
    `Generating Terraform files for
    Firewall : ${folderName} / ${location}
    Device Group : ${params.deviceGroupName}
    Application : ${params.applicationName}`
  );
  console.info("--------------------");

  // get name, description and port from IANA website to create the proper services on firewall
  // const ianaServs: IANAService[] = await fetchServiceFromIANA();
  // writeToFileObject("ianaServices.json", ianaServs);
  const ianaServs: IANAService[] = readFromFileObject("ianaServices.json");
  // list of application from Palo Alto and their service port
  const applications: PAApplication[] = await fetchVPaloAltoApplications();
  // fetch from Application Pedia of Palo Alto the applicatiins, NOT USED
  // const appliPedia: AppliPedia[] = await fetchApplipedia();
  const profilePerApps: Profile[] = await fetchProfilesPerApplication();

  let csvData: CSVModel[] = [];

  if (params.applicationName) {
    csvData = await readCSV(
      `./data/${folderName}/${location}/${params.applicationName}.csv`
    );
    if (csvData.length === 0) {
      console.error("CSV file is empty");
      process.exit(1);
    }
  } else {
    console.error("Application name is missing");
    process.exit(1);
  }

  const deviceGroupName = csvData[0].Firewall;
  if (deviceGroupName?.toLowerCase() !== params.deviceGroupName.toLowerCase()) {
    console.error("The firewall name does not match the column from csv");
    process.exit(1);
  }

  const applicationName = csvData[0].Application.toLowerCase();
  if (applicationName !== params.applicationName.toLowerCase()) {
    console.error("The application name does not match the column from csv");
    process.exit(1);
  }

  const parentDG: DeviceGroup = {
    name: parentDGName,
  };
  const fwDG: DeviceGroup = {
    name: csvData[0].Firewall,
  };

  // in which device group will apply the rules
  const deviceGroup = applicationName.includes("company-baseline") ? parentDG : fwDG;

  const folderPath = `${parentDG.name}/${fwDG.name}/${applicationName}`;
  makeDirSync(folderPath);
  cleanup(folderPath);
  console.info("--------------------");

  // create Rule object array of rules from the csv file
  let rules: Rule[] | undefined;
  try {
    rules = await generateRuleObjects(
      params.useChatgpt.toLowerCase(),
      parentDG,
      deviceGroup,
      csvData,
      ianaServs,
      applications,
      profilePerApps,
      company
    );
  } catch (error: any) {
    if (error instanceof MyError) {
      console.error("--------------------");
      console.error(
        "Error:",
        error.message,
        `On line: ${error.line}`,
        `On rule: ${error.ruleName}`
      );
    } else {
      console.error("Error:", error.message);
      console.error("--------------------");
    }
    process.exit(1);
  }

  if (!rules) {
    console.error("Rules are undefined");
    process.exit(1);
  }

  DefaultGen.generateMain(folderPath, params.env, deviceGroupName.toLowerCase());
  DefaultGen.generateVersion(folderPath);
  DefaultGen.generateVariables(folderPath, params.env);
  console.info("--------------------");

  TagGen.generateTerraform(folderPath);
  TagGen.generateTfvars(folderPath, rules);
  console.info("--------------------");

  UrlCatGen.generateTerraform(folderPath);
  UrlCatGen.generateTfvars(folderPath, rules);
  console.info("--------------------");

  ServObjGen.generateTerraform(folderPath);
  ServObjGen.generateTfvars(folderPath, rules);
  console.info("--------------------");

  AddressGen.generateTerraform(folderPath);
  AddressGen.generateTerraformGroup(folderPath);

  let addrObject: any;
  try {
    addrObject = AddressGen.generateTfvars(folderPath, rules);
  } catch (error: any) {
    console.error("Error:", error.message);
    if (params.env.includes("p")) {
      cleanup(folderPath);
    }
    process.exit(1);
  }
  console.info("--------------------");

  RuleGen.generateTerraform(
    folderPath,
    applicationName,
    params.env,
    params.position,
    params.useChatgpt.toLowerCase()
  );
  try {
    RuleGen.generateTfvars(
      folderPath,
      deviceGroupName,
      applicationName,
      deviceGroup,
      rules,
      addrObject
    );
  } catch (error: any) {
    if (error instanceof MyError) {
      console.error("--------------------");
      console.error("Error:", error.message, ` On rule: ${error.ruleName}`);
    } else {
      console.error("Error:", error);
    }
    if (params.env.includes("p")) {
      cleanup(folderPath);
    }
    process.exit(1);
  }
  console.info("--------------------");

  console.info(
    `Terraform files generated successfully
    Firewall : ${folderName} / ${location}
    Device Group : ${params.deviceGroupName}
    Application : ${params.applicationName}`
  );
}

main();
