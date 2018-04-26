const {execSync} = require('child_process');
const path = require('path');

const createObjectByArrayKey = (key, obj, dir) => {
    if (key.length == 0) {
        obj.config = dir;
        return obj;
    }
    else {
        let _key = key.shift();
        obj[_key] = obj[_key] || {};
        return createObjectByArrayKey(key, obj[_key], dir);
    }
}

const vmlistParse = line => {
    let [name, value] = line.split(' = ');
    let index = parseInt(name.substring(6, name.indexOf('.'))) - 1;
    let prop = name.substring(name.indexOf('.') + 1);
    value = value.substr(1, value.length - 2);

    if (prop === 'config' && value.indexOf('folder') === 0) {
        value = 'folder';
    }
    return {index, prop, value};
}

module.exports = {
    '.encoding': "windows-1252",
    get encoding() {
        return this['.encoding'];
    },
    set encoding(value) {
        this['.encoding'] = value;
    },
    get lists(){
        return this['.lists'];
    },
    '.lists': [],
    insertFolder({name, parent = 0}) {
        if (name == null) throw Error(`folderInsert require name`);
        let vmlist = {
            config: 'folder' + (this['.lists'].length + 1).toString(),
            Type: 2,
            DisplayName: name,
            ParentID: parent,
            ItemID: this['.lists'].length + 1
        };
        this['.lists'].push(vmlist);
        return vmlist;
    },
    insertVm({name, parent = 0, vmxPath}) {
        if (vmxPath == null || name == null) throw Error(`vmInsert require name and vmxPath`);
        let vmlist = {
            config: vmxPath,
            DisplayName: name,
            ParentID: parent,
            ItemID: this['.lists'].length + 1
        };
        this['.lists'].push(vmlist);
        return vmlist;
    },
    toString(){
        let content = [];
        content.push(`.encoding = ${this.encoding}`);
        this['.lists'].forEach((vmlist, index) => {
            for (let key in vmlist) {
                content.push(`vmlist${index + 1}.${key} = "${vmlist[key]}"`);
            }
        });
        return content.join('\n');
    },
    parse(content){
        content = content.split('\n');
        if (content[0].charAt(0) == '.') {
            let line = content.shift();
            let [key, value] = line.split(' = ');
            this.encoding = value.substr(1, value.length - 2);
        }
        for (let i = 0; i < content.length; i ++){
            let line = content[i];
            if (line.indexOf('vmlist') !== 0) break;

            let {index, prop, value} = vmlistParse(line);

            this['.lists'][index] = this['.lists'][index] || {};
            this['.lists'][index][prop] = value;
        };
        return this;
    },
    minimal(){
        this['.lists'] = this['.lists'].map(vmlist=>{
            let {config, DisplayName, ParentID, ItemID} = vmlist;
            if (config == ''){
                return {config};
            }
            else {
                return {config, DisplayName, ParentID, ItemID};
            }
        });
        return this;
    },
    scanVm(scanDir) {
        let lists = execSync(`dir /s /b ${scanDir} | find ".vmx" | find /v ".vmxf"`).toString().trim().split('\r\n');

        let vmlsObject = {};
        lists.forEach(fullDir => {
            if (fullDir.indexOf(scanDir + '$RECYCLE.BIN') === 0) return;
            let _dir = fullDir.substr(scanDir.length).split(path.sep);
            let _file = _dir.pop();
            createObjectByArrayKey(_dir, vmlsObject, fullDir);
        });
        const insertFolderByObject = (obj, parent = 0) => {
            Object.keys(obj).forEach(name => {
                if (typeof obj[name].config == 'string'){
                    this.insertVm({
                        name,
                        vmxPath: obj[name].config,
                        parent
                    });
                    return
                }
                let vmlist = this.lists.find(vmlist => vmlist.DisplayName === name);
                if (vmlist == null) {
                    vmlist = this.insertFolder({name, parent});
                }
                insertFolderByObject(obj[name], vmlist.ItemID);
            });
        }
        insertFolderByObject(vmlsObject, 0);
    }
}