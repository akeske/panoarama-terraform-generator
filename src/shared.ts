import fs from "fs";
import { parse } from "csv-parse";
// import * as puppeteer from 'puppeteer';
// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { exec } from "child_process";
import OpenAI from "openai";
import {
  CSVModel,
  PAApplication,
  Rule,
  Profile,
  Zone,
  Address,
  AddressGroup,
} from "./model";
import * as CryptoJS from "crypto-js";

export class MyError extends Error {
  constructor(message: string, public ruleName?: string, public line?: number) {
    super(message);
    // Set the prototype explicitly to fix inheritance
    Object.setPrototypeOf(this, MyError.prototype);
    // this._errorExtraParams = errorExtraParams;
  }

  // get errorExtraParams() {
  //   return this.errorExtraParams;
  // }
}

/**
 * Function to find duplicate values in an array
 * @param arr The array to check for duplicates
 * @returns An array of duplicate values, or an empty array if no duplicates
 */
export function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();

  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }

  return Array.from(duplicates);
}

export function findDuplicateByValue<T>(objects: T[], attr: string): T[] {
  const nameCount: { [key: string]: number } = {};
  const duplicates: T[] = [];

  // Count occurrences of each name
  objects.forEach((obj) => {
    if (nameCount[(obj as any)[attr]]) {
      nameCount[(obj as any)[attr]]++;
    } else {
      nameCount[(obj as any)[attr]] = 1;
    }
  });

  // Find duplicates
  objects.forEach((obj) => {
    if (nameCount[(obj as any)[attr]] > 1) {
      duplicates.push(obj);
      nameCount[(obj as any)[attr]] = 0; // Ensure each duplicate is only added once
    }
  });

  return duplicates;
}

// Function to find unique differences by value
export function findUniqueNameValueDifferences(
  addresses: Address[],
  attri1: string,
  attr2: string
): { value: string; names: string[] }[] {
  const valueToNames = new Map<string, Set<string>>();

  // Populate the map with unique names for each value
  addresses.forEach((addr) => {
    if (!valueToNames.has((addr as any)[attri1])) {
      valueToNames.set((addr as any)[attri1], new Set());
    }
    valueToNames.get((addr as any)[attri1])?.add((addr as any)[attr2]);
  });

  // Find values with more than one unique name
  return Array.from(valueToNames.entries())
    .filter(([_, namesSet]) => namesSet.size > 1) // Multiple unique names indicate differences
    .map(([value, namesSet]) => ({
      value,
      names: Array.from(namesSet), // Convert set to array for easy handling
    }));
}

// Function to sort and compare two arrays for equality
function areArraysEqualIgnoringOrder(array1: any[], array2: any[]): boolean {
  // First, check if lengths are the same
  if (array1.length !== array2.length) {
    return false; // If the lengths differ, arrays cannot be equal
  }
  // Sort both arrays for comparison
  const sortedArray1 = [...array1].sort(); // Spread and sort to avoid modifying original arrays
  const sortedArray2 = [...array2].sort();

  // Check if each element is equal after sorting
  for (let i = 0; i < sortedArray1.length; i++) {
    if (sortedArray1[i] !== sortedArray2[i]) {
      return false; // If any element differs, arrays are not equal
    }
  }

  return true; // If all elements are equal after sorting, arrays are considered equal
}

export function findInconsistentAddressGroups(addressGroups: AddressGroup[]): any[] {
  const groupsWithDifferentAddresses = new Set();

  addressGroups.forEach((group) => {
    if (group.addresses) {
      const uniqueAddresses = new Set<string>();

      // Add all unique Address.values to the set
      group.addresses.forEach((address) => {
        if ((address as any).value) {
          uniqueAddresses.add((address as any).value);
        }
      });

      addressGroups.forEach((group2) => {
        if (group2.addresses && group.name === group2.name) {
          const uniqueAddresses2 = new Set<string>();
          // Add all unique Address.values to the set
          group2.addresses.forEach((address2) => {
            if ((address2 as any).value) {
              uniqueAddresses2.add((address2 as any).value);
            }
          });
          let isEqual = areArraysEqualIgnoringOrder(
            Array.from(uniqueAddresses),
            Array.from(uniqueAddresses2)
          );
          if (!isEqual) {
            groupsWithDifferentAddresses.add(group.name);
          }
        }
      });

      // console.error(`${group.name} ${Array.from(uniqueAddresses)}`);
    }
  });

  return Array.from(groupsWithDifferentAddresses);
}

/**
 * Function to find duplicate values in an array
 * @param arr The array to check for duplicates
 * @returns An array of duplicate values, or an empty array if no duplicates
 */
export function findDuplicateObject<T>(array: T[], attribute: string): T[] {
  const seen = new Set<any>();
  const duplicates = new Set<any>();

  // Iterate through the array and identify duplicates based on the specified attribute
  array.forEach((item) => {
    const value = (item as any)[attribute];
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  });

  // Return an array of the duplicate values
  return Array.from(duplicates);
  // const values = array.map((obj) => (obj as any)[attributeName]);
  // return new Set(values).size !== values.length;
}

/**
 * Deduplicate an array of objects based on a specific attribute.
 * Retains all unique objects and only one instance of each duplicate.
 * @param {Array<T>} array - The array of objects to deduplicate.
 * @param {keyof T} attribute - The attribute to use for deduplication.
 * @returns {Array<T>} - An array with unique objects and one instance of each duplicate.
 */
export function deduplicateAndKeepOne<T>(array: T[], attribute: keyof T): T[] {
  const uniqueMap = new Map<any, T>();
  const seen = new Set<any>();

  // Populate the map with unique objects based on the attribute
  array.forEach((item) => {
    const attrValue = item[attribute];
    if (!seen.has(attrValue)) {
      uniqueMap.set(attrValue, item);
      seen.add(attrValue);
    }
  });

  // Return the values from the map (only one instance for each attribute)
  return Array.from(uniqueMap.values());
}

/**
 * Generate a random string for palo alto resources to have unique name/id
 * @param {number} length - The size of random string.
 * @returns {string} - The random string.
 */
export function generateId(length: number): string {
  let result = "";
  // const characters =
  //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const characters = "0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

/**
 * In every execution of script deletes the .tf and .tfvars files
 * @param {string} folderPath - The folder path.
 */
export function cleanup(folderPath: string) {
  deleteFile(`${folderPath}/main.tf`);
  deleteFile(`${folderPath}/versions.tf`);
  deleteFile(`${folderPath}/variables.tf`);
  deleteFile(`${folderPath}/terraform_addresses.auto.tfvars`);
  // deleteFile(`${folderPath}/terraform_device_groups.auto.tfvars`);
  deleteFile(`${folderPath}/terraform_rules.auto.tfvars`);
  deleteFile(`${folderPath}/terraform_service_objects.auto.tfvars`);
  deleteFile(`${folderPath}/terraform_tags.auto.tfvars`);
  deleteFile(`${folderPath}/terraform_url_categories.auto.tfvars`);
}

/**
 * Create the folders depends on firewall. The path is [Company]/[az-[company]-[we|ne]]
= */
export function makeDirSync(directoryPath: string): void {
  try {
    // Use `fs.existsSync` to check if the directory already exists
    if (!fs.existsSync(directoryPath)) {
      // Create the directory synchronously
      fs.mkdirSync(directoryPath, { recursive: true });
      console.info(`Directory created successfully: ${directoryPath}`);
    } else {
      console.info(`Directory '${directoryPath}' already exists.`);
    }
  } catch (error) {
    console.error("Error creating directory:", error);
  }
}

/**
 * Create the folders depends on firewall. The path is [Company]/[az-[company]-[we|ne]]
 * @param {string} directoryPath - The folder path.
 */
export function makeDir(directoryPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.mkdir(directoryPath, { recursive: true }, (err) => {
      if (err) {
        // console.error(`Error creating directory: ${err.message}`);
        reject(`Error creating directory: ${err.message}`);
      } else {
        console.info(`Directory created successfully: ${directoryPath}`);
        resolve(`Directory created successfully: ${directoryPath}`);
      }
    });
  });
}

/**
 * Delete file function
 * @param {string} fileName - The name of the file.
 */
function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.info(`File ${filePath} deleted successfully`);
  } else {
    // console.error(`Error deleting file: ${err.message}`);
  }
}

/**
 * Writes an array of objects to a JSON file.
 * @param {string} fileName - The name of the file.
 * @param {T[]} data - The array of objects to write.
 */
export function writeToFileObject<T>(fileName: string, data: T[]): void {
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync("data/" + fileName, jsonContent);
}

/**
 * Reads an array of objects from a JSON file.
 * @param {string} fileName - The name of the file.
 * @returns {T[]} The array of objects read from the file.
 */
export function readFromFileObject<T>(fileName: string): T[] {
  const fileContent = fs.readFileSync("data/" + fileName, "utf-8");
  return JSON.parse(fileContent);
}

/**
 * Generate the proper file .tf or tfvars
 * @param {string} folderPath - The path where the file will be generated
 * @param {string} fileName - The name of the file.
 * @param {string} dataToWrite - The content of the file
 */
export function writeFile(
  folderPath: string,
  fileName: string,
  dataToWrite: string
): void {
  try {
    fs.appendFileSync(folderPath + "/" + fileName, dataToWrite, "utf8");
    console.info("Terraform has been written to the file:", folderPath + "/" + fileName);
  } catch (err) {
    console.error("Error writing to file:", err);
  }
}

/**
 * Convert object to string
 * the input will be like this [{name:'thanos'},{name:'keske'}]
 * returns ['thanos', 'keske']
 * @param {any} obj - The object which we want to map it to string
 * @param {string} attribute - The attribute which will mapped and create the array
 * @returns {string[]} - The array of strings
 */
export function convertObj2String(obj: any, attribute: string): string[] {
  if (!obj) return []; // If 'tags' is undefined, return an empty string
  return obj.map((key: any) => key[attribute]);
}

export function convertObj2AnotherObject(obj: any, attribute: string): any {
  return obj.map((key: any) => key[attribute]);
}

/**
 * Fetch from PA-applications.csv file the mapping of AppID and servcie/port
 * the mapping created by hand for common services
 * @returns {PAApplication[]} - The array of strings
 */
export function fetchVPaloAltoApplications(): Promise<PAApplication[]> {
  return new Promise((resolve, reject) => {
    const data: PAApplication[] = [];
    const headers = ["service", "applications"];
    fs.createReadStream("data/PA-applications.csv")
      .pipe(parse({ delimiter: ";", columns: headers, fromLine: 2 }))
      .on("data", (row: PAApplication) => {
        row.applications = row.applications.split(",");
        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}

export function fetchProfilesPerApplication(): Promise<Profile[]> {
  return new Promise((resolve, reject) => {
    const data: Profile[] = [];
    const headers = ["entity", "name", "applications", "direction"];
    fs.createReadStream("data/rule-profiles-per-app.csv")
      .pipe(parse({ delimiter: ";", columns: headers, fromLine: 2 }))
      .on("data", (row: Profile) => {
        row.applications = row.applications.split(",");
        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}

/**
 * Generate a list of CSVModel objects from the csv file with rules
 * @param {string} filePath - The path of csv file
 * @returns {CSVModel[]} - The array of csv rows
 */
export function readCSV(filePath: string): Promise<CSVModel[]> {
  return new Promise((resolve, reject) => {
    const data: CSVModel[] = [];
    const headers = [
      "Firewall",
      "Application",
      "Enviroment",
      "Vendor",
      "RuleName",
      "SourceGroupName",
      "Source",
      "DestinationType",
      "DestinationGroupName",
      "Destination",
      "Services",
      "Direction",
      "Action",
      "Tags",
      "BusinessPurpose",
      "Comment",
      "Protocol",
      "Log",
      "Status",
    ];

    const csvParser = parse({
      delimiter: ";",
      columns: headers,
      fromLine: 2, // Skip the header line
    });

    fs.createReadStream(filePath)
      .pipe(csvParser)
      .on("data", (row: CSVModel) => {
        if (row.Application === "") {
          return;
        }
        const splitAndClean = (field: string): string[] =>
          field.trim() ? field.split(",").map((item) => item.trim()) : [];

        // Split and clean certain fields into arrays
        row.SourceGroupName = splitAndClean(row.SourceGroupName);
        row.Source = splitAndClean(row.Source);
        row.DestinationGroupName = splitAndClean(row.DestinationGroupName);
        row.Destination = splitAndClean(row.Destination);
        row.Services = splitAndClean(row.Services);
        row.Tags = splitAndClean(row.Tags);
        row.Protocol = splitAndClean(row.Protocol);

        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error: any) => {
        reject(error);
      });
  });
}

/**
 * @deprecated
 * Fetch from Palo Alto AppliPedia the Applications and generate a list of AppliPedia objects
 * @returns {AppliPedia[]} - The array of csv rows
 */
// export async function fetchApplipedia(): Promise<AppliPedia[]> {
//   const applications: AppliPedia[] = [];
//   const ianaUrl = `https://applipedia.paloaltonetworks.com`;
//   // Launch a headless browser
//   const browser = await puppeteer.launch({ headless: 'new' });
//   const page = await browser.newPage();
//   // Navigate to the Applipedia page
//   await page.goto(ianaUrl, { waitUntil: 'domcontentloaded' });

//   // Wait for an additional 2000 milliseconds (2 seconds) after the page has loaded
//   await page.waitForTimeout(4000);

//   // Get the HTML content after the page has loaded
//   const html = await page.content();

//   // Load the HTML into Cheerio
//   const $ = cheerio.load(html);

//   // Select the table rows within the table with id 'headerTable'
//   const rows = $('#dataTable tbody tr');

//   // Process and display information for each row
//   for (let index = 0; index < rows.length; index++) {
//     const row = rows.eq(index);
//     const firstColumn = row.find('td:first-child');

//     // Assuming table cells are td elements
//     const columns = $(row).find('td');
//     const name = columns.eq(0).text().trim();
//     const subCategory = columns.eq(1).text().trim();
//     const category = columns.eq(2).text().trim();
//     const risk = $(columns[3]).find('img').attr('title');
//     const technology = columns.eq(4).text().trim();

//     // Click on the link inside the first column of the row
//     await page.evaluate((link: any) => {
//       const anchor = link.querySelector('a');
//       if (anchor) {
//         anchor.click();
//       }
//     }, firstColumn);
//     await page.waitForTimeout(1000);

//     const app: AppliPedia = {
//       name,
//       subCategory,
//       category,
//       risk,
//       technology,
//     };
//     applications.push(app);
//   }
//   await browser.close();

//   return applications;
// }

/**
 * Fetch from IANA the services and generate a list of IANAService objects
 * @returns {IANAService[]} - The array of csv rows
 */
// export async function fetchServiceFromIANA(): Promise<IANAService[]> {
//   const services: IANAService[] = [];
//   for (let page = 1; page <= 145; page++) {
//     const ianaUrl = `https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml?&page=${page}`;
//     const response = await axios.get(ianaUrl);
//     const $ = cheerio.load(response.data);

//     // Assuming the data table is present in the HTML structure
//     $('table tbody tr').each((index: number, element: any) => {
//       const columns = $(element).find('td');
//       const name = columns
//         .eq(0)
//         .text()
//         .trim()
//         .replace(/[^\w ]/g, '')
//         .substring(0, 60);
//       const port = columns.eq(1).text().trim();
//       const protocol = columns.eq(2).text().trim();
//       const description = columns.eq(3).text().trim();

//       const service: IANAService = {
//         name,
//         port,
//         protocol,
//         description,
//       };

//       services.push(service);
//     });
//   }
//   return services;
// }

/**
 * Convert an IP to DNS with nslookup function
 * @param {string} ipAddr - The IP of device
 * @returns {Promise<string>} - The DNS entry
 */
// export function nslookup(ipAddr: string): Promise<string | undefined> {
//   return new Promise((resolve, reject) => {
//     exec(`nslookup ${ipAddr}`, (error, stdout, stderr) => {
//       if (error) {
//         reject(new Error(`Error: ${error.message}`));
//       }
//       resolve(extractNameAttributeValue(stdout));
//     });
//   });
// }

/**
 * Convert the object {name:'thanos'} to 'thanos'
 * @param {string} input
 * @returns {string}
 */
// function extractNameAttributeValue(input: string): string | undefined {
//   const nameRegex = /Name:\s+([\w.-]+)/;
//   const match = input.match(nameRegex);

//   if (match && match[1]) {
//     return match[1];
//   }

//   return undefined;
// }

/**
 * Check if input is an IP address
 * @param {string} input - The input string
 * @returns {number} - If 1 then input is IP, 2 then is subnet, 3 is URL
 */
export function isIPv4(input: string): number {
  // Regex for IPv4 address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  // Regex for CIDR notation (IPv4)
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/(0|[1-9]\d*|\/[1-2][0-9]|\/3[0-2])$/;

  const rangeRegex =
    /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})-(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

  const isIp = ipv4Regex.test(input);
  const isSubnet = cidrRegex.test(input);
  const isRange = rangeRegex.test(input);

  if (isIp) {
    return 1;
  } else if (isSubnet) {
    return 2;
  } else if (isRange) {
    return 4;
  } else {
    return 3;
  }
}

/**
 * Convert the subnet to more convinient name for the Palo Alto resource name
 * For example 10.0.0.0/8 => 10.0.0.0-pre-8
 * @param {string} address - The subnet
 * @returns {string} - The result string
 */
export function convertToString(address: string): string {
  return address.replaceAll("/", "-pre-");
}

/**
 * Generate a description for subnet resource
 * @param {string} cidr - The subnet
 * @returns {number} - The generated description
 */
export function subnetInfo(cidr: string): string {
  const [ipAddress, prefixLength] = cidr.split("/");
  const prefix = parseInt(prefixLength, 10);

  // Convert IP address to a 32-bit number
  const ipAsInt = ipAddress
    .split(".")
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0);

  // Calculate the network mask and the range size
  const networkMask = (0xffffffff << (32 - prefix)) & 0xffffffff;
  const networkAddress = ipAsInt & networkMask;
  const broadcastAddress = networkAddress | ~networkMask;

  // Convert back to dot-decimal notation
  const intToIp = (int: number) =>
    [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join(".");

  const startIpAddress = intToIp(networkAddress + 1); // First usable IP
  const endIpAddress = intToIp(broadcastAddress - 1); // Last usable IP
  return `Subnet ${cidr} with range from ${startIpAddress} to ${endIpAddress}`;
}

/**
 * Generate a description for rule based on chatGPT
 * @param {Rule} rule - The rule object
 * @returns {Promise<string | null>} - The generated description from chatGPT
 */
export async function generateDescription(rule: Rule): Promise<string | null> {
  // ADD HERE YOUR OPENAI KEY
  const apiKey = "sk-aaaa";
  const openai = new OpenAI({
    timeout: 10 * 1000,
    apiKey: apiKey,
  });

  let messages: any = [
    {
      role: "user",
      content: "AVD is Azure Virtual Desktop",
    },
    {
      role: "user",
      content:
        "Please, give me a brief for the bellow firewall rule with max 300 characters, max three sentences.",
    },
    { role: "user", content: `The firewall action is ${rule.action}` },
    { role: "user", content: `Administrator's description is ${rule.description}` },
  ];

  if (rule.sourceAddresses.length > 0) {
    messages.push({
      role: "user",
      content: `Source: ${
        convertObj2String(rule.sourceAddresses, "value")[0] === undefined
          ? convertObj2String(rule.sourceAddresses, "name")
          : convertObj2String(rule.sourceAddresses, "value")
      }`,
    });
  }

  if ((rule.sourceZones[0] as Zone)?.name.toLowerCase() === "private") {
    if ((rule.destinationZones[0] as Zone)?.name.toLowerCase() === "private") {
      messages.push({
        role: "user",
        content: `This rule rule is for internal communication`,
      });
    } else {
      messages.push({
        role: "user",
        content: `This rule is for outbound connectivity`,
      });
    }
  } else {
    messages.push({
      role: "user",
      content: `This rule is a NAT`,
    });
  }

  if ((rule.destinationZones[0] as Zone)?.name.toLowerCase() === "public") {
    if (rule.destinationAddresses.length > 0) {
      messages.push({
        role: "user",
        content: `Destination is public network with specific IPs/Domains: ${
          convertObj2String(rule.destinationAddresses, "value")[0] === undefined
            ? convertObj2String(rule.destinationAddresses, "name")
            : convertObj2String(rule.destinationAddresses, "value")
        }`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Destination is public internet`,
      });
    }
  } else {
    if (rule.destinationAddresses.length > 0) {
      messages.push({
        role: "user",
        content: `Destination: ${
          convertObj2String(rule.destinationAddresses, "value")[0] === undefined
            ? convertObj2String(rule.destinationAddresses, "name")
            : convertObj2String(rule.destinationAddresses, "value")
        }`,
      });
    }
  }

  if (rule.services) {
    if (rule.services[0] !== "application-default") {
      messages.push({
        role: "user",
        content: `Port: ${
          convertObj2String(rule.services, "destinationPort").length === 0
            ? convertObj2String(rule.services, "name")
            : convertObj2String(rule.services, "destinationPort")
        }`,
      });
    }
  }

  if (rule.applications) {
    messages.push({
      role: "user",
      content: `Applications: ${rule.applications.join(", ")}`,
    });
  }

  if (rule.categories) {
    messages.push({
      role: "user",
      content: `URL sites: ${
        convertObj2String(rule.categories, "sites")[0].length === 0
          ? convertObj2String(rule.categories, "name")
          : convertObj2String(rule.categories, "sites")
      }`,
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: 0.9,
  });

  // console.error(messages);
  // console.error(response.choices[0].message.content);

  return response.choices[0].message.content;
}

/**
 * Convert the string to camel case
 * For example 'The rule name is thanos' => 'TheRuleNameIsThanos'
 * @param {string} input - The input string
 * @returns {string} - The generated string with specific format
 */
export function convert2PascalCase(input: string): string {
  // Split the sentence into words based on the absence of spaces
  let words = input.trim().split(" ");

  // Capitalize the first letter of each word
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );

  // Join the words to form the converted sentence
  const convertedSentence = capitalizedWords.join("-");

  return convertedSentence;
}

/**
 * Check if the given string can tranform to Number object
 * @param {string|number} value - The input string
 * @returns {boolean}
 */
export function isString(value: string | number): boolean {
  return isNaN(Number(value));
}

/**
 * Parse arguements from npm run command
 * @param {string[]} args - The npm args
 * @returns {any}
 */
export function parseArgs(args: string[]): any {
  let params: any = {};
  args.forEach((arg) => {
    const keyValue = arg.split("=");
    if (keyValue.length === 2) {
      params[keyValue[0]] = keyValue[1];
    }
  });
  return params;
}

/**
 * Returns a number from the name of application to set color for tags
 * @param {string[]} name - The application name
 * @returns {any}
 */
export function generateNumberInRange(name: string): number {
  const excludeList: number[] = [4, 6, 11, 13, 16, 18, 27, 41, 42];
  const min: number = 1;
  const max: number = 42;

  // Calculate MD5 hash
  const hash = CryptoJS.MD5(name).toString(CryptoJS.enc.Hex);
  const num = parseInt(hash, 16);

  // Exclude numbers from the list
  const filteredNumbers = [];
  for (let i = min; i <= max; i++) {
    if (!excludeList.includes(i)) {
      filteredNumbers.push(i);
    }
  }
  // Map the number to the remaining range
  const range = filteredNumbers.length;
  if (range === 0) {
    throw new Error("No numbers available in the range after excluding the list.");
  }

  const mappedIndex = num % range;
  const mappedNumber = filteredNumbers[mappedIndex];

  return mappedNumber;
}

export function removeDuplicatesKeepSingles(arr: string[]): string[] {
  const countMap: Map<string, number> = new Map();

  // Count occurrences of each element
  arr.forEach((item) => {
    countMap.set(item, (countMap.get(item) ?? 0) + 1);
  });

  // Filter elements that occur exactly once
  return arr.filter((item) => countMap.get(item) === 1);
}

export function removeDuplicates<T>(arr: T[]): T[] {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}

export function checkIfPortRange(input: string): boolean {
  // Check if the input matches the pattern number-number
  const numberPattern = /^\d+-\d+$/;

  return numberPattern.test(input);
}

export function findProfileFromCSV(
  entity: string,
  ruleApplications: string[],
  profilePerApps: Profile[],
  ruleDirection: string,
  region: string
): string | undefined {
  // First, find the order that contains the product with the specified ID
  const profApp = profilePerApps.find((profApp: Profile) => {
    return (
      profApp.entity === entity &&
      (profApp.direction === ruleDirection || profApp.direction === "versa")
    );
  });

  if (!profApp) {
    return undefined;
  }

  let profileName = undefined;
  let skipLoop = false;
  for (let ruleApp of ruleApplications) {
    for (let app of profApp.applications) {
      if (app === ruleApp) {
        profileName = profApp.name;
        skipLoop = true;
        break;
      }
    }
    if (skipLoop) {
      break;
    }
  }

  return profileName ? profileName.replace("<region>", region) : undefined;
}

export function hasDuplicates(array: Address[], attributeName: string): boolean {
  const values = array.map((obj) => (obj as any)[attributeName]);
  return new Set(values).size !== values.length;
}
