
 address_groups= [
  {
   name= "group1",
   description= "Address Group",
   deviceGroup= "cngfw-az-company-weu",
   addresses= [
    "snet-10.0.0.0-pre-8",
    "snet-172.18.1.0-pre-24"
   ],
   tags= [
    "Demo"
   ]
  },
  {
   name= "group2",
   description= "Address Group",
   deviceGroup= "cngfw-az-company-weu",
   addresses= [
    "snet-10.0.0.0-pre-8",
    "snet-172.18.1.0-pre-24",
    "snet-172.18.2.0-pre-24"
   ],
   tags= [
    "Demo"
   ]
  },
  {
   name= "group3",
   description= "Address Group",
   deviceGroup= "cngfw-az-company-weu",
   addresses= [
    "snet-172.18.2.0-pre-24",
    "snet-10.0.0.0-pre-16"
   ],
   tags= [
    "Demo"
   ]
  }
 ]

 addresses= [
  {
   name= "snet-10.0.0.0-pre-8",
   description= "Subnet 10.0.0.0/8 with range from 10.0.0.1 to 10.255.255.254",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "10.0.0.0/8",
   tags= [
    "Demo"
   ],
   addressGroups= [
    {
     name= "group1",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    },
    {
     name= "group2",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    }
   ]
  },
  {
   name= "snet-172.18.1.0-pre-24",
   description= "Subnet 172.18.1.0/24 with range from 172.18.1.1 to 172.18.1.254",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.1.0/24",
   tags= [
    "Demo"
   ],
   addressGroups= [
    {
     name= "group1",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    },
    {
     name= "group2",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    }
   ]
  },
  {
   name= "snet-172.18.2.0-pre-24",
   description= "Subnet 172.18.2.0/24 with range from 172.18.2.1 to 172.18.2.254",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.2.0/24",
   tags= [
    "Demo"
   ],
   addressGroups= [
    {
     name= "group2",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    },
    {
     name= "group3",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    }
   ]
  },
  {
   name= "172.18.1.3",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.1.3",
   tags= [
    "Demo"
   ],
   addressGroups= []
  },
  {
   name= "pc2",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.1.4",
   tags= [
    "Demo"
   ],
   addressGroups= []
  },
  {
   name= "snet1",
   description= "Subnet 10.0.0.0/10 with range from 10.0.0.1 to 10.63.255.254",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "10.0.0.0/10",
   tags= [
    "Demo"
   ],
   addressGroups= []
  },
  {
   name= "pc1",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.122.6",
   tags= [
    "Demo"
   ],
   addressGroups= []
  },
  {
   name= "snet-10.0.0.0-pre-16",
   description= "Subnet 10.0.0.0/16 with range from 10.0.0.1 to 10.0.255.254",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "10.0.0.0/16",
   tags= [
    "Demo"
   ],
   addressGroups= [
    {
     name= "group3",
     description= "Address Group",
     deviceGroup= {
      name= "cngfw-az-company-weu"
     },
     tags= [
      {
       name= "Demo",
       color= "color12",
       deviceGroup= {
        name= "Company-DEV"
       },
       comment= "Application tag"
      }
     ]
    }
   ]
  },
  {
   name= "range-172.18.2.5-to-172.18.2.10",
   description= "IP range from 172.18.2.5 to 172.18.2.10",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-range",
   value= "172.18.2.5-172.18.2.10",
   tags= [
    "Demo"
   ],
   addressGroups= []
  },
  {
   name= "addr",
   deviceGroup= "cngfw-az-company-weu",
   type= "ip-netmask",
   value= "172.18.2.5",
   tags= [
    "Demo"
   ],
   addressGroups= []
  }
 ]
