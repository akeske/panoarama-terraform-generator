
 rule_groups= [
  {
   deviceGroup= "cngfw-az-company-weu",
   rulebase= "pre-rulebase",
   rules= [
    {
     name= "A1--Srv",
     description= "a1.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group1"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group1"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A2--Srv",
     description= "a2.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "snet1"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A3--Srv",
     description= "a3.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group2"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group2"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "172.18.1.3",
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Prod",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A4--Srv",
     description= "a4.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group2"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group2"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc2"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Prod",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A5--Srv",
     description= "a5.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group2"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group2"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1",
      "pc2"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Prod",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A6--Srv",
     description= "a6.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "snet1"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A7--Srv",
     description= "a7.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group3"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group3"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A8--Srv",
     description= "a8.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "snet-10.0.0.0-pre-16"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A9--Srv",
     description= "a9.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group2",
      "group3"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A10--Srv",
     description= "Business purpose= 'will convert to address to pc1'.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group3"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "service-https"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A11--Srv",
     description= "a11.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group3"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group3"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "srv-dns-tcp",
      "srv-ms-rdp-tcp"
     ],
     applications= [
      "any"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage",
      "ServiceRule"
     ],
     log= "true"
    },
    {
     name= "A12",
     description= "a12.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "group3"
     ],
     sourceIsAddressGroup= true,
     sourceAddressGroupNames= [
      "group3"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "application-default"
     ],
     applications= [
      "ms-ds-smbv3",
      "ms-ds-smb-base"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage"
     ],
     log= "true"
    },
    {
     name= "A13",
     description= "a13.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "range-172.18.2.5-to-172.18.2.10"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "application-default"
     ],
     applications= [
      "ntp-base"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage"
     ],
     log= "true"
    },
    {
     name= "A14",
     description= "a14.",
     disabled= "false",
     groupTag= "Demo",
     sourceZones= [
      "Private"
     ],
     sourceAddresses= [
      "addr"
     ],
     destinationZones= [
      "Private"
     ],
     destinationAddresses= [
      "pc1"
     ],
     services= [
      "application-default"
     ],
     applications= [
      "ntp-base"
     ],
     categories= [
      "any"
     ],
     action= "allow",
     tags= [
      "Stage"
     ],
     log= "true"
    }
   ]
  }
 ]
