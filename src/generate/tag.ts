import * as Model from '../model';
import { writeFile } from '../shared';

const fileName = 'terraform_tags.auto.tfvars';

/**
 * Generate a Terraform tfvars file with unique tags in a specified folder.
 * @param folderPath - The folder where the tfvars file will be generated.
 * @param rules - The list of rules containing potentially undefined tags.
 */
export function generateTfvars(folderPath: string, rules: Model.Rule[]): void {
  // Collect all tags from rules, only if they are defined.
  const allTags: Model.Tag[] = rules
    .filter((rule) => rule.tags !== undefined) // Ensure rule.tags is defined
    .flatMap((rule) => rule.tags as Model.Tag[]); // Flatten all tags into a single array

  // Get unique tags based on the tag name.
  const uniqueTags = allTags.filter(
    (tag, index, arr) => arr.findIndex((t) => t.name === tag.name) === index,
  );

  // Ensure each tag has a valid deviceGroup name.
  const formattedTags = uniqueTags.map((tag) => {
    const deviceGroupName = tag.deviceGroup
      ? (tag.deviceGroup as Model.Tag).name
      : 'Unknown';
    return {
      ...tag,
      deviceGroup: deviceGroupName,
    };
  });

  // Create a Terraform-friendly string from the JSON.
  let terraformContent = JSON.stringify({ tags: formattedTags }, null, 1);
  terraformContent = terraformContent
    .replace(/"([^"]+)":/g, '$1:') // Convert to Terraform syntax.
    .slice(1)
    .slice(0, -1)
    .replace(/:/g, '='); // Change JSON formatting to Terraform format.

  // Write the tfvars content to the specified file.
  writeFile(folderPath, fileName, terraformContent);
}

/**
 * Generate Terraform resource in the main.tf file in a specified folder.
 * @param folderPath - The folder where the main.tf file will be generated.
 */
export function generateTerraform(folderPath: string): void {
  const terraformResource = `
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
`;

  // Write the Terraform resource to the main.tf file.
  writeFile(folderPath, 'main.tf', terraformResource);
}
