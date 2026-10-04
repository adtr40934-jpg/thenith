const fs = require('fs');
const path = require('path');

const dirs = [
  'c:/Users/Adam/Desktop/thenith/site/SITE/BACKEND/src',
  'c:/Users/Adam/Desktop/thenith/site/DASH/back/src'
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes('Conversation')) {
        content = content.replace(/Conversation/g, 'CustomerService');
        changed = true;
      }
      if (content.includes('conversation')) {
        content = content.replace(/conversation/g, 'customerService');
        changed = true;
      }

      if (file === 'Conversation.js' || file === 'CustomerService.js') {
        content = content.replace(/"tickets"/g, '"customerservice"');
        content = content.replace(/'tickets'/g, '"customerservice"');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }

      if (file.includes('Conversation')) {
        const newName = file.replace(/Conversation/g, 'CustomerService');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed ${fullPath} to ${newPath}`);
      }
      if (file.includes('conversation')) {
        const newName = file.replace(/conversation/g, 'customerService');
        const newPath = path.join(dir, newName);
        fs.renameSync(fullPath, newPath);
        console.log(`Renamed ${fullPath} to ${newPath}`);
      }
    }
  }
}

dirs.forEach(processDir);
