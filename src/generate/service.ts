import * as Model from '../model';
import { writeFile } from '../shared';

const fileName = 'terraform_service_objects.auto.tfvars';

/**
 * Generate the tfvars file in JSON format with Service objects.
 * @param folderPath - The folder where the tfvars file will be generated.
 * @param rules - The list of rules that may contain service objects.
 */
export function generateTfvars(folderPath: string, rules: Model.Rule[]): void {
  // Collect all services, ensuring `services` is defined and of type object.
  const allServices: Model.Service[] = rules
    .filter((rule) => Array.isArray(rule.services))
    .flatMap((rule) => rule.services as Model.Service[]);

  // Get unique services based on their names.
  const uniqueServices = allServices.filter(
    (service, index, arr) =>
      service?.name && arr.findIndex((s) => s.name === service.name) === index,
  );

  // Remove specific services that should not be included.
  const excludedNames = ['service-https', 'service-http', '*'];
  const filteredServices = uniqueServices.filter(
    (service) => !excludedNames.includes(service.name),
  );

  // Ensure `deviceGroup.name` is safe and valid.
  const formattedServices = filteredServices.map((service) => ({
    ...service,
    deviceGroup: (service.deviceGroup as Model.Service)?.name || 'Unknown', // Use 'Unknown' if undefined
  }));

  // Create Terraform-friendly JSON with necessary modifications.
  let terraformContent = JSON.stringify({ services: formattedServices }, null, 1)
    .replace(/"([^"]+)":/g, '$1:') // Convert JSON keys to Terraform syntax.
    .slice(1)
    .slice(0, -1) // Remove outer curly braces.
    .replace(/:/g, '='); // Change JSON formatting to Terraform-friendly format.

  // Write the tfvars content to the specified file.
  writeFile(folderPath, fileName, terraformContent);
}

/**
 * Append a Terraform resource definition to the main.tf file.
 * @param folderPath - The folder where the main.tf file will be generated.
 */
export function generateTerraform(folderPath: string): void {
  const terraformResource = `
resource "panos_panorama_service_object" "services" {
  depends_on       = [panos_panorama_administrative_tag.tags]
  count            = length(var.services)
  name             = var.services[count.index].name
  description      = var.services[count.index].description
  device_group     = var.services[count.index].deviceGroup
  protocol         = var.services[count.index].protocol
  destination_port = var.services[count.index].destinationPort
  tags             = var.services[count.index].tags

  lifecycle {
    create_before_destroy = true
  }
}
`;

  // Write the Terraform resource definition to the main.tf file.
  writeFile(folderPath, 'main.tf', terraformResource);
}
