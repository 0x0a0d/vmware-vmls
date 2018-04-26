#vmware-vmls

[Now just support Windows]

Scan path and add found vmx file to vmware

#Example

    D:\Vmware Machines
                        \Job
                            \Win7
                                \Win7.vmx
                        \Funny
                            \Win10
                                \Win10.vmx
    

```javascript
const vmls = require('vmware-vmls');
const fs = require('fs');

// Current inventory vmware list
const vmls_file = 'C:/Users/Username/AppData/Roaming/VMware/inventory.vmls';
// Scan this path and put results to inventory
// Please notice that in window's path you must use \\ instead of \
const scanPath = 'D:\\';

// Load current vmware list
vmls.parse(fs.readFileSync(vmls_file).toString());
// Scan vm
vmls.scanVm(scanPath);
// new inventory
let inventory = vmls.toString();
// write it to inventory file
fs.writeFileSync(vmls_file, vmls.toString());
```

#Refs

  * encoding: default windows-1252
  * lists: [get only] return parsed inventory lists
  * insertFolder({name, parent = 0}): insert new folder to VMware
    * name: folder name
    * parent: parent folder ItemID, 0 mean belong to root
  * insertVm({name, parent = 0, vmxPath}): insert vm
    * name: vm name
    * parent: parent folder ItemID, 0 mean belong to root
    * vmxPath: full path to vmx
  * parse(inventory_content_string): parse inventory.vmls to .lists
  * minimal(): minimal inventory lists. All setting like eth static MAC, uuid, seqId will be removed
  * scanDir(path_scan): scan folder and add found result vmx to lists
    * path_scan: full path to scan folder