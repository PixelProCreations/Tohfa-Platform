const fs = require('fs');
const path = require('path');
const p = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/admin/screens/dashboard/index.ts';
let content = fs.readFileSync(p, 'utf8');
content = content.replace(/from '\.\/SubWarehouse(.*)'/g, "from '../../../subwarehouse/screens/SubWarehouse$1'");
fs.writeFileSync(p, content);
console.log('Updated dashboard index');
