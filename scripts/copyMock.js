const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('../AiStudio/src/data/mockData.ts');
let content = fs.readFileSync(srcFile, 'utf8');

// Ensure output dir exists
fs.mkdirSync(path.resolve('src/data'), { recursive: true });

// Also let's inspect the device object structure in mockData.ts
fs.writeFileSync(path.resolve('src/data/mockData.ts'), content);
console.log('Successfully copied mockData.ts');
