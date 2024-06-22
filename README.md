# PaloAlto-Terraform-Generator

This TypeScript script automates the generation of Terraform files for Palo Alto Firewalls based on CSV files containing rules for each application.

## Table of Contents

- [Introduction](#introduction)
- [How to Run](#how-to-run)
- [Useful Links](#useful-links)
- [Palo Alto Commands](#palo-alto-commands)
- [CSV File Format](#csv-file-format)

## Introduction

This project provides a script that simplifies the creation of Terraform configurations for managing Palo Alto Firewall rules. By utilizing CSV files that specify rules for various applications, users can quickly generate the necessary Terraform files for deployment.

## How to Run

### To install dependencies and generate Terraform files, use the following commands:

```sh
npm install
npm run generate-terraform -- useChatgpt=false env=d position=top deviceGroupName=cngfw-az-company-weu applicationName=demo
```

### For backing up Panorama configurations, use the provided Python script:

```sh
python panorama-backup.py --ip 192.168.121.132 --username admin --password 1234
```

### To generate a new API key for devops

```sh
$password = "password"
curl.exe -k "https://192.168.121.132/api/?type=keygen&user=admin&password=$password"
```

## Useful Links

- [Support PAN-OS Software Release Guidance](https://live.paloaltonetworks.com/t5/customer-resources/support-pan-os-software-release-guidance/ta-p/258304)
- [Applications Overview](https://docs.paloaltonetworks.com/pan-os/9-1/pan-os-web-interface-help/objects/objects-applications/applications-overview)
- [How to Prevent Application Shift](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000Cm1aCAC)
- [Packet Flow Sequence in PAN-OS](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000ClVHCA0)
- [How to Use Certificate for Secure Web-GUI Access](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000ClFGCA0)
- [Microsoft Entra SSO Integration with Palo Alto Networks - Admin UI](https://learn.microsoft.com/en-us/entra/identity/saas-apps/paloaltoadmin-tutorial) ([Video Tutorial](https://www.youtube.com/watch?v=68_AwopgD-Q))
- [Commit Issues from Panorama Due to New URL Filtering Categories](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000PNqwCAG&lang=en_US)
- [API Calls Documentation](https://www.niap-ccevs.org/MMO/Product/st_vid11285-agd3.pdf)
- [Palo Alto SSO with Azure EntraID](https://learn.microsoft.com/en-us/entra/identity/saas-apps/paloaltonetworks-captiveportal-tutorial)
- [NPS Extension for Multi-Factor Authentication](https://learn.microsoft.com/en-us/entra/identity/authentication/howto-mfa-nps-extension)
- [TS Agent Configuration](https://docs.paloaltonetworks.com/pan-os/11-0/pan-os-admin/user-id/map-ip-addresses-to-users/configure-user-mapping-for-terminal-server-users/configure-the-palo-alto-networks-terminal-services-agent-for-user-mapping)
- [Ports Used for Panorama](https://docs.paloaltonetworks.com/pan-os/9-1/pan-os-admin/firewall-administration/reference-port-number-usage/ports-used-for-panorama)

## Palo Alto Commands

To configure Palo Alto Firewall, use the following commands:

```sh
set deviceconfig system ip-address 192.168.233.10 netmask 255.255.255.0 default-gateway 192.168.233.0 dns-setting servers primary 8.8.8.8
```

Some usefull comannds

```sh
debug system maintenance-mode
show interface management

request bootstrap vm-auth-key show

less mp-log configd.log
grep mp-log configd.log pattern Error

```

## CSV File Format

CSV files containing firewall rules should be placed inside the `data` folder. Each CSV file corresponds to a specific application. Below is the required format for the CSV files:

| Column Name          | Description                                                                                                                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firewall             | az-company-we, az-company-ne                                                                                                                                                                                                                                                                   |
| Application          | Application name, such as Cyberark                                                                                                                                                                                                                                                             |
| Environment          | Environment (prod, dev, stage, baseline)                                                                                                                                                                                                                                                       |
| Vendor               | The responsible vendor                                                                                                                                                                                                                                                                         |
| RuleName             | The rule name, e.g., 'Allow DNS'                                                                                                                                                                                                                                                               |
| SourceGroupName      | Address group object name based on this value                                                                                                                                                                                                                                                  |
| Source               | List of IPs                                                                                                                                                                                                                                                                                    |
| DestinationType      | Type of destination (Service, URL)                                                                                                                                                                                                                                                             |
| DestinationGroupName | Address group object name based on this value                                                                                                                                                                                                                                                  |
| Destination          | List of IPs                                                                                                                                                                                                                                                                                    |
| Services             | Service port or application name, comma-separated. If you use ! as first char for a service then it will not try to convert it to application. For eaxmple if use use port 53 then it will convert it to dns application, else if you write !53 then it will create src-dns-tcp service object |
| Direction            | Inbound, Outbound, or Internal (default)                                                                                                                                                                                                                                                       |
| Action               | Allow or Deny                                                                                                                                                                                                                                                                                  |
| Tags                 | Tag list with comma as delimiter                                                                                                                                                                                                                                                               |
| BusinessPurpose      | Information about the rule                                                                                                                                                                                                                                                                     |
| Comment              | Administrator comments for this rule                                                                                                                                                                                                                                                           |
| Protocol             | Layer 4 protocol (TCP or UDP). If you want icmp then use icmp,ping as applications                                                                                                                                                                                                             |
| Log                  | True or False for logging on Panorama-log                                                                                                                                                                                                                                                      |
| Status               | Enabled or Disabled                                                                                                                                                                                                                                                                            |
