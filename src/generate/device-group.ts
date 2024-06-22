import * as Model from "../model";
import { writeFile } from "../shared";

const fileName = "terraform_device_groups.auto.tfvars";

/**
 * @deprecated
 * @param {string} folderPath
 * @param {Model.DeviceGroup} applicationDG
 */
export function generateTfvars(
  folderPath: string,
  applicationDG: Model.DeviceGroup
): void {
  let terraString = JSON.stringify({ device_groups: [applicationDG] }, null, 1);
  terraString = terraString.replace(/"([^"]+)":/g, "$1:");
  terraString = terraString.slice(1);
  terraString = terraString.slice(0, -1);
  terraString = terraString.replace(/:/g, "=");

  writeFile(folderPath, fileName, terraString);
}

/**
 * @deprecated
 */
export function generateTerraform(folderPath: string): void {
  let terraString = `
resource "panos_device_group" "device_groups" {
  count       = length(var.device_groups)
  name        = var.device_groups[count.index].name
  description = var.device_groups[count.index].description

  lifecycle {
    create_before_destroy = true
  }
}

resource "panos_device_group_parent" "parent_device_group" {
  depends_on   = [panos_device_group.device_groups]
  count        = length(var.device_groups)
  device_group = var.device_groups[count.index].name
  parent       = var.device_groups[count.index].parentDeviceGroupName

  lifecycle {
    create_before_destroy = true
  }
}
`;

  writeFile(folderPath, "main.tf", terraString);
}
