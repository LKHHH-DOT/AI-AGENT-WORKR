const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const parts = pkg.version.split('.').map(Number);

const cmd = process.argv[2] || 'show';
if (cmd === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
else if (cmd === 'minor') { parts[1]++; parts[2] = 0; }
else if (cmd === 'patch') { parts[2]++; }

const newVersion = parts.join('.');
if (cmd !== 'show') {
    pkg.version = newVersion;
    fs.writeFileSync(path.join(__dirname, '..', 'package.json'), JSON.stringify(pkg, null, 4), 'utf8');
    console.log('版本更新为: ' + newVersion);
} else {
    console.log('当前版本: ' + pkg.version);
    console.log('用法: node scripts/version.js [major|minor|patch|show]');
}