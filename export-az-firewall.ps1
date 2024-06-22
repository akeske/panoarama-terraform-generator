Connect-AzAccount
Set-AzContext -Subscription "Management" -Tenant "xxxxxxxx-yyy-yyy-yyy-zzzzzzzzzzz"
 
$workspaceName = "Log-Anal"
$workspaceRG = "rg-management"
$WorkspaceID = (Get-AzOperationalInsightsWorkspace -Name $workspaceName -ResourceGroupName $workspaceRG).CustomerID
 
Set-AzContext -Subscription "Connectivity"
 
$fprg = "Connectivity-NET-RG"
$fpname = "FW-Policy"
$specificRuleCollection = "collection1"
 
$fp = Get-AzFirewallPolicy -Name $fpname -ResourceGroupName $fprg
# Write-Host ($fp | Format-List | Out-String)
 
foreach ($ruleColGroup in $fp.RuleCollectionGroups) {
    $rcg = Get-AzFirewallPolicyRuleCollectionGroup -Name $ruleColGroup.Id.Split("/")[10] -AzureFirewallPolicy $fp
	Write-Host $rcg.Name
	if ($rcg.Name -eq $specificRuleCollection) {
    $returnObj = @()
    foreach ($ruleCol in $rcg.Properties.RuleCollection) {
        foreach ($rule in $ruleCol.rules) {
            $sourceIPs = @()
            foreach ($ipGroupId in $rule.SourceIPGroups) {
                $ipGroup = Get-AzIpGroup -ResourceId $ipGroupId
                $sourceIPs += $ipGroup.IpAddresses
            }
            $destinationIPs = @()
            foreach ($ipGroupId in $rule.DestinationIpGroups) {
                $ipGroup = Get-AzIpGroup -ResourceId $ipGroupId
                $destinationIPs += $ipGroup.IpAddresses
            }
 
            $query = "AzureDiagnostics
                | where Category == 'AzureFirewallNetworkRule'
                | where OperationName == 'AzureFirewallNatRuleLog' or OperationName == 'AzureFirewallNetworkRuleLog'
                | where TimeGenerated > ago(5d)
                | parse msg_s with * ' Rule Collection: '  RuleCollection '. Rule: ' Rule 
                | where Rule == '" + $rule.Name + "'
                | summarize Count=count() by Rule"
            $kqlQuery = Invoke-AzOperationalInsightsQuery -WorkspaceId $WorkspaceID -Query $query
            $hits = $kqlQuery.Results.Count
 
            $properties = [ordered]@{
                    RuleCollectionName = $rulecol.Name;
                    RuleCollectionType = $rulecol.RuleCollectionType;
                    Tags = "";
                    # RulePriority = $rulecol.Priority;
                    # ActionType = $rulecol.Action.Type;
                    Hits = $hits;
                    Name = $rule.Name;
                    # protocols = $rule.protocols -join ", ";
                    SourceAddresses = $rule.SourceAddresses -join ", ";
                    sourceIPs = $sourceIPs -join ", ";
                    DestinationAddresses = $rule.DestinationAddresses -join ", ";
                    DestinationIPs = $destinationIPs -join ", ";
                    DestinationPorts = $rule.DestinationPorts -join ", ";
                    DestinationFQDNs = $rule.DestinationFQDNs -join ", ";
                    SourceIPGroups = $rule.SourceIPGroups -join ", ";
                    DestinationIPGroups = $rule.DestinationIPGroups -join ", ";
                }
            $obj = New-Object psobject -Property $properties
            $returnObj += $obj
        }
    }
    # echo $returnObj
    $path = "C:\Users\A.Keskempes\Documents\Panorama\Terraform\data\company-az\weu\AzureFirewallExport\" + $ruleColGroup.Id.Split("/")[10] + ".csv"
    $returnObj | Export-Csv $path -NoTypeInformation -Delimiter ';'
	}
}
 