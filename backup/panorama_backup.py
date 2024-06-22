import requests
import argparse
# from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient
import xml.dom.minidom

# Function to retrieve configuration
def get_panorama_config(panorama_ip, username, password):
    # Set up API endpoint
    api_url = f"https://{panorama_ip}/api/?type=export&category=configuration&key={password}"

    # Make the request
    # response = requests.(api_url, verify=False, auth=(username, password))
    response = requests.get(api_url, verify=False)
    # Check if the request was successful
    if response.status_code == 200:
        # Define your Azure Storage Account connection string
        # connect_str = "your_connection_string"
        # Define the name of the container where the backup will be stored
        # container_name = "your_container_name"
        
        # Specify the file path to save the backup
        file_path = 'panorama_config_backup.xml'

        dom = xml.dom.minidom.parseString(response.content)
        pretty_xml_as_string = dom.toprettyxml()
        f = open(file_path, "w")
        f.write(pretty_xml_as_string)get
        f.close()
        
        # Write the backup data to a file
         #with open(file_path, 'wb') as f:
         #    f.write(response.content)
            
        # Upload the backup data to Azure Blob Storage
        # blob_service_client = BlobServiceClient.from_connection_string(connect_str)
        # container_client = blob_service_client.get_container_client(container_name)
        # blob_client = container_client.get_blob_client(file_name)
        # blob_client.upload_blob(response.content)
        
        print("Configuration backup saved successfully to:", file_path)
        return "Done"
    else:
        print("Failed to retrieve configuration backup:", response.status_code)
        return None

# Main function
def main():
    # Argument parsing
    parser = argparse.ArgumentParser(description="Retrieve Panorama configuration")
    parser.add_argument("--ip", required=True, help="Panorama IP address")
    parser.add_argument("--username", required=True, help="Panorama username")
    parser.add_argument("--password", required=True, help="Panorama password")
    args = parser.parse_args()

    # Retrieve configuration
    config = get_panorama_config(args.ip, args.username, args.password)
    if config:
        print(config)
    else:
        print("Failed to retrieve configuration.")

if __name__ == "__main__":
    main()