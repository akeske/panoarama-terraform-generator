import * as Model from '../model';
import { writeFile } from '../shared';

const fileName = 'terraform_url_categories.auto.tfvars';

/**
 * Generate the Terraform variable file in JSON format with the UrlCategory objects.
 * @param folderPath - Path where the tfvars file will be generated.
 * @param rules - The Rule objects containing URL categories.
 */
export function generateTfvars(folderPath: string, rules: Model.Rule[]): void {
  const urlCategories: Model.UrlCategory[] = [];
  // Extract URL categories from rules
  rules.forEach((rule) => {
    if (rule.categories) {
      rule.categories.forEach((category: Model.UrlCategory) => {
        // Ensure only UrlCategory objects are added to the array
        if (typeof category !== 'string') {
          urlCategories.push(category);
        }
      });
    }
  });

  // Assign device group names if necessary and remove categories without sites
  const uniqueCategories = urlCategories
    .map((url) => {
      // Convert deviceGroup to string if needed
      if (typeof url.deviceGroup !== 'string' && url.deviceGroup) {
        url.deviceGroup = url.deviceGroup.name;
      }
      return url;
    })
    .filter((category) => category.sites && category.sites.length > 0);

  // Remove duplicates based on the 'name' property
  const deduplicatedCategories = uniqueCategories.filter(
    (category, index, self) =>
      self.findIndex((cat) => cat.name === category.name) === index,
  );

  const terraString = JSON.stringify({ url_categories: deduplicatedCategories }, null, 1)
    .replace(/"([^"]+)":/g, '$1:')
    .slice(1)
    .slice(0, -1)
    .replace(/:/g, '=');

  writeFile(folderPath, fileName, terraString);
}

/**
 * Append on main.tf the terraform resource
 * @param {string} folderPath - The input string
 */
export function generateTerraform(folderPath: string): void {
  let terraString = `
resource "panos_custom_url_category" "url_category" {
  count        = length(var.url_categories)
  name         = var.url_categories[count.index].name
  device_group = var.url_categories[count.index].deviceGroup
  description  = var.url_categories[count.index].description
  sites        = var.url_categories[count.index].sites
  type         = "URL List"

  lifecycle {
    create_before_destroy = true
  }
}
`;

  writeFile(folderPath, 'main.tf', terraString);
}
